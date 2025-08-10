// controllers/EventController.js
import Event from '../models/Event.js';
import { appendEventToSheet } from '../utils/googleSheet.js'; // Ensure this exists

export const addEvent = async (req, res) => {
  console.log("Inside adding event");
  try {
    const {
      clubName,
      clubCoordinator,
      contactNumber,
      eventName,
      eventDescription,
      eventDate,
      eventTime,
      venue,
      registrationLink
    } = req.body;

  

    const newEvent = new Event({
      clubName,
      clubCoordinator,
      contactNumber,
      eventName,
      eventDescription,
      eventDate,
      eventTime,
      venue,
      registrationLink,
     
    });

    const savedEvent = await newEvent.save();

    // Optional: Push to Google Sheet
    // await appendEventToSheet({ ...newEvent.toObject() });

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("❌ Error in addEvent:", error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Error in getAllEvents:", error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

