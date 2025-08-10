// import express from 'express';
// import EventRegistration from '../models/EventRegistration.js';
// import User from '../models/User.js';
// import Event from '../models/Event.js';

// const router = express.Router();

// // Register user for event
// router.post('/registerEvent', async (req, res) => {
//   console.log("Inside Register for upcoming event");  
//   const { eventId, userId, name, email, phone } = req.body;

//   if (!eventId || !userId || !name || !email || !phone) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const existing = await EventRegistration.findOne({ eventId, userId });
//     if (existing) {
//       return res.status(409).json({ message: 'User already registered for this event' });
//     }

//     const registration = await EventRegistration.create({
//       eventId,
//       userId,
//       name,
//       email,
//       phone,
//     });

//     res.status(201).json({ message: 'Registered successfully', registration });
//   } catch (err) {
//     res.status(500).json({ message: 'Error registering user', error: err.message });
//   }
// });

// // ✅ New: Get all users registered for a specific event



// router.get('/getRegisteredUsersByName/:eventName', async (req, res) => {
//   console.log("View Registered Users")
//   const { eventName } = req.params;

//   try {
//     const event = await Event.findOne({ eventName }); // 🟢 Use correct field
//     if (!event) {
//       return res.status(404).json({ message: 'Event not found' });
//     }

//     const registrations = await EventRegistration.find({ eventId: event._id });
//     const users = registrations.map(reg => ({
//       name: reg.name,
//       phone: reg.phone
//     }));

//     res.status(200).json({ event: eventName, registeredUsers: users });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });




// export default router;



import express from 'express';
import EventRegistration from '../models/EventRegistration.js';
import Event from '../models/Event.js';

const router = express.Router();

// Register user for event
// router.post('/', async (req, res) => {
//   console.log("Inside Register for upcoming event");  
//   const { eventId, userId, name, email, phone } = req.body;

//   if (!eventId || !userId || !name || !email || !phone) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const existing = await EventRegistration.findOne({ eventId, userId });
//     if (existing) {
//       return res.status(409).json({ message: 'User already registered for this event' });
//     }

//     const registration = await EventRegistration.create({
//       eventId,
//       userId,
//       name,
//       email,
//       phone,
//     });

//     res.status(201).json({ message: 'Registered successfully', registration });
//   } catch (err) {
//     res.status(500).json({ message: 'Error registering user', error: err.message });
//   }
// });
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



// // Get registered users by event ID
// router.get('/getRegisteredUsersById/:eventId', async (req, res) => {
//   console.log("View Registered Users");
//   const { eventId } = req.params;

//   try {
//     const event = await Event.findById(eventId);
//     if (!event) {
//       return res.status(404).json({ message: 'Event not found' });
//     }

//     const registrations = await EventRegistration.find({ eventId });
//     const users = registrations.map(reg => ({
//       name: reg.name,
//       phone: reg.phone
//     }));

//     res.status(200).json({ event: event.eventName, registeredUsers: users });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error', error: err.message });
//   }
// });


router.get('/getRegisteredUsersById/:eventId', async (req, res) => {
  console.log("View Registered Users");
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Fetch all registrations for this event
    const registrations = await EventRegistration.find({ eventId });

    if (registrations.length === 0) {
      return res.status(200).json({ event: event.eventName, registeredUsers: [], message: "No users registered yet." });
    }

    // Map users with all details you want
    const users = registrations.map(reg => ({
      userId: reg.userId,
      name: reg.name,
      email: reg.email,
      phone: reg.phone,
      registeredAt: reg.createdAt, // agar tu schema me timestamp rakhta hai
    }));

    res.status(200).json({ event: event.eventName, registeredUsers: users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


export default router;
