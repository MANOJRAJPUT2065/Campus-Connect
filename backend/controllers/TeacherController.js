import Class from '../models/Class.js';
import Assignment from '../models/Assignment.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * CLASS MANAGEMENT CONTROLLERS
 */

// Create new class
export const createClass = async (req, res) => {
  try {
    const { className, classCode, subject, description, department, semester, academicYear, schedule, maxStudents } = req.body;
    
    // Verify teacher role
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only teachers can create classes' 
      });
    }
    
    // Check if class code already exists
    const existingClass = await Class.findOne({ classCode: classCode.toUpperCase() });
    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: 'Class code already exists'
      });
    }
    
    const newClass = new Class({
      className,
      classCode: classCode.toUpperCase(),
      subject,
      description,
      teacherId: req.user.userId || req.user.email,
      teacherEmail: req.user.email,
      teacherName: req.user.username,
      department,
      semester,
      academicYear,
      schedule: schedule || [],
      maxStudents: maxStudents || 60,
      status: 'active'
    });
    
    await newClass.save();
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: newClass
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create class',
      error: error.message
    });
  }
};

// Get teacher's classes
export const getTeacherClasses = async (req, res) => {
  try {
    const teacherEmail = req.user.email;
    const { status = 'active' } = req.query;
    
    const query = { teacherEmail };
    if (status !== 'all') {
      query.status = status;
    }
    
    const classes = await Class.find(query)
      .populate('enrolledStudents.studentId', 'username email usn profilePicUrl department semester')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes',
      error: error.message
    });
  }
};

// Get single class details
export const getClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const classData = await Class.findById(classId)
      .populate('enrolledStudents.studentId', 'username email usn profilePicUrl department semester');
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check authorization
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      class: classData
    });
  } catch (error) {
    console.error('Error fetching class details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class details',
      error: error.message
    });
  }
};

// Update class
export const updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const updates = req.body;
    
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check authorization
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Prevent changing critical fields
    delete updates.teacherId;
    delete updates.teacherEmail;
    delete updates.classCode;
    
    Object.assign(classData, updates);
    await classData.save();
    
    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      class: classData
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update class',
      error: error.message
    });
  }
};

// Add student to class
export const addStudentToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId, studentEmail } = req.body;
    
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check authorization
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Find student
    let student;
    if (studentId) {
      student = await User.findById(studentId);
    } else if (studentEmail) {
      student = await User.findOne({ email: studentEmail });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if already enrolled
    const alreadyEnrolled = classData.enrolledStudents.some(
      s => s.studentId.toString() === student._id.toString()
    );
    
    if (alreadyEnrolled) {
      return res.status(409).json({
        success: false,
        message: 'Student already enrolled'
      });
    }
    
    classData.addStudent(student._id);
    await classData.save();
    
    // Send notification to student
    if (Notification.createForUsers) {
      await Notification.createForUsers({
        title: 'Enrolled in Class',
        message: `You have been enrolled in ${classData.className}`,
        type: 'academic',
        senderId: req.user.userId || req.user.email,
        senderName: req.user.username,
        senderRole: 'teacher',
        relatedEntity: {
          entityType: 'class',
          entityId: classData._id
        }
      }, [student._id]);
    }
    
    res.status(200).json({
      success: true,
      message: 'Student added successfully',
      class: classData
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add student',
      error: error.message
    });
  }
};

// Upload class material
export const uploadMaterial = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, type, fileUrl } = req.body;
    
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check authorization
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    classData.materials.push({
      title,
      description,
      type: type || 'document',
      fileUrl,
      uploadedDate: new Date()
    });
    
    await classData.save();
    
    // Notify all enrolled students
    const studentIds = classData.enrolledStudents
      .filter(s => s.status === 'active')
      .map(s => s.studentId);
    
    if (studentIds.length > 0 && Notification.createForUsers) {
      await Notification.createForUsers({
        title: 'New Study Material',
        message: `New material uploaded in ${classData.className}: ${title}`,
        type: 'academic',
        senderId: req.user.userId || req.user.email,
        senderName: req.user.username,
        senderRole: 'teacher',
        relatedEntity: {
          entityType: 'class',
          entityId: classData._id
        }
      }, studentIds);
    }
    
    res.status(200).json({
      success: true,
      message: 'Material uploaded successfully',
      class: classData
    });
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload material',
      error: error.message
    });
  }
};

/**
 * ASSIGNMENT MANAGEMENT CONTROLLERS
 */

// Create assignment
export const createAssignment = async (req, res) => {
  try {
    const { classId, title, description, instructions, dueDate, totalPoints, assignmentType, attachments } = req.body;
    
    // Verify class exists and teacher owns it
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const assignment = new Assignment({
      classId,
      teacherId: req.user.userId || req.user.email,
      teacherName: req.user.username,
      title,
      description,
      instructions,
      dueDate: new Date(dueDate),
      totalPoints: totalPoints || 100,
      assignmentType: assignmentType || 'homework',
      attachments: attachments || [],
      status: 'published'
    });
    
    await assignment.save();
    
    // Update class stats
    classData.stats.totalAssignments += 1;
    await classData.save();
    
    // Notify students
    const studentIds = classData.enrolledStudents
      .filter(s => s.status === 'active')
      .map(s => s.studentId);
    
    if (studentIds.length > 0 && Notification.createForUsers) {
      await Notification.createForUsers({
        title: 'New Assignment',
        message: `New assignment posted in ${classData.className}: ${title}`,
        type: 'assignment',
        priority: 'high',
        senderId: req.user.userId || req.user.email,
        senderName: req.user.username,
        senderRole: 'teacher',
        relatedEntity: {
          entityType: 'assignment',
          entityId: assignment._id
        }
      }, studentIds);
    }
    
    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message
    });
  }
};

