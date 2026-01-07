import Event from '../models/Event.js';
import Club from '../models/Club.js';
import EventRegistration from '../models/EventRegistration.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * CLUB MANAGEMENT CONTROLLERS
 */

// Create club
export const createClub = async (req, res) => {
  try {
    const { clubName, clubCode, description, category, contactEmail, contactPhone } = req.body;
    
    // Check if club code already exists
    const existingClub = await Club.findOne({ clubCode: clubCode.toUpperCase() });
    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: 'Club code already exists'
      });
    }
    
    const club = new Club({
      clubName,
      clubCode: clubCode.toUpperCase(),
      description,
      category,
      contactEmail: contactEmail || req.user.email,
      contactPhone,
      coordinators: [{
        userId: req.user.userId || req.user.email,
        name: req.user.username,
        email: req.user.email,
        role: 'president',
        joinedDate: new Date()
      }],
      status: 'active'
    });
    
    await club.save();
    
    // Update user's clubsManaged
    await User.findOneAndUpdate(
      { email: req.user.email },
      { $push: { clubsManaged: club._id } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      club
    });
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create club',
      error: error.message
    });
  }
};

// Get coordinator's clubs
export const getCoordinatorClubs = async (req, res) => {
  try {
    const clubs = await Club.find({
      'coordinators.userId': req.user.userId || req.user.email,
      status: { $ne: 'archived' }
    })
    .populate('events', 'eventName eventDate status')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clubs',
      error: error.message
    });
  }
};

// Get club details
export const getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;
    
    const club = await Club.findById(clubId)
      .populate('coordinators.userId', 'username email profilePicUrl')
      .populate('members.userId', 'username email usn profilePicUrl department semester')
      .populate('events', 'eventName eventDate status registrations');
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check authorization
    const isCoordinator = club.isCoordinator(req.user.userId || req.user.email);
    if (!isCoordinator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      club
    });
  } catch (error) {
    console.error('Error fetching club details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch club details',
      error: error.message
    });
  }
};

// Add member to club
export const addClubMember = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { userId, name, email, usn, department, semester, membershipType } = req.body;
    
    const club = await Club.findById(clubId);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check authorization
    const isCoordinator = club.isCoordinator(req.user.userId || req.user.email);
    if (!isCoordinator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    club.addMember({
      userId,
      name,
      email,
      usn,
      department,
      semester,
      membershipType: membershipType || 'regular'
    });
    
    await club.save();
    
    // Send notification to new member
    await Notification.createForUsers({
      title: 'Club Membership',
      message: `You have been added to ${club.clubName}`,
      type: 'general',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'club',
        entityId: club._id
      }
    }, [userId]);
    
    res.status(200).json({
      success: true,
      message: 'Member added successfully',
      club
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add member',
      error: error.message
    });
  }
};

/**
 * EVENT MANAGEMENT CONTROLLERS
 */

