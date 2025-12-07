import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaVideo, FaUser, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import VideoCall from '../Components/VideoCall';
import { jwtDecode } from 'jwt-decode';

const JoinVideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [joinData, setJoinData] = useState(null);

  useEffect(() => {
    fetchSessionInfo();
    getUserInfo();
  }, [sessionId]);

  const getUserInfo = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        setUserInfo({
          userId: decoded.email || decoded.usn || 'guest',
          userName: decoded.username || 'Guest User',
          email: decoded.email
        });
      } else {
        setUserInfo({
          userId: `guest-${Date.now()}`,
          userName: 'Guest User',
          email: null
        });
      }
    } catch (err) {
      setUserInfo({
        userId: `guest-${Date.now()}`,
        userName: 'Guest User',
        email: null
      });
    }
  };

  const fetchSessionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`/api/videocall/session/${sessionId}`));
      const data = await response.json();

      if (data.success) {
        setSessionInfo(data.session);
      } else {
        setError(data.error || 'Session not found');
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load session. Please check the link.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!userInfo || !sessionInfo) return;

    try {
      setIsJoining(true);
      
      // Join the session via backend
      const response = await fetch(buildApiUrl('/api/videocall/join-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          userId: userInfo.userId,
          userName: userInfo.userName,
          userRole: 'student'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store join data for VideoCall component
        setJoinData(data);
        // Update session info with channel name from response
        if (data.channelName) {
          setSessionInfo(prev => ({
            ...prev,
            channelName: data.channelName
          }));
        }
        setHasJoined(true);
        toast.success('Joining video call...');
      } else {
        toast.error(data.error || 'Failed to join session');
      }
    } catch (err) {
      console.error('Error joining session:', err);
      toast.error('Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  if (hasJoined && sessionInfo && joinData) {
    return (
      <VideoCall
        channelName={joinData.channelName || sessionInfo.channelName}
        sessionId={sessionId}
        roomTitle={sessionInfo.title}
        onClose={() => {
          navigate('/online-classes');
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 border border-gray-700 text-center"
        >
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Session Not Found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/online-classes')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-gray-700"
      >
        {/* Session Info */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaVideo className="text-2xl text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{sessionInfo?.title || 'Video Call'}</h2>
          <p className="text-gray-400 text-sm">
            Hosted by: {sessionInfo?.instructorName || 'Instructor'}
          </p>
        </div>

        {/* User Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <FaUser className="text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{userInfo?.userName || 'Guest'}</p>
              <p className="text-gray-400 text-sm">{userInfo?.email || 'Guest User'}</p>
            </div>
          </div>
        </div>

        {/* Media Controls */}
        <div className="mb-6 space-y-3">
          <p className="text-gray-300 text-sm font-medium">Media Settings</p>
          <div className="flex space-x-4">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
                audioEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
              <span className="text-sm">{audioEnabled ? 'Mic On' : 'Mic Off'}</span>
            </button>
            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg transition-colors ${
                videoEnabled
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
              <span className="text-sm">{videoEnabled ? 'Camera On' : 'Camera Off'}</span>
            </button>
          </div>
        </div>

        {/* Session Stats */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Participants:</span>
            <span className="text-white font-medium">{sessionInfo?.participants || 0} / {sessionInfo?.maxParticipants || 50}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-400">Status:</span>
            <span className={`font-medium ${
              sessionInfo?.status === 'live' ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {sessionInfo?.status === 'live' ? 'Live' : 'Waiting'}
            </span>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isJoining ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Joining...</span>
            </>
          ) : (
            <>
              <FaVideo />
              <span>Join Video Call</span>
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/online-classes')}
          className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};

export default JoinVideoCall;

