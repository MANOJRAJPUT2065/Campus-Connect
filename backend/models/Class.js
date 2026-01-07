import mongoose from 'mongoose';

/**
 * Class Schema - Academic Class Management
 * Represents a course/subject taught by a teacher with enrolled students
 */
const classSchema = new mongoose.Schema({
  // Basic Information
  className: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  classCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Teacher Information
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  teacherEmail: {
    type: String,
    required: true,
    index: true
  },
  
  teacherName: {
    type: String,
    required: true
  },
  
  // Academic Details
  department: {
    type: String,
    required: true,
    trim: true
  },
  
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  
  // Schedule
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      trim: true
    }
  }],
  
  // Students
  enrolledStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'dropped', 'completed'],
      default: 'active'
    }
  }],
  
  maxStudents: {
    type: Number,
    default: 60
  },
  
  // Materials
  materials: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'document', 'presentation', 'other'],
      default: 'document'
    },
    fileUrl: String,
    uploadedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Class Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Settings
  settings: {
    allowLateSubmissions: {
      type: Boolean,
      default: true
    },
    autoGrading: {
      type: Boolean,
      default: false
    },
    attendanceRequired: {
      type: Boolean,
      default: true
    },
    minimumAttendance: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    }
  },
  
  // Statistics
  stats: {
    totalClasses: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
classSchema.index({ teacherId: 1, status: 1 });
classSchema.index({ 'enrolledStudents.studentId': 1 });
classSchema.index({ department: 1, semester: 1 });

// Virtual for student count
classSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.filter(s => s.status === 'active').length;
});

// Method to check if class is full
classSchema.methods.isFull = function() {
  return this.enrolledCount >= this.maxStudents;
};

// Method to add student
classSchema.methods.addStudent = function(studentId) {
  const alreadyEnrolled = this.enrolledStudents.some(
    s => s.studentId.toString() === studentId.toString()
  );
  
  if (alreadyEnrolled) {
    throw new Error('Student already enrolled');
  }
  
  if (this.isFull()) {
    throw new Error('Class is full');
  }
  
  this.enrolledStudents.push({
    studentId,
    enrolledDate: new Date(),
    status: 'active'
  });
};

const Class = mongoose.model('Class', classSchema);

export default Class;
