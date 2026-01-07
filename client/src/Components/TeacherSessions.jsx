import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaStop, FaTrash, FaClock, FaUsers, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import axios from 'axios';

const TeacherSessions = ({ instructorId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchTeacherSessions();
    const interval = setInterval(fetchTeacherSessions, 15000);
    return () => clearInterval(interval);
  }, [instructorId]);

  const fetchTeacherSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        buildApiUrl(`/api/sessions/teacher/${instructorId}`),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      if (response.data.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching teacher sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: 'starting' }));
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        buildApiUrl(`/api/sessions/${sessionId}/start`),
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        toast.success('Session started! Students can now join.');
        fetchTeacherSessions();
        // Redirect teacher to session
        window.location.href = `/video-call/join/${sessionId}`;
      } else {
        toast.error(response.data.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Start session error:', error);
      toast.error(error.response?.data?.error || 'Failed to start session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const handleEndSession = async (sessionId) => {
    try {
      setActionLoading(prev => ({ ...prev, [sessionId]: 'ending' }));
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        buildApiUrl(`/api/sessions/${sessionId}/end`),
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      if (response.data.success) {
        toast.success('Session ended successfully!');
        fetchTeacherSessions();
      } else {
        toast.error(response.data.error || 'Failed to end session');
      }
    } catch (error) {
      console.error('End session error:', error);
      toast.error(error.response?.data?.error || 'Failed to end session');
    } finally {
      setActionLoading(prev => ({ ...prev, [sessionId]: null }));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-red-700 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        );
      case 'scheduled':
        return (
          <div className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            <span>Scheduled</span>
          </div>
        );
      case 'ended':
        return (
          <div className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            <span>Ended</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg"
      >
        <p className="text-gray-600 text-lg font-medium">No sessions created yet</p>
        <p className="text-gray-500 text-sm mt-2">Create your first session to get started!</p>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Sessions</h2>
      <div className="space-y-4">
        {sessions.map((session) => (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {session.title}
                  </h3>
                  {getStatusBadge(session.status)}
                </div>

                {session.description && (
                  <p className="text-gray-600 text-sm mb-3">
                    {session.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FaClock />
                    <span>{session.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaUsers />
                    <span>
                      {session.participants?.length || 0} / {session.maxParticipants}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 ml-4">
                {session.status === 'scheduled' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStartSession(session._id)}
                    disabled={actionLoading[session._id] === 'starting'}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading[session._id] === 'starting' ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <FaPlay />
                        <span>Start</span>
                      </>
                    )}
                  </motion.button>
                )}

                {session.status === 'live' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEndSession(session._id)}
                    disabled={actionLoading[session._id] === 'ending'}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading[session._id] === 'ending' ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Ending...</span>
                      </>
                    ) : (
                      <>
                        <FaStop />
                        <span>End</span>
                      </>
                    )}
                  </motion.button>
                )}

                {session.status === 'live' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = `/video-call/join/${session._id}`}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FaPlay />
                    <span>Enter</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TeacherSessions;
