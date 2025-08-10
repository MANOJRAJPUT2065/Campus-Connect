import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaBellSlash, FaTimes, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaCog } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    }
  }, []);

  const subscribeToNotifications = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      
      const response = await fetch('/api/features/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSubscribed(true);
        toast.success('Successfully subscribed to notifications!');
      } else {
        toast.error('Failed to subscribe to notifications');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast.error('Failed to subscribe to notifications');
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      
      const response = await fetch('/api/features/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsSubscribed(false);
        toast.success('Unsubscribed from notifications');
      } else {
        toast.error('Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe');
    }
  };

  const sendTestNotification = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'demo-user';
      
      const response = await fetch('/api/features/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'urgent':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <FaBellSlash className="text-yellow-600" />
          <span className="text-yellow-800">Push notifications are not supported in your browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaBell className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Push Notifications</h3>
            <p className="text-gray-600">Stay updated with urgent announcements and class updates</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaCog className="text-xl" />
        </motion.button>
      </div>

      {/* Notification Status */}
      <div className="mb-6">
        <div className={`p-4 rounded-lg border ${
          isSubscribed 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isSubscribed ? (
                <>
                  <FaBell className="text-green-600" />
                  <span className="text-green-800 font-medium">Notifications Enabled</span>
                </>
              ) : (
                <>
                  <FaBellSlash className="text-gray-600" />
                  <span className="text-gray-800 font-medium">Notifications Disabled</span>
                </>
              )}
            </div>
            
            {isSubscribed ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={unsubscribeFromNotifications}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Disable
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={subscribeToNotifications}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Enable
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900">Notification Settings</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-gray-700">Urgent announcements</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-gray-700">Class schedule changes</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-gray-700">Assignment deadlines</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded text-blue-600" />
                  <span className="text-gray-700">Exam notifications</span>
                </label>
              </div>

              {isSubscribed && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={sendTestNotification}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Send Test Notification
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Notifications */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Recent Notifications</h4>
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaBell className="text-4xl mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">Enable notifications to stay updated</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.body}</p>
                  <p className="text-xs text-gray-400">{notification.timestamp}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PushNotifications;
