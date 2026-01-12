import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaUsers, FaCalendar, FaClock, FaPlay, FaStop, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaCog, FaBell, FaSync, FaGraduationCap } from 'react-icons/fa';
import VideoCall from '../Components/VideoCall';
import PushNotifications from '../Components/PushNotifications';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { buildApiUrl } from '../config/api';

const OnlineClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedClass, setSelectedClass] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('live');
  const [isInstructor] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Fetch sessions/classes based on role (teacher => own classes, students => live sessions, fallback => events)
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const role = localStorage.getItem('userRole');
      setUserRole(role);

      // Infer branch/semester from token for student filtering
      let branch = null;
      let semester = null;
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          branch = decoded.department || decoded.branch || null;
          semester = decoded.semester ?? null;
        } catch (err) {
          // token decode failed; ignore and fallback to open list
        }
      }

      // Decide primary endpoint by role
      let url = '';
      let list = [];

      if (role === 'teacher') {
        const storedUser = localStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : {};
        const instructorId = parsedUser.email || parsedUser.usn || parsedUser._id || parsedUser.id;
        if (!instructorId) {
          setError('Unable to identify instructor. Please re-login.');
          setLoading(false);
          return;
        }
        url = buildApiUrl(`/api/sessions/teacher/${encodeURIComponent(instructorId)}`);
      } else {
        // Students see all live sessions
        url = buildApiUrl(`/api/sessions/live`);
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      // Extract list based on expected shapes
      if (Array.isArray(data?.sessions)) {
        list = data.sessions; // teacher or live sessions
      } else if (Array.isArray(data)) {
        list = data;
      }

      // If student/guest and no live sessions, fallback to events list
      if (!list?.length && role !== 'teacher') {
        const eventsResp = await fetch(buildApiUrl('/events/getEvents'));
        const eventsData = await eventsResp.json();
        if (Array.isArray(eventsData?.events)) list = eventsData.events;
        else if (Array.isArray(eventsData)) list = eventsData;
      }

      if (list?.length) {
        let formattedClasses = list.map((item) => {
          const isSession = Boolean(item.channelName);
          const participantsCount = item.participants?.length || item.enrolledStudents?.length || 0;
          const maxP = item.maxParticipants || item.maxStudents || 50;
          const rawStatus = item.status || (isSession ? 'scheduled' : 'upcoming');
          // Normalize status: active/ongoing -> live, scheduled -> upcoming for display
          const normalizedStatus = 
            rawStatus === 'active' || rawStatus === 'live' || rawStatus === 'ongoing' ? 'live' :
            rawStatus === 'scheduled' ? 'upcoming' :
            rawStatus;

          return {
            id: item._id || item.id,
            title: item.title || item.className || item.channelName || 'Session',
            instructor: item.instructorName || item.teacherName || item.instructor || 'Instructor',
            time: item.time || item.startTime || item.schedule?.[0]?.time || 'TBD',
            date: item.date || item.startTime || item.schedule?.[0]?.date || new Date().toISOString().split('T')[0],
            duration: item.duration || '60 min',
            participants: participantsCount,
            maxParticipants: maxP,
            status: normalizedStatus,
            meetingId: item.channelName || item._id || item.id,
            isLive: normalizedStatus === 'live',
            description: item.description,
            branch: item.branch || item.department || 'any',
            semester: item.semester || item.sem
          };
        });

        // For students/guests, show live and upcoming sessions
        const roleNow = role || localStorage.getItem('userRole');
        if (roleNow !== 'teacher') {
          // Show live + upcoming/scheduled classes for students
          formattedClasses = formattedClasses.filter((c) => 
            c.isLive || c.status === 'upcoming' || c.status === 'scheduled'
          );
        }
        setClasses(formattedClasses);
        setError(null);
      } else {
        setClasses([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load classes. Please try again later.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch events from backend
    fetchEvents();

    // Auto-refresh when user returns to page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents();
      }
    };

    // Auto-refresh every 15 seconds so students see a class as soon as teacher starts
    const autoRefreshInterval = setInterval(() => {
      fetchEvents();
    }, 15000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(autoRefreshInterval);
    };
  }, []);

  const joinClass = (classItem) => {
    const meetingId = classItem.meetingId || classItem.id;
    if (!meetingId) {
      toast.error('Class is not ready to join yet');
      return;
    }
    window.location.href = `/video-call/join/${meetingId}`;
  };

  const filteredClasses = classes.filter(classItem => {
    const t = (classItem?.title || '').toLowerCase();
    const inst = (classItem?.instructor || '').toLowerCase();
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = t.includes(q) || inst.includes(q);
    const matchesFilter = filterStatus === 'all' || classItem.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'upcoming':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live':
        return 'Live Now';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Online Classes</h1>
              <p className="text-gray-600 text-lg">Join live classes and interact with instructors and classmates</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  fetchEvents();
                  toast.info('Refreshing classes...');
                }}
                className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                title="Refresh classes list"
              >
                <FaSync className="text-xl" />
                <span className="hidden sm:inline text-sm">Refresh</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors relative"
              >
                <FaBell className="text-xl" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </motion.button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search classes or instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaVideo className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="flex gap-2">
              {['all', 'live', 'upcoming', 'completed'].map((status) => (
                <motion.button
                  key={status}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Classes Grid */}
        {loading && (
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
            <p className="font-semibold">Error loading events:</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={fetchEvents}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && classes.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">📅 {userRole === 'teacher' ? 'No classes created yet' : 'No live class right now'}</p>
            <p className="text-gray-400 text-sm mt-2">{userRole === 'teacher' ? 'Create a class to get started.' : 'We’ll show it here as soon as it goes live.'}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredClasses.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Class Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.title}</h3>
                      <p className="text-gray-600 mb-1">Instructor: {classItem.instructor}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(classItem.status)}`}>
                      {getStatusText(classItem.status)}
                    </span>
                  </div>

                  {/* Class Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <FaCalendar className="text-blue-500" />
                      <span>{new Date(classItem.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <FaClock className="text-green-500" />
                      <span>{classItem.time} ({classItem.duration})</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <FaGraduationCap className="text-indigo-500" />
                      <span>{(classItem.branch || 'ANY').toUpperCase()} • Sem {classItem.semester ?? '-'}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <FaUsers className="text-purple-500" />
                      <span>{classItem.participants}/{classItem.maxParticipants} participants</span>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <FaPlay className="text-red-500" />
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{classItem.meetingId}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(classItem.meetingId || '');
                            toast.info('Session ID copied');
                          }}
                          className="text-blue-500 hover:text-blue-600 text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Class Capacity</span>
                      <span>{Math.round((classItem.participants / classItem.maxParticipants) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(classItem.participants / classItem.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => joinClass(classItem)}
                      className={`flex-1 ${classItem.isLive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2`}
                    >
                      <FaVideo />
                      <span>{classItem.isLive ? 'Join Live' : 'Join Class'}</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Class settings"
                    >
                      <FaCog />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredClasses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FaVideo className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No classes found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>

      {/* Video Call Modal */}
      <AnimatePresence>
        {showVideoCall && selectedClass && (
          <VideoCall
            channelName={selectedClass.meetingId}
            onClose={() => {
              setShowVideoCall(false);
              setSelectedClass(null);
            }}
            isInstructor={isInstructor}
          />
        )}
      </AnimatePresence>

      {/* Push Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 w-96 z-50"
          >
            <PushNotifications />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnlineClasses;
