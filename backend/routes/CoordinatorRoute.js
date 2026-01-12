import express from 'express';
import multer from 'multer';
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
  getCoordinatorAnalytics,

  // Placement / CGPA verification
  getPlacementStudents,
  verifyStudentCgpa,
  validatePlacementCsv,
  uploadOfficialPlacement,
  uploadStudentPlacement,
  reconcilePlacement,
  purgePlacementUploads
} from '../controllers/CoordinatorController.js';

const router = express.Router();

// Multer for placement uploads (memory storage, CSV or Excel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = file.originalname.toLowerCase();
    const allowedMime = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const isAllowed =
      allowedMime.includes(file.mimetype) ||
      name.endsWith('.csv') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsx');
    if (!isAllowed) return cb(new Error('Only CSV or Excel files are allowed'));
    cb(null, true);
  }
});

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
 * PLACEMENT / STUDENT VALIDATION ROUTES
 */

// GET /api/coordinator/students - Get students with CGPA insights
router.get('/students', getPlacementStudents);

// PATCH /api/coordinator/students/:studentId/cgpa-verification - Verify or flag CGPA
router.patch('/students/:studentId/cgpa-verification', verifyStudentCgpa);

// POST /api/coordinator/placement/validate-csv - Upload placement CSV and validate CGPA
router.post('/placement/validate-csv', upload.single('file'), validatePlacementCsv);

// POST /api/coordinator/placement/official/upload - Upload official academic CSV/Excel
router.post('/placement/official/upload', upload.single('file'), uploadOfficialPlacement);

// POST /api/coordinator/placement/student/upload - Upload student placement CSV/Excel for a company
router.post('/placement/student/upload', upload.single('file'), uploadStudentPlacement);

// GET /api/coordinator/placement/reconcile - Compare student vs official by USN
router.get('/placement/reconcile', reconcilePlacement);

// POST /api/coordinator/placement/purge - Remove placement uploads (all/official/student, optional companyId)
router.post('/placement/purge', purgePlacementUploads);

/**
 * ANALYTICS ROUTES
 */

// GET /api/coordinator/analytics - Get coordinator dashboard analytics
router.get('/analytics', getCoordinatorAnalytics);

export default router;
