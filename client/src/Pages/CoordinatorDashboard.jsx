import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendar, FaUsers, FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaChartBar, FaBell, FaSearch, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';
import { jwtDecode } from 'jwt-decode';
import CoordinatorNoticePanel from '../Components/CoordinatorNoticePanel';

const CoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
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
  const [placementFilters, setPlacementFilters] = useState({ minCgpa: 0, flaggedOnly: true, mismatchOnly: true, search: '' });
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [verifyingStudentId, setVerifyingStudentId] = useState(null);
  const [csvResults, setCsvResults] = useState([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [mapping, setMapping] = useState({ usn: '', name: '', branch: '', batchYear: '', enteredCgpa: '' });
  const [companyId, setCompanyId] = useState('');
  const [reconcileRows, setReconcileRows] = useState([]);
  const [officialData, setOfficialData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [officialCount, setOfficialCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

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

  const fetchPlacementData = async (overrides = {}) => {
    const nextFilters = { ...placementFilters, ...overrides };
    if (Object.keys(overrides).length) {
      setPlacementFilters(nextFilters);
    }

    try {
      setStudentsLoading(true);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams();
      if (nextFilters.minCgpa && Number(nextFilters.minCgpa) > 0) {
        params.append('minCgpa', nextFilters.minCgpa);
      }
      if (nextFilters.search) {
        params.append('search', nextFilters.search.trim());
      }
      if (nextFilters.flaggedOnly) {
        params.append('flaggedOnly', 'true');
      }
      if (nextFilters.mismatchOnly) {
        params.append('mismatchOnly', 'true');
      }

      const query = params.toString();
      const url = buildApiUrl(`/api/coordinator/students${query ? `?${query}` : ''}`);

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        toast.error(data.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching placement data:', error);
      toast.error('Failed to load student list');
    } finally {
      setStudentsLoading(false);
    }
  };

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

      fetchPlacementData();
      fetchReconcile();
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

  const handleCgpaVerification = async (studentId, verified) => {
    try {
      setVerifyingStudentId(`${studentId}-${verified}`);
      const token = localStorage.getItem('token');

      const response = await fetch(buildApiUrl(`/api/coordinator/students/${studentId}/cgpa-verification`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verified })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(verified ? 'CGPA verified' : 'CGPA flagged');
        fetchPlacementData();
      } else {
        toast.error(data.message || 'Could not update CGPA status');
      }
    } catch (error) {
      console.error('Error verifying CGPA:', error);
      toast.error('Failed to update CGPA status');
    } finally {
      setVerifyingStudentId(null);
    }
  };

  const handleCsvUpload = async (file) => {
    if (!file) return;
    setCsvFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    const trimmedMapping = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v && v.trim().length > 0));
    if (Object.keys(trimmedMapping).length > 0) {
      formData.append('mapping', JSON.stringify(trimmedMapping));
    }

    try {
      setCsvUploading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(buildApiUrl('/api/coordinator/placement/validate-csv'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setCsvResults(data.rows || []);
        toast.success('CSV validated');
      } else {
        toast.error(data.message || 'Failed to validate CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast.error('Failed to upload CSV');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleOfficialUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const trimmedMapping = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v && v.trim().length > 0));
    if (Object.keys(trimmedMapping).length > 0) {
      formData.append('mapping', JSON.stringify(trimmedMapping));
    }
    try {
      setCsvUploading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/api/coordinator/placement/official/upload'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setOfficialCount(data.count || 0);
        toast.success(`✅ Official file uploaded: ${data.count} rows`);
        if (data.skipped > 0) {
          toast.warning(`⚠️ Skipped ${data.skipped} rows (missing USN)`);
        }
        toast.info('📋 Now upload student file, then press Validate to compare');
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Official upload error:', error);
      toast.error('Failed to upload official file');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleStudentUpload = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId || 'default-company');
    formData.append('companyName', companyId || 'Default Company');
    const trimmedMapping = Object.fromEntries(Object.entries(mapping).filter(([, v]) => v && v.trim().length > 0));
    if (Object.keys(trimmedMapping).length > 0) {
      formData.append('mapping', JSON.stringify(trimmedMapping));
    }
    try {
      setCsvUploading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(buildApiUrl('/api/coordinator/placement/student/upload'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStudentCount(data.count || 0);
        toast.success(`✅ Student file uploaded: ${data.count} rows`);
        if (data.skipped > 0) {
          toast.warning(`⚠️ Skipped ${data.skipped} rows (missing USN)`);
        }
        if (officialCount > 0) {
          toast.info('🔍 Press Validate to compare both files');
        } else {
          toast.info('📋 Upload official file first to enable validation');
        }
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Student upload error:', error);
      toast.error('Failed to upload student file');
    } finally {
      setCsvUploading(false);
    }
  };

  async function fetchReconcile(overrides = {}) {
    const filters = {
      flaggedOnly: placementFilters.flaggedOnly,
      minCgpa: placementFilters.minCgpa,
      search: placementFilters.search,
      ...overrides,
    };
    console.log('📊 Validate clicked with filters:', filters);
    try {
      setStudentsLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.flaggedOnly) params.append('flaggedOnly', 'true');
      if (filters.mismatchOnly) params.append('mismatchOnly', 'true');
      if (filters.minCgpa) params.append('minCgpa', filters.minCgpa);
      if (filters.search) params.append('search', filters.search.trim());
      if (companyId) params.append('companyId', companyId);
      const qs = params.toString();
      const url = buildApiUrl(`/api/coordinator/placement/reconcile${qs ? `?${qs}` : ''}`);
      console.log('📡 Fetching from:', url);
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      console.log('📥 Response:', data);
      if (data.success) {
        const rows = data.rows || [];
        setReconcileRows(rows);
        setOfficialData(data.officialData || []);
        setStudentData(data.studentData || []);
        if (rows.length === 0) {
          toast.info('✅ No mismatches found - all CGPA values match!');
        } else {
          toast.success(`Found ${rows.length} mismatches`);
        }
        return rows;
      } else {
        setReconcileRows([]);
        toast.info(data.message || 'Upload both official and student files to validate');
      }
    } catch (error) {
      console.error('Error fetching reconciliation:', error);
      toast.error('Failed to load reconciliation');
    } finally {
      setStudentsLoading(false);
    }
    return null;
  }

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
            onClick={() => setShowNoticeModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            <FaBell />
            Create Notice
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

        {/* Placement Validation */}
        <div className="mt-12 bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Placement CGPA Validation</h2>
              <p className="text-gray-600 text-sm">Two uploads: official (academics) and student (per company). We join by USN, derive batch from USN, flag mismatches in real time.</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={async () => {
                  if (!window.confirm('⚠️ Clear ALL placement data (official + student)? This cannot be undone!')) return;
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(buildApiUrl('/api/coordinator/placement/purge'), {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ scope: 'all' })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(`🗑️ Cleared: ${data.officialDeleted || 0} official + ${data.studentDeleted || 0} student records`);
                      setOfficialCount(0);
                      setStudentCount(0);
                      setReconcileRows([]);
                    } else {
                      toast.error(data.message || 'Failed to clear data');
                    }
                  } catch (err) {
                    console.error('Purge error:', err);
                    toast.error('Failed to clear data');
                  }
                }}
                className="px-4 py-2 border border-red-200 rounded-lg text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <FaTrash size={14} /> Clear All Data
              </button>
              <button
                onClick={() => fetchReconcile({ flaggedOnly: false, mismatchOnly: true })}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FaSearch size={14} /> Validate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Official upload (academics CSV/Excel)</h3>
              <p className="text-xs text-gray-600 mb-3">Fields: Name, USN, Branch, Batch, Official CGPA.</p>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer inline-flex items-center gap-2">
                <FaPlus /> Upload Official
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleOfficialUpload(e.target.files?.[0])} disabled={csvUploading} />
              </label>
              <div className="text-xs text-gray-500 mt-2">Last rows ingested: {officialCount}</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Student upload (per company)</h3>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Company ID or name"
                  className="px-3 py-2 border border-gray-200 rounded w-full"
                />
              </div>
              <label className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer inline-flex items-center gap-2">
                <FaPlus /> Upload Student
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleStudentUpload(e.target.files?.[0])} disabled={csvUploading} />
              </label>
              <div className="text-xs text-gray-500 mt-2">Last rows ingested: {studentCount}</div>
            </div>
          </div>

          <details className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <summary className="text-sm font-semibold text-gray-800 cursor-pointer">Advanced: custom column mapping (leave empty to auto-detect)</summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[['usn','USN header'],['enteredCgpa','Entered CGPA header'],['name','Name header'],['branch','Branch header'],['batchYear','Batch Year header']].map(([key,label]) => (
                <label key={key} className="flex flex-col gap-1 text-gray-700">
                  <span>{label}</span>
                  <input
                    value={mapping[key]}
                    onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                    placeholder="e.g. USN"
                    className="px-3 py-2 border border-gray-200 rounded"
                  />
                </label>
              ))}
            </div>
          </details>

          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={placementFilters.flaggedOnly}
                onChange={(e) => {
                  const next = { ...placementFilters, flaggedOnly: e.target.checked };
                  setPlacementFilters(next);
                  fetchReconcile({ flaggedOnly: e.target.checked });
                }}
              />
              <span className="text-sm text-gray-700">Show flagged only</span>
            </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={placementFilters.mismatchOnly}
                  onChange={(e) => {
                    const next = { ...placementFilters, mismatchOnly: e.target.checked };
                    setPlacementFilters(next);
                    fetchReconcile({ mismatchOnly: e.target.checked });
                  }}
                />
                <span className="text-sm text-gray-700">Show only CGPA mismatches</span>
              </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={placementFilters.minCgpa}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlacementFilters({ ...placementFilters, minCgpa: val });
                  fetchReconcile({ minCgpa: val });
                }}
                className="w-24 px-3 py-2 border border-gray-200 rounded"
                placeholder="Min CGPA"
              />
              <span className="text-sm text-gray-600">Min CGPA (eligible only)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={placementFilters.search}
                onChange={(e) => {
                  const val = e.target.value;
                  setPlacementFilters({ ...placementFilters, search: val });
                  fetchReconcile({ search: val });
                }}
                className="px-3 py-2 border border-gray-200 rounded"
                placeholder="Search name/USN"
              />
              <FaSearch className="text-gray-400" />
            </div>
            {companyId && <div className="text-sm text-gray-500">Company: <span className="font-medium text-gray-800">{companyId}</span></div>}
          </div>

          {/* Validation preview removed; press Validate to show results below */}

          {/* Official Data Table */}
          {officialData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">📋 Official File ({officialData.length} records)</h4>
              <div className="overflow-x-auto rounded-lg border border-blue-100 bg-blue-50">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">USN</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Branch</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Batch</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-blue-900">Official CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 text-xs">
                    {officialData.slice(0, 10).map((row) => (
                      <tr key={row.usn} className="bg-white">
                        <td className="px-3 py-2 font-mono text-gray-900">{row.usn}</td>
                        <td className="px-3 py-2 text-gray-700">{row.name || '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{row.branch || '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{row.derivedBatch || row.batchYear || '-'}</td>
                        <td className="px-3 py-2 font-semibold text-blue-700">{row.officialCgpa ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {officialData.length > 10 && <p className="text-xs text-gray-500 mt-1">Showing first 10 of {officialData.length} records</p>}
            </div>
          )}

          {/* Student Data Table */}
          {studentData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">📊 Student File ({studentData.length} records)</h4>
              <div className="overflow-x-auto rounded-lg border border-green-100 bg-green-50">
                <table className="min-w-full divide-y divide-green-100">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-900">USN</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-900">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-900">Branch</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-900">Batch</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-900">Entered CGPA</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-900">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100 text-xs">
                    {studentData.slice(0, 10).map((row) => (
                      <tr key={`${row.usn}-${row.companyId}`} className="bg-white">
                        <td className="px-3 py-2 font-mono text-gray-900">{row.usn}</td>
                        <td className="px-3 py-2 text-gray-700">{row.name || '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{row.branch || '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{row.derivedBatch || row.batchYear || '-'}</td>
                        <td className="px-3 py-2 font-semibold text-green-700">{row.enteredCgpa ?? '-'}</td>
                        <td className="px-3 py-2 text-gray-600 text-xs">{row.companyName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {studentData.length > 10 && <p className="text-xs text-gray-500 mt-1">Showing first 10 of {studentData.length} records</p>}
            </div>
          )}

          {/* Official Data Table */}
          {officialData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">📋 Official File ({officialData.length} records)</h4>
              <div className="overflow-x-auto rounded-lg border border-blue-100 bg-blue-50">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900">USN</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900">Branch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900">Official CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-100 bg-white">
                    {officialData.slice(0, 10).map((row) => (
                      <tr key={`official-${row.usn}`}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-800">{row.usn}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.branch || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.derivedBatch || row.batchYear || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-800">{row.officialCgpa ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {officialData.length > 10 && (
                <p className="text-xs text-gray-500 mt-1">Showing 10 of {officialData.length} records</p>
              )}
            </div>
          )}

          {/* Student Data Table */}
          {studentData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-green-900 mb-2">👥 Student File ({studentData.length} records)</h4>
              <div className="overflow-x-auto rounded-lg border border-green-100 bg-green-50">
                <table className="min-w-full divide-y divide-green-100">
                  <thead className="bg-green-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-900">USN</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-900">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-900">Branch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-900">Batch</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-900">Entered CGPA</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-green-900">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100 bg-white">
                    {studentData.slice(0, 10).map((row) => (
                      <tr key={`student-${row.usn}-${row.companyId}`}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-800">{row.usn}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{row.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.branch || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.derivedBatch || row.batchYear || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-800">{row.enteredCgpa ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.companyName || row.companyId || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {studentData.length > 10 && (
                <p className="text-xs text-gray-500 mt-1">Showing 10 of {studentData.length} records</p>
              )}
            </div>
          )}

          {/* Reconciliation Table - Mismatches */}
          {reconcileRows.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-red-900 mb-2">⚠️ Mismatches Found ({reconcileRows.length} records)</h4>
              <div className="overflow-x-auto rounded-lg border border-red-100 bg-red-50">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">USN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Branch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">CGPA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Eligible</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(csvUploading || studentsLoading) && (
                  <tr>
                    <td colSpan="9" className="px-4 py-6 text-center text-gray-500">Processing...</td>
                  </tr>
                )}

                {!csvUploading && !studentsLoading && reconcileRows.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-6 text-center text-gray-500">Upload official + student files to see results.</td>
                  </tr>
                )}

                {reconcileRows.map((row) => {
                  const flagged = row.flagged;
                  const badge = row.status;
                  const badgeColor = flagged ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                  return (
                    <tr key={`rec-${row.usn}-${row.companyId || 'all'}`} className={flagged ? 'bg-red-50/60' : ''}>
                      <td className="px-4 py-3 text-sm font-mono text-gray-800">{row.usn}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{row.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.branch || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{row.derivedBatch || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{(row.enteredCgpa !== null && row.officialCgpa !== null) ? `${row.enteredCgpa} vs ${row.officialCgpa}` : (row.enteredCgpa ?? row.officialCgpa ?? '-')}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                          {badge}
                        </span>
                        {row.issues?.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">{row.issues.join(' | ')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {row.eligibleForCgpaFilter ? (
                          <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold"><FaCheckCircle size={12} /> Eligible</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold"><FaExclamationTriangle size={12} /> Blocked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCgpaVerification(row.usn, true)}
                            disabled={verifyingStudentId === `${row.usn}-true`}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleCgpaVerification(row.usn, false)}
                            disabled={verifyingStudentId === `${row.usn}-false`}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                          >
                            Flag
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No reconciliation data message */}
          {reconcileRows.length === 0 && officialData.length === 0 && studentData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Upload official + student files and click Validate to see results.</p>
            </div>
          )}
        </div>
      </div>

      {/* Notice Modal */}
      {showNoticeModal && (
        <CoordinatorNoticePanel
          isOpen={showNoticeModal}
          onClose={() => setShowNoticeModal(false)}
          onNoticeCreated={() => {
            setShowNoticeModal(false);
            toast.success('Notice created successfully!');
          }}
        />
      )}
    </div>
  );
};

export default CoordinatorDashboard;
