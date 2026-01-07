import mongoose from 'mongoose';

/**
 * Attendance Schema - Class Attendance Tracking
 * Tracks daily attendance for classes with multiple status options
 */
const attendanceSchema = new mongoose.Schema({
  // Class Information
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  
  className: {
    type: String,
    required: true
  },
  
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Date Information
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  startTime: {
    type: String,
    required: true
  },
  
  endTime: {
    type: String,
    required: true
  },
  
  // Topic Covered
  topic: {
    type: String,
    trim: true
  },
  
  // Student Attendance Records
  records: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    studentName: String,
    studentEmail: String,
    studentUsn: String,
    
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
      default: 'absent'
    },
    
    markedAt: {
      type: Date,
      default: Date.now
    },
    
    remarks: {
      type: String,
      trim: true
    },
    
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Statistics
  stats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    
    present: {
      type: Number,
      default: 0
    },
    
    absent: {
      type: Number,
      default: 0
    },
    
    late: {
      type: Number,
      default: 0
    },
    
    excused: {
      type: Number,
      default: 0
    },
    
    attendancePercentage: {
      type: Number,
      default: 0
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'locked'],
    default: 'pending'
  },
  
  // Notes
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Compound indexes
attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'records.studentId': 1, date: 1 });
attendanceSchema.index({ teacherId: 1, date: -1 });

// Method to mark attendance
attendanceSchema.methods.markAttendance = function(studentId, status, markedBy, remarks = '') {
  const record = this.records.find(r => r.studentId.toString() === studentId.toString());
  
  if (!record) {
    this.records.push({
      studentId,
      status,
      markedAt: new Date(),
      markedBy,
      remarks
    });
  } else {
    record.status = status;
    record.markedAt = new Date();
    record.markedBy = markedBy;
    record.remarks = remarks;
  }
  
  this.calculateStats();
};

// Method to calculate statistics
attendanceSchema.methods.calculateStats = function() {
  const stats = {
    totalStudents: this.records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0
  };
  
  this.records.forEach(record => {
    if (stats[record.status] !== undefined) {
      stats[record.status]++;
    }
  });
  
  stats.attendancePercentage = stats.totalStudents > 0 
    ? ((stats.present + stats.late) / stats.totalStudents) * 100 
    : 0;
  
  this.stats = stats;
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
