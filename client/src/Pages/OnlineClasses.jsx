import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaVideo, FaUsers, FaCalendar, FaClock, FaPlay, FaStop, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaCog, FaBell } from 'react-icons/fa';
import VideoCall from '../Components/VideoCall';
import PushNotifications from '../Components/PushNotifications';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

const OnlineClasses = () => {
  const [classes, setClasses] = useState([
    {
      id: 1,
      title: "Introduction to Computer Science",
      instructor: "Dr. Sarah Johnson",
      time: "10:00 AM - 11:30 AM",
      date: "2024-01-15",
      duration: "90 min",
      participants: 24,
      maxParticipants: 30,
      status: "upcoming",
      meetingId: "cs101-intro",
      isLive: false
    },
    {
      id: 2,
      title: "Advanced Mathematics",
      instructor: "Prof. Michael Chen",
      time: "2:00 PM - 3:30 PM",
      date: "2024-01-15",
      duration: "90 min",
      participants: 18,
      maxParticipants: 25,
      status: "live",
      meetingId: "math201-advanced",
      isLive: true
    },
    {
      id: 3,
      title: "English Literature",
      instructor: "Dr. Emily Davis",
      time: "4:00 PM - 5:00 PM",
      date: "2024-01-15",
      duration: "60 min",
      participants: 22,
      maxParticipants: 28,
      status: "upcoming",
      meetingId: "eng101-literature",
      isLive: false
    }
  ]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Check if user is instructor (you can implement your own logic)
    const userRole = localStorage.getItem('userRole');
    setIsInstructor(userRole === 'instructor');
  }, []);

  const joinClass = (classItem) => {
    // Create session if it doesn't exist, then join
    createAndJoinSession(classItem);
  };

  const createAndJoinSession = async (classItem) => {
    try {
      const token = localStorage.getItem('token');
      let userInfo = null;
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          userInfo = {
            userId: decoded.email || decoded.usn,
            userName: decoded.username || 'User'
          };
        } catch (e) {}
      }

      // Create session
      const response = await fetch(buildApiUrl('/api/videocall/create-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: classItem.title,
          instructorId: userInfo?.userId || 'instructor',
          instructorName: userInfo?.userName || 'Instructor',
          maxParticipants: classItem.maxParticipants || 50
        })
      });

      const data = await response.json();
      if (data.success) {
        // Navigate to join page with session ID
        window.location.href = `/video-call/join/${data.session.id}`;
      } else {
        toast.error('Failed to create session');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      toast.error('Failed to create session');
    }
  };

  const startClass = async (classItem) => {
    if (isInstructor) {
      try {
        const token = localStorage.getItem('token');
        let userInfo = null;
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            userInfo = {
              userId: decoded.email || decoded.usn,
              userName: decoded.username || 'Instructor'
            };
          } catch (e) {}
        }

        // Create session for instructor
        const response = await fetch(buildApiUrl('/api/videocall/create-session'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: classItem.title,
            instructorId: userInfo?.userId || 'instructor',
            instructorName: userInfo?.userName || 'Instructor',
            maxParticipants: classItem.maxParticipants || 50
          })
        });

        const data = await response.json();
        if (data.success) {
          // Navigate to video call with session info
          window.location.href = `/video-call/join/${data.session.id}`;
          toast.success(`Starting class: ${classItem.title}`);
        } else {
          toast.error('Failed to create session');
        }
      } catch (err) {
        console.error('Error starting class:', err);
        toast.error('Failed to start class');
      }
    } else {
      toast.error('Only instructors can start classes');
    }
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.instructor.toLowerCase().includes(searchTerm.toLowerCase());
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
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors relative"
              >
                <FaBell className="text-xl" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </motion.button>
              
              {isInstructor && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <FaVideo />
                  <span>Schedule Class</span>
                </motion.button>
              )}
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
                      <FaUsers className="text-purple-500" />
                      <span>{classItem.participants}/{classItem.maxParticipants} participants</span>
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
                    {classItem.isLive ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => joinClass(classItem)}
                        className="flex-1 bg-red-500 text-white py-3 px-4 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <FaPlay />
                        <span>Join Live</span>
                      </motion.button>
                    ) : (
                      <>
                        {isInstructor ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => startClass(classItem)}
                            className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                          >
                            <FaPlay />
                            <span>Start Class</span>
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => joinClass(classItem)}
                            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                          >
                            <FaVideo />
                            <span>Join Class</span>
                          </motion.button>
                        )}
                      </>
                    )}
                    
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
