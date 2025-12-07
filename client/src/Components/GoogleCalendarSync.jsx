import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaGoogle, FaCalendarAlt, FaSync, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

const GoogleCalendarSync = ({ eventId, eventData, onSyncComplete }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [syncStatus, setSyncStatus] = useState('not-synced'); // not-synced, syncing, synced, error

  useEffect(() => {
    // Check if user has connected calendar
    const token = localStorage.getItem('googleCalendarToken');
    if (token) {
      setAccessToken(token);
      setIsConnected(true);
      
      // Check if this event is already synced
      if (eventData?.googleCalendarId) {
        setSyncStatus('synced');
      }
    }
  }, [eventData]);

  const connectGoogleCalendar = async () => {
    try {
      setIsLoading(true);
      
      // Get OAuth URL from backend
      const response = await fetch(buildApiUrl('/api/calendar/auth'));
      const data = await response.json();
      
      if (data.authUrl) {
        // Open OAuth popup
        const popup = window.open(
          data.authUrl,
          'googleOAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for OAuth callback
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
          }
        }, 1000);

        // Listen for message from popup
        window.addEventListener('message', async (event) => {
          if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
            const { code } = event.data;
            
            try {
              // Exchange code for tokens
              const tokenResponse = await fetch(buildApiUrl('/api/calendar/callback'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
              });
              
              const tokenData = await tokenResponse.json();
              
              if (tokenData.success) {
                setAccessToken(tokenData.tokens.access_token);
                setIsConnected(true);
                localStorage.setItem('googleCalendarToken', tokenData.tokens.access_token);
                toast.success('Google Calendar connected successfully!');
                popup.close();
              }
            } catch (error) {
              console.error('Token exchange error:', error);
              toast.error('Failed to connect calendar');
            }
          }
        });
      }
    } catch (error) {
      console.error('Calendar connection error:', error);
      toast.error('Failed to connect Google Calendar');
      setIsLoading(false);
    }
  };

  const syncEventToCalendar = async () => {
    if (!accessToken || !eventId) {
      toast.error('Please connect your Google Calendar first');
      return;
    }

    try {
      setIsLoading(true);
      setSyncStatus('syncing');

      const response = await fetch(buildApiUrl('/api/calendar/sync-event'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, accessToken })
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus('synced');
        toast.success('Event synced to Google Calendar!');
        if (onSyncComplete) {
          onSyncComplete(data.googleEventId);
        }
      } else {
        setSyncStatus('error');
        toast.error(data.error || 'Failed to sync event');
      }
    } catch (error) {
      console.error('Event sync error:', error);
      setSyncStatus('error');
      toast.error('Failed to sync event to calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectCalendar = () => {
    setAccessToken(null);
    setIsConnected(false);
    setSyncStatus('not-synced');
    localStorage.removeItem('googleCalendarToken');
    toast.info('Google Calendar disconnected');
  };

  const getSyncButtonText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced ✓';
      case 'error':
        return 'Retry Sync';
      default:
        return 'Sync to Calendar';
    }
  };

  const getSyncButtonColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'synced':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <FaGoogle className="text-2xl text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Google Calendar Sync</h3>
            <p className="text-sm text-gray-600">Sync events with your personal calendar</p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center space-x-2 text-green-600">
            <FaCheckCircle />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={connectGoogleCalendar}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <FaGoogle />
              <span>Connect Google Calendar</span>
            </>
          )}
        </motion.button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <FaCalendarAlt className="text-gray-600" />
              <span className="text-sm text-gray-700">Calendar Status</span>
            </div>
            <div className="flex items-center space-x-2">
              {syncStatus === 'synced' && (
                <FaCheckCircle className="text-green-500" />
              )}
              {syncStatus === 'error' && (
                <FaTimesCircle className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                syncStatus === 'synced' ? 'text-green-600' :
                syncStatus === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {syncStatus === 'synced' ? 'Event Synced' :
                 syncStatus === 'error' ? 'Sync Failed' : 'Ready to Sync'}
              </span>
            </div>
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={syncEventToCalendar}
              disabled={isLoading || syncStatus === 'synced'}
              className={`flex-1 ${getSyncButtonColor()} text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50`}
            >
              <FaSync className={isLoading ? 'animate-spin' : ''} />
              <span>{getSyncButtonText()}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={disconnectCalendar}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Disconnect
            </motion.button>
          </div>

          {syncStatus === 'synced' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ This event has been successfully synced to your Google Calendar. 
                You'll receive notifications and reminders as configured.
              </p>
            </div>
          )}

          {syncStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ✗ Failed to sync event. Please try again or check your calendar permissions.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Connecting your Google Calendar allows you to automatically sync events 
          and receive reminders. Your calendar data remains private and is only used for syncing.
        </p>
      </div>
    </div>
  );
};

export default GoogleCalendarSync;