// Create event
export const createEvent = async (req, res) => {
  try {
    const eventData = req.body;
    
    const event = new Event({
      ...eventData,
      coordinatorId: req.user.userId || req.user.email,
      coordinatorEmail: req.user.email,
      clubCoordinator: req.user.username,
      status: eventData.status || 'draft',
      requiresApproval: eventData.requiresApproval || false,
      autoApprove: eventData.autoApprove !== undefined ? eventData.autoApprove : true
    });
    
    await event.save();
    
    // If clubId is provided, add event to club
    if (eventData.clubId) {
      await Club.findByIdAndUpdate(
        eventData.clubId,
        { 
          $push: { events: event._id },
          $inc: { 'stats.totalEvents': 1, 'stats.upcomingEvents': 1 }
        }
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// Get coordinator's events
export const getCoordinatorEvents = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { coordinatorEmail: req.user.email };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const events = await Event.find(query)
      .populate('clubId', 'clubName clubCode')
      .sort({ eventDate: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Get event with registrations
export const getEventWithRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId)
      .populate('registrations.userId', 'username email usn profilePicUrl department semester')
      .populate('clubId', 'clubName');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
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
    const { eventId } = req.params;
    const updates = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Prevent changing coordinator
    delete updates.coordinatorId;
    delete updates.coordinatorEmail;
    
    Object.assign(event, updates);
    await event.save();
    
    // Notify registered participants if significant changes
    if (updates.eventDate || updates.eventTime || updates.venue) {
      const registeredUserIds = event.registrations
        .filter(r => r.approvalStatus === 'approved')
        .map(r => r.userId);
      
      if (registeredUserIds.length > 0) {
        await Notification.createForUsers({
          title: 'Event Updated',
          message: `${event.eventName} has been updated. Please check the details.`,
          type: 'event',
          priority: 'high',
          senderId: req.user.userId || req.user.email,
          senderName: req.user.username,
          senderRole: 'coordinator',
          relatedEntity: {
            entityType: 'event',
            entityId: event._id
          }
        }, registeredUserIds);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Approve participant
export const approveParticipant = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const registration = event.registrations.id(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    try {
      event.approveParticipant(registration.userId, req.user.userId || req.user.email);
      await event.save();
      
      // Send notification to participant
      await Notification.createForUsers({
        title: 'Registration Approved',
        message: `Your registration for ${event.eventName} has been approved!`,
        type: 'event',
        priority: 'high',
        senderId: req.user.userId || req.user.email,
        senderName: req.user.username,
        senderRole: 'coordinator',
        relatedEntity: {
          entityType: 'event',
          entityId: event._id
        }
      }, [registration.userId]);
      
      res.status(200).json({
        success: true,
        message: 'Participant approved successfully',
        event
      });
    } catch (error) {
      // Handle waitlist case
      if (error.message.includes('waitlist')) {
        await event.save();
        
        await Notification.createForUsers({
          title: 'Added to Waitlist',
          message: `Event is full. You've been added to the waitlist for ${event.eventName}`,
          type: 'event',
          priority: 'medium',
          senderId: req.user.userId || req.user.email,
          senderName: req.user.username,
          senderRole: 'coordinator',
          relatedEntity: {
            entityType: 'event',
            entityId: event._id
          }
        }, [registration.userId]);
        
        return res.status(200).json({
          success: true,
          message: 'Event full, participant added to waitlist',
          event
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error approving participant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve participant',
      error: error.message
    });
  }
};

// Reject participant
export const rejectParticipant = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { reason } = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const registration = event.registrations.id(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }
    
    event.rejectParticipant(registration.userId, reason, req.user.userId || req.user.email);
    await event.save();
    
    // Send notification to participant
    await Notification.createForUsers({
      title: 'Registration Not Approved',
      message: `Your registration for ${event.eventName} was not approved. ${reason || ''}`,
      type: 'event',
      priority: 'medium',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'event',
        entityId: event._id
      }
    }, [registration.userId]);
    
    res.status(200).json({
      success: true,
      message: 'Participant rejected',
      event
    });
  } catch (error) {
    console.error('Error rejecting participant:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject participant',
      error: error.message
    });
  }
};

/**
 * ANNOUNCEMENT CONTROLLERS
 */

// Send announcement to club members
export const sendClubAnnouncement = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, message, priority } = req.body;
    
    const club = await Club.findById(clubId);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Club not found'
      });
    }
    
    // Check authorization
    const isCoordinator = club.isCoordinator(req.user.userId || req.user.email);
    if (!isCoordinator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Get active member IDs
    const memberIds = club.members
      .filter(m => m.status === 'active')
      .map(m => m.userId);
    
    if (memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active members to send announcement to'
      });
    }
    
    // Create notification for all members
    await Notification.createForUsers({
      title,
      message,
      type: 'announcement',
      priority: priority || 'medium',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'club',
        entityId: club._id
      }
    }, memberIds);
    
    res.status(200).json({
      success: true,
      message: `Announcement sent to ${memberIds.length} members`
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

// Send announcement to event participants
export const sendEventAnnouncement = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, message, priority, targetStatus } = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check authorization
    if (event.coordinatorEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Filter registrations by status
    let registrations = event.registrations;
    if (targetStatus) {
      registrations = registrations.filter(r => r.approvalStatus === targetStatus);
    }
    
    const participantIds = registrations.map(r => r.userId);
    
    if (participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants to send announcement to'
      });
    }
    
    // Create notification
    await Notification.createForUsers({
      title,
      message,
      type: 'announcement',
      priority: priority || 'medium',
      senderId: req.user.userId || req.user.email,
      senderName: req.user.username,
      senderRole: 'coordinator',
      relatedEntity: {
        entityType: 'event',
        entityId: event._id
      }
    }, participantIds);
    
    res.status(200).json({
      success: true,
      message: `Announcement sent to ${participantIds.length} participants`
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send announcement',
      error: error.message
    });
  }
};

/**
 * ANALYTICS CONTROLLERS
 */

// Get coordinator dashboard analytics
export const getCoordinatorAnalytics = async (req, res) => {
  try {
    const coordinatorEmail = req.user.email;
    
    // Get clubs
    const clubs = await Club.find({
      'coordinators.email': coordinatorEmail,
      status: 'active'
    });
    
    // Get events
    const events = await Event.find({
      coordinatorEmail,
      status: { $ne: 'cancelled' }
    });
    
    // Calculate statistics
    const totalClubs = clubs.length;
    const totalMembers = clubs.reduce((sum, c) => sum + c.stats.activeMembers, 0);
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => new Date(e.eventDate) > new Date()).length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    
    const pendingApprovals = events.reduce((sum, e) => {
      return sum + e.registrations.filter(r => r.approvalStatus === 'pending').length;
    }, 0);
    
    const totalRegistrations = events.reduce((sum, e) => sum + e.registrations.length, 0);
    
    res.status(200).json({
      success: true,
      analytics: {
        totalClubs,
        totalMembers,
        totalEvents,
        upcomingEvents,
        completedEvents,
        pendingApprovals,
        totalRegistrations,
        recentEvents: events
          .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate))
          .slice(0, 5),
        clubs: clubs.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};
