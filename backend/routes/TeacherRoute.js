import express from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import {
  // Class Management
  createClass,
  getTeacherClasses,
  getClassDetails,
  updateClass,
  addStudentToClass,
  uploadMaterial,
  
  // Assignment Management
  createAssignment,
  getTeacherAssignments,
  getAssignmentDetails,
  gradeSubmission,
  
  // Attendance Management
  createAttendance,
  markAttendance,
  getClassAttendance,
  
  // Analytics
  getTeacherAnalytics
} from '../controllers/TeacherController.js';

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireRole(['teacher', 'admin']));

/**
 * CLASS MANAGEMENT ROUTES
 */

// POST /api/teacher/classes - Create new class
router.post('/classes', createClass);

// GET /api/teacher/classes - Get all teacher's classes
router.get('/classes', getTeacherClasses);

// GET /api/teacher/classes/:classId - Get specific class details
router.get('/classes/:classId', getClassDetails);

// PUT /api/teacher/classes/:classId - Update class
router.put('/classes/:classId', updateClass);

// POST /api/teacher/classes/:classId/students - Add student to class
router.post('/classes/:classId/students', addStudentToClass);

// POST /api/teacher/classes/:classId/materials - Upload class material
router.post('/classes/:classId/materials', uploadMaterial);

/**
 * ASSIGNMENT MANAGEMENT ROUTES
 */

// POST /api/teacher/assignments - Create new assignment
router.post('/assignments', createAssignment);

// GET /api/teacher/assignments - Get all teacher's assignments
router.get('/assignments', getTeacherAssignments);

// GET /api/teacher/assignments/:assignmentId - Get assignment details with submissions
router.get('/assignments/:assignmentId', getAssignmentDetails);

// POST /api/teacher/assignments/:assignmentId/submissions/:submissionId/grade - Grade submission
router.post('/assignments/:assignmentId/submissions/:submissionId/grade', gradeSubmission);

/**
 * ATTENDANCE MANAGEMENT ROUTES
 */

// POST /api/teacher/attendance - Create attendance session
router.post('/attendance', createAttendance);

// POST /api/teacher/attendance/:attendanceId/mark - Mark individual attendance
router.post('/attendance/:attendanceId/mark', markAttendance);

// GET /api/teacher/attendance/class/:classId - Get class attendance history
router.get('/attendance/class/:classId', getClassAttendance);

/**
 * ANALYTICS ROUTES
 */

// GET /api/teacher/analytics - Get teacher dashboard analytics
router.get('/analytics', getTeacherAnalytics);

export default router;
