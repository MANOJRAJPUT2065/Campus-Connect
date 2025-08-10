import express from 'express';
import EventRegistration from '../models/EventRegistration.js';
import Event from '../models/Event.js';

const router = express.Router();

// Register user for event
router.post('/', async (req, res) => {
  console.log("Inside Register for upcoming event");  
  console.log('Request body:', req.body); // Check incoming data

  const { eventId, userId, name, email, phone } = req.body;

  if (!eventId || !userId || !name || !email || !phone) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const existing = await EventRegistration.findOne({ eventId, userId });
    if (existing) {
      return res.status(409).json({ message: 'User already registered for this event' });
    }

    const registration = await EventRegistration.create({
      eventId,
      userId,
      name,
      email,
      phone,
    });

    console.log('Registration created:', registration);
    res.status(201).json({ message: 'Registered successfully', registration });
  } catch (err) {
    console.error('Error registering user:', err); // Very important to log the error
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// Get registered users by event ID
router.get('/getRegisteredUsersById/:eventId', async (req, res) => {
  console.log("View Registered Users");
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await EventRegistration.find({ eventId });
    const users = registrations.map(reg => ({
      name: reg.name,
      phone: reg.phone
    }));

    res.status(200).json({ event: event.eventName, registeredUsers: users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all registrations for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrations = await EventRegistration.find({ eventId }).populate('userId', 'name email');
    
    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
});

// Get user's event registrations
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const registrations = await EventRegistration.find({ userId }).populate('eventId', 'eventName eventDate venue');
    
    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user registrations',
      error: error.message
    });
  }
});

// Cancel event registration
router.delete('/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await EventRegistration.findByIdAndDelete(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel registration',
      error: error.message
    });
  }
});

export default router;
