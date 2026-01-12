import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaVideo, FaUsers, FaClock, FaPlay, FaSpinner, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const SessionJoin = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningSessionId, setJoiningSessionId] = useState(null);

  useEffect(() => {
    fetchLiveSessions();
    // Refresh every 10 seconds
    const interval = setInterval(fetchLiveSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      let branch = null;
      let semester = null;
      if (token) {
        try {
          const decoded = jwtDecode(token);
          branch = decoded.department || decoded.branch || null;
          semester = decoded.semester ?? null;
        } catch (err) {
          // ignore decode errors
        }
      }

      const params = new URLSearchParams();
      if (branch) params.append('branch', String(branch).toLowerCase());
      if (semester !== null && semester !== undefined) params.append('semester', semester);

      const response = await axios.get(buildApiUrl(`/api/sessions/live${params.toString() ? `?${params.toString()}` : ''}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        setSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (sessionId) => {
    try {
      setJoiningSessionId(sessionId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      // Get user info from token for reliable branch/semester matching
      let userId = localStorage.getItem('userId') || 'student';
      let userName = localStorage.getItem('username') || 'Student';
      let branch = null;
      let semester = null;
      try {
        const decoded = jwtDecode(token);
        userId = decoded.userId || decoded.email || decoded.usn || userId;
        userName = decoded.username || decoded.name || userName;
        branch = decoded.department || decoded.branch || null;
        semester = decoded.semester ?? null;
      } catch (err) {
        // fall back to local values
      }

      const response = await axios.post(
        buildApiUrl(`/api/sessions/${sessionId}/join`),
        {
          userId,
          userName,
          userRole: 'student',
          branch: branch ? String(branch).toLowerCase() : null,
          semester
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Joined session successfully!');
        // Redirect to video call
        window.location.href = `/video-call/join/${sessionId}`;
      } else {
        toast.error(response.data.error || 'Failed to join session');
      }
    } catch (error) {
      console.error('Join session error:', error);
      toast.error(error.response?.data?.error || 'Failed to join session');
    } finally {
      setJoiningSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading live sessions...</p>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">No live sessions right now</p>
        <p className="text-gray-500 text-sm mt-2">Check back later for upcoming sessions!</p>
      </motion.div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Sessions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Live Badge */}
            <div className="bg-red-600 text-white px-4 py-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">LIVE NOW</span>
            </div>

            {/* Session Content */}
            <div className="p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                {session.title}
              </h3>

              {session.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {session.description}
                </p>
              )}

              {/* Session Details */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <FaVideo className="text-blue-600" />
                  <span>Instructor: {session.instructorName || 'Instructor'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaUsers className="text-green-600" />
                  <span>
                    {session.participants?.length || 0} / {session.maxParticipants} participants
                  </span>
                </div>
                {session.duration && (
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-orange-600" />
                    <span>{session.duration} minutes</span>
                  </div>
                )}
              </div>

              {/* Participants Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ 
                    width: `${((session.participants?.length || 0) / session.maxParticipants) * 100}%` 
                  }}
                  className="bg-blue-600 h-full"
                />
              </div>

              {/* Join Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleJoinSession(session._id)}
                disabled={joiningSessionId === session._id}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {joiningSessionId === session._id ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <FaPlay />
                    <span>Join Now</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SessionJoin;
