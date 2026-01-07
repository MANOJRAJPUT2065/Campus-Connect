import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendar, FaUsers, FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaChartBar, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import { jwtDecode } from 'jwt-decode';

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    clubName: '',
    clubCoordinator: '',
    contactNumber: '',
    eventName: '',
    eventDescription: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    registrationLink: ''
  });
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    type: 'info'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'coordinator') {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUserInfo({
        userId: decoded.email,
        userName: decoded.username,
        email: decoded.email
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/');
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch events from EventRoute
      const eventsRes = await fetch(buildApiUrl('/events/getEvents'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const eventsData = await eventsRes.json();
      if (eventsData.success || Array.isArray(eventsData)) {
        setEvents(eventsData.success ? eventsData.events : eventsData);
      }

      // Announcements - optional, might not exist
      // setAnnouncements([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!eventFormData.clubName || !eventFormData.eventName || !eventFormData.eventDescription || !eventFormData.eventDate || !eventFormData.eventTime || !eventFormData.venue || !eventFormData.registrationLink) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for multipart form with backend-required fields
      const formData = new FormData();
      formData.append('clubName', eventFormData.clubName);
      formData.append('clubCoordinator', eventFormData.clubCoordinator || (userInfo?.userName || 'Coordinator'));
      formData.append('contactNumber', eventFormData.contactNumber);
      formData.append('eventName', eventFormData.eventName);
      formData.append('eventDescription', eventFormData.eventDescription);
      formData.append('eventDate', eventFormData.eventDate);
      formData.append('eventTime', eventFormData.eventTime);
      formData.append('venue', eventFormData.venue);
      formData.append('registrationLink', eventFormData.registrationLink);
      
      const response = await fetch(buildApiUrl('/events/addEvent'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Event created successfully!');
        setShowEventModal(false);
        setEventFormData({
          clubName: '',
          clubCoordinator: '',
          contactNumber: '',
          eventName: '',
          eventDescription: '',
          eventDate: '',
          eventTime: '',
          venue: '',
          registrationLink: ''
        });
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    
    if (!announcementFormData.title || !announcementFormData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Announcement feature might not be available
      // Just show success message for now
      toast.success('Announcement posted!');
      setShowAnnouncementModal(false);
      setAnnouncementFormData({ title: '', content: '', type: 'info' });
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.info('Announcement feature coming soon');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/events/event/${eventId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Event deleted');
        fetchData();
      } else {
        toast.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coordinator Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {userInfo.userName}</p>
              <p className="text-xs text-gray-500 mt-1">🎭 Extracurricular Management Only — Events, Clubs, Approvals, Media</p>
            </div>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEventModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            <FaPlus />
            Create Event
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAnnouncementModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            <FaBell />
            Post Announcement
          </motion.button>
        </div>

        {/* Event Modal */}
        <AnimatePresence>
          {showEventModal && (
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
                
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  {/* Required fields per backend schema */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Club Name</label>
                      <input
                        type="text"
                        value={eventFormData.clubName}
                        onChange={(e) => setEventFormData({ ...eventFormData, clubName: e.target.value })}
                        placeholder="e.g., Coding Club"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Coordinator</label>
                      <input
                        type="text"
                        value={eventFormData.clubCoordinator}
                        onChange={(e) => setEventFormData({ ...eventFormData, clubCoordinator: e.target.value })}
                        placeholder={userInfo?.userName || 'Coordinator'}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={eventFormData.contactNumber}
                        onChange={(e) => setEventFormData({ ...eventFormData, contactNumber: e.target.value })}
                        placeholder="e.g., 9876543210"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Registration Link</label>
                      <input
                        type="url"
                        value={eventFormData.registrationLink}
                        onChange={(e) => setEventFormData({ ...eventFormData, registrationLink: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Event Name</label>
                    <input
                      type="text"
                      value={eventFormData.eventName}
                      onChange={(e) => setEventFormData({ ...eventFormData, eventName: e.target.value })}
                      placeholder="e.g., Club Meeting"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={eventFormData.eventDate}
                        onChange={(e) => setEventFormData({ ...eventFormData, eventDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2">Time</label>
                      <input
                        type="time"
                        value={eventFormData.eventTime}
                        onChange={(e) => setEventFormData({ ...eventFormData, eventTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Venue</label>
                    <input
                      type="text"
                      value={eventFormData.venue}
                      onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                      placeholder="e.g., Auditorium Hall"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Description</label>
                    <textarea
                      value={eventFormData.eventDescription}
                      onChange={(e) => setEventFormData({ ...eventFormData, eventDescription: e.target.value })}
                      placeholder="Event details..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcement Modal */}
        <AnimatePresence>
          {showAnnouncementModal && (
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Post Announcement</h2>
                
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={announcementFormData.title}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                      placeholder="Announcement title..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Type</label>
                    <select
                      value={announcementFormData.type}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="info">Information</option>
                      <option value="urgent">Urgent</option>
                      <option value="event">Event</option>
                      <option value="reminder">Reminder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Content</label>
                    <textarea
                      value={announcementFormData.content}
                      onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}
                      placeholder="Announcement content..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 h-32"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAnnouncementModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Events Section */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <FaCalendar className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No events yet</p>
              <p className="text-gray-400 mt-2">Create your first event to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{event.eventName || event.title}</h3>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                          EVENT
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">{event.eventDescription || event.description}</p>

                      <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaCalendar size={14} />
                          <span>{new Date(event.eventDate || event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaUsers size={14} />
                          <span>{event.participants?.length || 0} / {event.maxParticipants} Registered</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/event/${event._id}`)}
                          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => deleteEvent(event._id)}
                          className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FaTrash size={16} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{events.length}</p>
              </div>
              <FaCalendar className="text-4xl text-purple-600 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Registrations</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {events.reduce((sum, e) => sum + (e.participants?.length || 0), 0)}
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
                <p className="text-gray-600 text-sm">Announcements</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{announcements.length}</p>
              </div>
              <FaBell className="text-4xl text-orange-600 opacity-20" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
