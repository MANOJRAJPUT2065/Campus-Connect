import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaUsers, FaCalendar, FaClock, FaPlay, FaPlus, FaSignOutAlt, FaEye, FaHistory, FaArrowRight, FaLaptop, FaBook } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import { jwtDecode } from 'jwt-decode';
import TeacherMaterialUpload from '../Components/TeacherMaterialUpload';
import TeacherMaterials from '../Components/TeacherMaterials';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [view, setView] = useState('sessions'); // 'sessions' or 'materials'
  const [formData, setFormData] = useState({
    title: '',
    branch: '',
    semester: '',
    maxParticipants: 50,
    allowChat: true,
    allowScreenShare: true,
    allowRecording: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'teacher') {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserInfo({
        userId: decoded.email || decoded.sub,
        userName: decoded.username || decoded.name || decoded.email,
        email: decoded.email || decoded.sub
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/');
    }
  }, []);

  // Fetch sessions once user info is available
  useEffect(() => {
    if (userInfo?.email || userInfo?.userId) {
      fetchSessions();
    }
  }, [userInfo]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const instructorId = userInfo?.email || userInfo?.userId;
      if (!instructorId) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(buildApiUrl(`/api/sessions/teacher/${instructorId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Please enter class title');
      return;
    }

    if (!formData.branch || !formData.semester) {
      toast.error('Please enter branch/department and semester');
      return;
    }

    const semesterNumber = parseInt(formData.semester, 10);
    if (Number.isNaN(semesterNumber)) {
      toast.error('Semester must be a number');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const instructorId = userInfo?.email || userInfo?.userId;
      const response = await fetch(buildApiUrl('/api/sessions/create'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          instructorId,
          instructorName: userInfo?.userName,
          branch: formData.branch.trim().toLowerCase(),
          semester: semesterNumber,
          maxParticipants: parseInt(formData.maxParticipants),
          duration: '60 min',
          description: 'Class session'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Session created! Starting class...');
        setShowCreateModal(false);
        setFormData({ title: '', branch: '', semester: '', maxParticipants: 50, allowChat: true, allowScreenShare: true, allowRecording: true });
        // Refresh sessions list first to update local state
        await fetchSessions();
        // Then navigate using the channelName from response
        setTimeout(() => {
          navigate(`/join/${data.session.channelName}`);
        }, 500);
      } else {
        toast.error(data.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const startSession = async (channelName) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(buildApiUrl(`/api/sessions/${channelName}/start`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh list so status flips to live
      fetchSessions();
    } catch (e) {
      console.error('Start session error', e);
    } finally {
      navigate(`/join/${channelName}`);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(buildApiUrl(`/api/sessions/${sessionId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await resp.json();
      if (data.success) {
        toast.success('Session deleted');
        setSessions((prev) => prev.filter((s) => (s._id || s.id) !== sessionId));
      } else {
        toast.error(data.error || 'Failed to delete session');
      }
    } catch (err) {
      console.error('Delete session error:', err);
      toast.error('Failed to delete session');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
    toast.info('Logged out successfully');
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {userInfo.userName}</p>
              <p className="text-xs text-gray-500 mt-1">📚 Academic Management Only — Classes, Attendance, Assignments, Study Materials</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/online-classes')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="View all your hosted classes"
              >
                <FaLaptop />
                View All Classes
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setView('sessions')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
              view === 'sessions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaVideo className="text-lg" />
            Classes
          </button>
          <button
            onClick={() => setView('materials')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition ${
              view === 'materials'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaBook className="text-lg" />
            Study Materials
          </button>
        </div>

        {/* Sessions View */}
        {view === 'sessions' && (
          <>
            {/* Create Session Button */}
            <div className="flex gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                <FaPlus />
                Create New Class
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMaterialModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
              >
                <FaPlus />
                Upload Study Material
              </motion.button>
            </div>

            {/* Create Session Modal */}
            <AnimatePresence>
              {showCreateModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
                  >
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Class</h2>
                    
                    <form onSubmit={handleCreateSession} className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Class Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Introduction to Web Development"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Branch/Department</label>
                        <input
                          type="text"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                          placeholder="e.g., CSE, ECE"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Semester</label>
                        <select
                          value={formData.semester}
                          onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select semester</option>
                          {[1,2,3,4,5,6,7,8].map((sem) => (
                            <option key={sem} value={sem}>{`Semester ${sem}`}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Max Participants</label>
                        <input
                          type="number"
                          value={formData.maxParticipants}
                          onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                          min="1"
                          max="500"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-gray-700 font-medium">Features</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.allowChat}
                              onChange={(e) => setFormData({ ...formData, allowChat: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700">Enable Chat</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.allowScreenShare}
                              onChange={(e) => setFormData({ ...formData, allowScreenShare: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700">Enable Screen Share</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.allowRecording}
                              onChange={(e) => setFormData({ ...formData, allowRecording: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700">Enable Recording</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Start Class
                        </button>
                      </div>
                    </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

            {/* Sessions List */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Active & Upcoming Classes</h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center">
                  <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No active classes yet</p>
                  <p className="text-gray-400 mt-2">Create your first class to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex-1">{session.title}</h3>
                            {session.status === 'live' && (
                              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-gray-600">
                              <FaCalendar size={16} />
                              <span>{(session.branch || 'N/A').toUpperCase()} • Sem {session.semester ?? '-'} </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <FaUsers size={16} />
                              <span>{session.participants?.length || 0} / {session.maxParticipants} Joined</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <FaClock size={16} />
                              <span>Started {new Date(session.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => startSession(session.channelName)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                              <FaPlay size={14} />
                              Join Class
                            </button>
                            <button
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              title="View Participants"
                            >
                              <FaEye size={14} />
                            </button>
                            <button
                              onClick={() => deleteSession(session._id || session.id)}
                              className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Class"
                            >
                              <FaSignOutAlt size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Classes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{sessions.length}</p>
                  </div>
                  <FaVideo className="text-4xl text-blue-600 opacity-20" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Participants</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {sessions.reduce((sum, s) => sum + (s.participants?.length || 0), 0)}
                    </p>
                  </div>
                  <FaUsers className="text-4xl text-green-600 opacity-20" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Now</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {sessions.filter(s => s.status === 'live').length}
                    </p>
                  </div>
                  <FaPlay className="text-4xl text-red-600 opacity-20" />
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Materials View */}
        {view === 'materials' && (
          <div className="space-y-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMaterialModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
            >
              <FaPlus />
              Upload New Material
            </motion.button>
            <TeacherMaterials />
          </div>
        )}
      </div>

      {/* Material Upload Modal */}
      {showMaterialModal && (
        <TeacherMaterialUpload
          isOpen={showMaterialModal}
          onClose={() => setShowMaterialModal(false)}
          onMaterialCreated={() => {
            setShowMaterialModal(false);
            toast.success('Study material uploaded successfully!');
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
