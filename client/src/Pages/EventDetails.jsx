import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUsers, FaLink, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { buildApiUrl } from '../config/api';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(buildApiUrl(`/events/event/${id}`), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (res.ok && (data.success || data._id)) {
          setEvent(data.success ? data.event : data);
        } else {
          toast.error(data.error || 'Failed to load event');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        toast.error('Error loading event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d || '-';
    }
  };

  const formatTime = (t) => t || '-';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6">
          <FaArrowLeft /> Back
        </button>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6">
        <FaArrowLeft /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.eventName || event.title}</h1>
              <p className="text-gray-600 mt-2">{event.eventDescription || event.description}</p>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full self-start">EVENT</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <FaCalendar />
              <span><strong>Date:</strong> {formatDate(event.eventDate || event.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FaClock />
              <span><strong>Time:</strong> {formatTime(event.eventTime || event.time)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FaMapMarkerAlt />
              <span><strong>Venue:</strong> {event.venue || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FaUsers />
              <span><strong>Registrations:</strong> {(event.participants?.length || 0)}{event.maxParticipants ? ` / ${event.maxParticipants}` : ''}</span>
            </div>
            {event.registrationLink && (
              <div className="flex items-center gap-2 text-gray-700">
                <FaLink />
                <a href={event.registrationLink} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
                  Registration Link
                </a>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {event.clubName && (
              <p className="text-gray-700"><strong>Club:</strong> {event.clubName}</p>
            )}
            {event.clubCoordinator && (
              <p className="text-gray-700"><strong>Coordinator:</strong> {event.clubCoordinator}</p>
            )}
            {event.contactNumber && (
              <p className="text-gray-700"><strong>Contact:</strong> {event.contactNumber}</p>
            )}
            {event.category && (
              <p className="text-gray-700"><strong>Category:</strong> {event.category}</p>
            )}
            {event.status && (
              <p className="text-gray-700"><strong>Status:</strong> {event.status}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
