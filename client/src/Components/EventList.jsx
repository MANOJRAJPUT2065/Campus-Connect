


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { buildApiUrl } from '../config/api';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [registeredUsers, setRegisteredUsers] = useState({});
  const [expandedEventId, setExpandedEventId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(buildApiUrl('/events/getEvents'));
        // Handle the response structure from backend
        if (response.data.success && response.data.events) {
          setEvents(response.data.events);
        } else if (Array.isArray(response.data)) {
          setEvents(response.data);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, []);

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setShowForm(true);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Generate random userId
    const userId = uuidv4();

    try {
      await axios.post(buildApiUrl('/events/registerEvent'), {
        ...formData,
        eventId: selectedEvent._id,
        userId
      });

      alert('Registration successful!');
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Registration failed:', error);
      alert(error?.response?.data?.message || 'Registration failed');
    }
  };

  const handleViewUsers = async (eventId) => {
    try {
      if (expandedEventId === eventId) {
        setExpandedEventId(null);
        return;
      }

      const res = await axios.get(buildApiUrl(`/events/registerEvent/getRegisteredUsersById/${eventId}`));

      setRegisteredUsers(prev => ({
        ...prev,
        [eventId]: res.data.registeredUsers
      }));
      setExpandedEventId(eventId);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">🌟 Upcoming Events</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events && events.length > 0 ? events.map((event) => (
          <div key={event._id} className="bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold">{event.eventName}</h2>
            <p className="text-sm text-gray-300">{event.eventDescription}</p>
            <p className="mt-2">📅 {new Date(event.eventDate).toLocaleDateString()} | 🕒 {event.eventTime}</p>
            <p>📍 {event.venue}</p>
            <p>📞 {event.contactNumber}</p>
            <p>👨‍💼 {event.clubCoordinator}</p>

            <button
              onClick={() => handleRegisterClick(event)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Register
            </button>

            <button
              onClick={() => handleViewUsers(event._id)}
              className="mt-2 ml-2 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded"
            >
              {expandedEventId === event._id ? "Hide Users" : "View Registered Users"}
            </button>

            {/* Show registered users for this event */}
            {expandedEventId === event._id && registeredUsers[event._id] && (
              <div className="mt-4 bg-gray-700 p-3 rounded">
                <h3 className="text-lg font-semibold mb-2">👥 Registered Users:</h3>
                {registeredUsers[event._id].length === 0 ? (
                  <p className="text-gray-300">No one has registered yet.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {registeredUsers[event._id].map((user, index) => (
                      <li key={index} className="text-white">
                        ✅ {user.name} - {user.phone}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-400 text-lg">No events available at the moment.</p>
          </div>
        )}
      </div>

      {/* Registration Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Register for {selectedEvent.eventName}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Your Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
              <div className="flex justify-between">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  Submit
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventList;