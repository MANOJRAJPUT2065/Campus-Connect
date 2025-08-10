// controllers/EventController.js
import Event from '../models/Event.js';
// import { appendEventToSheet } from '../utils/googleSheet.js';

// Create new event
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
      registrationLink,
      category,
      tags,
      eventType,
      maxParticipants,
      entryFee,
      city,
      state,
      targetAudience,
      agenda
    } = req.body;

    // Validate required fields
    if (!clubName || !clubCoordinator || !contactNumber || !eventName || !eventDescription || !eventDate || !eventTime || !venue || !registrationLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: clubName, clubCoordinator, contactNumber, eventName, eventDescription, eventDate, eventTime, venue, registrationLink'
      });
    }

    // Parse event date
    let parsedEventDate;
    try {
      parsedEventDate = new Date(eventDate);
      if (isNaN(parsedEventDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event date format'
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event date'
      });
    }

    // Create event object with only the fields we need
    const eventData = {
      clubName: clubName.trim(),
      clubCoordinator: clubCoordinator.trim(),
      contactNumber: contactNumber.trim(),
      eventName: eventName.trim(),
      eventDescription: eventDescription.trim(),
      eventDate: parsedEventDate,
      eventTime: eventTime.trim(),
      venue: venue.trim(),
      registrationLink: registrationLink.trim()
    };

    // Add optional fields if provided
    if (category) eventData.category = category;
    if (tags && Array.isArray(tags)) eventData.tags = tags.map(tag => tag.trim());
    if (eventType) eventData.eventType = eventType;
    if (maxParticipants && !isNaN(maxParticipants)) eventData.maxParticipants = parseInt(maxParticipants);
    if (entryFee && !isNaN(entryFee)) eventData.entryFee = parseFloat(entryFee);
    if (city) eventData.city = city.trim();
    if (state) eventData.state = state.trim();
    if (targetAudience && Array.isArray(targetAudience)) eventData.targetAudience = targetAudience.map(audience => audience.trim());
    if (agenda && Array.isArray(agenda)) eventData.agenda = agenda.map(item => item.trim());

    // Create and save the event
    const newEvent = new Event(eventData);
    const savedEvent = await newEvent.save();

    console.log('✅ Event created successfully:', savedEvent._id);

    res.status(201).json({
      success: true,
      event: savedEvent,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error("❌ Error in addEvent:", error.message);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        error: error.message
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Get all events with basic filtering
export const getAllEvents = async (req, res) => {
  console.log("Inside get all events....");
  try {
    const { page = 1, limit = 10, category, status, eventType } = req.query;
    
    const query = {};
    
    // Add filters if provided
    if (category) query.category = category;
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // Exclude version key
    
    const total = await Event.countDocuments(query);
    
    res.json({
      success: true,
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        eventsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("❌ Error in getAllEvents:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).select('-__v');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error("❌ Error in getEventById:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    
    // Update timestamp
    updateData.updatedAt = new Date();
    
    const event = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error("❌ Error in updateEvent:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByIdAndDelete(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error("❌ Error in deleteEvent:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

// Get upcoming events
export const getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const events = await Event.getUpcomingEvents(parseInt(limit));
    
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error("❌ Error in getUpcomingEvents:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
      error: error.message
    });
  }
};

// Get featured events
export const getFeaturedEvents = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const events = await Event.getFeaturedEvents(parseInt(limit));
    
    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error("❌ Error in getFeaturedEvents:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured events',
      error: error.message
    });
  }
};

// Search events
export const searchEvents = async (req, res) => {
  try {
    const { q: query, filters = {} } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const events = await Event.searchEvents(query, filters);
    
    res.json({
      success: true,
      events,
      count: events.length,
      query
    });
  } catch (error) {
    console.error("❌ Error in searchEvents:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search events',
      error: error.message
    });
  }
};

// Get events by category
export const getEventsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find({ category })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await Event.countDocuments({ category });
    
    res.json({
      success: true,
      events,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        eventsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("❌ Error in getEventsByCategory:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events by category',
      error: error.message
    });
  }
};

// Toggle event like (simplified)
export const toggleEventLike = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Simple like toggle
    event.likes = event.likes || 0;
    event.likes += 1;
    await event.save();
    
    res.json({
      success: true,
      likes: event.likes,
      message: 'Event liked successfully'
    });
  } catch (error) {
    console.error("❌ Error in toggleEventLike:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to like event',
      error: error.message
    });
  }
};

// Add event review (simplified)
export const addEventReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // For now, just increment views as a simple interaction
    event.views = event.views || 0;
    event.views += 1;
    await event.save();
    
    res.json({
      success: true,
      message: 'Review added successfully (views incremented)',
      views: event.views
    });
  } catch (error) {
    console.error("❌ Error in addEventReview:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
};

// Get event analytics (simplified)
export const getEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).select('likes views createdAt');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const analytics = {
      eventId: event._id,
      eventName: event.eventName,
      likes: event.likes || 0,
      views: event.views || 0,
      createdAt: event.createdAt,
      daysSinceCreation: Math.floor((new Date() - event.createdAt) / (1000 * 60 * 60 * 24))
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("❌ Error in getEventAnalytics:", error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event analytics',
      error: error.message
    });
  }
};