// Get teacher's assignments
export const getTeacherAssignments = async (req, res) => {
  try {
    const { classId } = req.query;
    
    const query = { teacherId: req.user.userId || req.user.email };
    if (classId) {
      query.classId = classId;
    }
    
    const assignments = await Assignment.find(query)
      .populate('classId', 'className classCode subject')
      .sort({ dueDate: -1 });
    
    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message
    });
  }
};

// Get assignment details with submissions
export const getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    const assignment = await Assignment.findById(assignmentId)
      .populate('classId', 'className classCode subject')
      .populate('submissions.studentId', 'username email usn profilePicUrl');
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Check authorization
    if (assignment.teacherId.toString() !== (req.user.userId || req.user.email).toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    res.status(200).json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignment details',
      error: error.message
    });
  }
};

// Grade submission
export const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { pointsAwarded, grade, feedback } = req.body;
    
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Check authorization
    if (assignment.teacherId.toString() !== (req.user.userId || req.user.email).toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    assignment.gradeSubmission(submissionId, {
      pointsAwarded,
      grade,
      feedback,
      gradedBy: req.user.userId || req.user.email
    });
    
    await assignment.save();
    
    // Get submission details for notification
    const submission = assignment.submissions.id(submissionId);
    
    // Notify student
    if (Notification.createForUsers) {
      await Notification.createForUsers({
        title: 'Assignment Graded',
        message: `Your submission for "${assignment.title}" has been graded`,
        type: 'grade',
        priority: 'medium',
        senderId: req.user.userId || req.user.email,
        senderName: req.user.username,
        senderRole: 'teacher',
        relatedEntity: {
          entityType: 'assignment',
          entityId: assignment._id
        }
      }, [submission.studentId]);
    }
    
    res.status(200).json({
      success: true,
      message: 'Submission graded successfully',
      assignment
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to grade submission',
      error: error.message
    });
  }
};

/**
 * ATTENDANCE MANAGEMENT CONTROLLERS
 */

// Create attendance session
export const createAttendance = async (req, res) => {
  try {
    const { classId, date, startTime, endTime, topic } = req.body;
    
    // Verify class
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      classId,
      date: new Date(date)
    });
    
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already exists for this date'
      });
    }
    
    // Create attendance records for all enrolled students
    const records = classData.enrolledStudents
      .filter(s => s.status === 'active')
      .map(student => ({
        studentId: student.studentId,
        status: 'absent', // Default to absent
        markedAt: new Date()
      }));
    
    const attendance = new Attendance({
      classId,
      className: classData.className,
      teacherId: req.user.userId || req.user.email,
      date: new Date(date),
      startTime,
      endTime,
      topic,
      records,
      status: 'pending',
      stats: {
        totalStudents: records.length,
        present: 0,
        absent: records.length,
        late: 0,
        excused: 0,
        attendancePercentage: 0
      }
    });
    
    await attendance.save();
    
    res.status(201).json({
      success: true,
      message: 'Attendance session created',
      attendance
    });
  } catch (error) {
    console.error('Error creating attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create attendance',
      error: error.message
    });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { studentId, status, remarks } = req.body;
    
    const attendance = await Attendance.findById(attendanceId);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }
    
    // Check authorization
    const classData = await Class.findById(attendance.classId);
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    attendance.markAttendance(studentId, status, req.user.userId || req.user.email, remarks);
    await attendance.save();
    
    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Get class attendance history
export const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    
    const classData = await Class.findById(classId);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    if (classData.teacherEmail !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    
    const query = { classId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendanceRecords = await Attendance.find(query)
      .populate('records.studentId', 'username email usn profilePicUrl')
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      attendance: attendanceRecords
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: error.message
    });
  }
};

/**
 * ANALYTICS CONTROLLERS
 */

// Get teacher dashboard analytics
export const getTeacherAnalytics = async (req, res) => {
  try {
    const teacherEmail = req.user.email;
    
    // Get all teacher's classes
    const classes = await Class.find({ teacherEmail, status: 'active' });
    const classIds = classes.map(c => c._id);
    
    // Get assignments
    const assignments = await Assignment.find({ 
      teacherId: req.user.userId || req.user.email,
      status: 'published'
    });
    
    // Get recent attendance
    const recentAttendance = await Attendance.find({
      teacherId: req.user.userId || req.user.email
    })
    .sort({ date: -1 })
    .limit(10);
    
    // Calculate statistics
    const totalStudents = classes.reduce((sum, c) => sum + (c.enrolledStudents ? c.enrolledStudents.length : 0), 0);
    const totalAssignments = assignments.length;
    const pendingGrading = assignments.reduce((sum, a) => sum + (a.stats ? a.stats.pendingGrading : 0), 0);
    const averageAttendance = recentAttendance.length > 0
      ? recentAttendance.reduce((sum, a) => sum + (a.stats ? a.stats.attendancePercentage : 0), 0) / recentAttendance.length
      : 0;
    
    res.status(200).json({
      success: true,
      analytics: {
        totalClasses: classes.length,
        totalStudents,
        totalAssignments,
        pendingGrading,
        averageAttendance: Math.round(averageAttendance),
        recentClasses: classes.slice(0, 5),
        upcomingAssignments: assignments
          .filter(a => new Date(a.dueDate) > new Date())
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5)
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
