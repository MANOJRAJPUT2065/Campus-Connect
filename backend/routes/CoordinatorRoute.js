import express from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import {
  // Club Management
  createClub,
  getCoordinatorClubs,
  getClubDetails,
  addClubMember,
  
  // Event Management
  createEvent,
  getCoordinatorEvents,
  getEventWithRegistrations,
  updateEvent,
  approveParticipant,
  rejectParticipant,
  
  // Announcements
  sendClubAnnouncement,
  sendEventAnnouncement,
  
  // Analytics
  getCoordinatorAnalytics
} from '../controllers/CoordinatorController.js';

const router = express.Router();

// All routes require authentication and coordinator role
router.use(authenticateToken);
router.use(requireRole(['coordinator', 'admin']));

/**
 * CLUB MANAGEMENT ROUTES
 */

// POST /api/coordinator/clubs - Create new club
router.post('/clubs', createClub);

// GET /api/coordinator/clubs - Get coordinator's clubs
router.get('/clubs', getCoordinatorClubs);

// GET /api/coordinator/clubs/:clubId - Get club details
router.get('/clubs/:clubId', getClubDetails);

// POST /api/coordinator/clubs/:clubId/members - Add member to club
router.post('/clubs/:clubId/members', addClubMember);

// POST /api/coordinator/clubs/:clubId/announcements - Send announcement to club members
router.post('/clubs/:clubId/announcements', sendClubAnnouncement);

/**
 * EVENT MANAGEMENT ROUTES
 */

// POST /api/coordinator/events - Create new event
router.post('/events', createEvent);

// GET /api/coordinator/events - Get coordinator's events
router.get('/events', getCoordinatorEvents);

// GET /api/coordinator/events/:eventId - Get event with registrations
router.get('/events/:eventId', getEventWithRegistrations);

// PUT /api/coordinator/events/:eventId - Update event
router.put('/events/:eventId', updateEvent);

// POST /api/coordinator/events/:eventId/registrations/:registrationId/approve - Approve participant
router.post('/events/:eventId/registrations/:registrationId/approve', approveParticipant);

// POST /api/coordinator/events/:eventId/registrations/:registrationId/reject - Reject participant
router.post('/events/:eventId/registrations/:registrationId/reject', rejectParticipant);

// POST /api/coordinator/events/:eventId/announcements - Send announcement to event participants
router.post('/events/:eventId/announcements', sendEventAnnouncement);

/**
 * ANALYTICS ROUTES
 */

// GET /api/coordinator/analytics - Get coordinator dashboard analytics
router.get('/analytics', getCoordinatorAnalytics);

export default router;
