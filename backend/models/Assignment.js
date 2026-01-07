import mongoose from 'mongoose';

/**
 * Assignment Schema - Academic Assignment Management
 * Handles assignments, submissions, grading, and evaluations
 */
const assignmentSchema = new mongoose.Schema({
  // Assignment Details
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  instructions: {
    type: String,
    trim: true
  },
  
  // Class/Teacher Information
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  teacherName: {
    type: String,
    required: true
  },
  
  // Type and Category
  assignmentType: {
    type: String,
    enum: ['homework', 'quiz', 'project', 'lab', 'presentation', 'exam', 'other'],
    default: 'homework'
  },
  
  category: {
    type: String,
    enum: ['formative', 'summative', 'practice'],
    default: 'formative'
  },
  
  // Dates and Deadlines
  assignedDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  
  lateSubmissionDeadline: {
    type: Date
  },
  
  // Grading
  totalPoints: {
    type: Number,
    required: true,
    default: 100,
    min: 0
  },
  
  passingPoints: {
    type: Number,
    default: 40,
    min: 0
  },
  
  gradingRubric: {
    type: String,
    trim: true
  },
  
  // Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Submissions
  submissions: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studentName: String,
    studentEmail: String,
    
    // Submission Details
    submittedDate: {
      type: Date,
      default: Date.now
    },
    
    isLate: {
      type: Boolean,
      default: false
    },
    
    content: {
      type: String,
      trim: true
    },
    
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String,
      uploadedDate: Date
    }],
    
    // Grading
    status: {
      type: String,
      enum: ['submitted', 'graded', 'returned', 'resubmission_required'],
      default: 'submitted'
    },
    
    pointsAwarded: {
      type: Number,
      min: 0
    },
    
    grade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'Pass', 'Fail', '']
    },
    
    feedback: {
      type: String,
      trim: true
    },
    
    gradedDate: Date,
    
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Settings
  settings: {
    allowLateSubmission: {
      type: Boolean,
      default: true
    },
    
    latePenalty: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    
    allowResubmission: {
      type: Boolean,
      default: false
    },
    
    maxResubmissions: {
      type: Number,
      default: 1,
      min: 0
    },
    
    requireFile: {
      type: Boolean,
      default: false
    },
    
    acceptedFileTypes: [{
      type: String
    }],
    
    maxFileSize: {
      type: Number,
      default: 10 // MB
    },
    
    showGradesToStudents: {
      type: Boolean,
      default: true
    },
    
    peerReview: {
      type: Boolean,
      default: false
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft',
    index: true
  },
  
  // Statistics
  stats: {
    totalSubmissions: {
      type: Number,
      default: 0
    },
    
    onTimeSubmissions: {
      type: Number,
      default: 0
    },
    
    lateSubmissions: {
      type: Number,
      default: 0
    },
    
    pendingGrading: {
      type: Number,
      default: 0
    },
    
    averageScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
assignmentSchema.index({ classId: 1, status: 1 });
assignmentSchema.index({ teacherId: 1, dueDate: 1 });
assignmentSchema.index({ 'submissions.studentId': 1 });
assignmentSchema.index({ dueDate: 1, status: 1 });

// Virtual to check if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status === 'published';
});

// Method to add submission
assignmentSchema.methods.addSubmission = function(submissionData) {
  const existingSubmission = this.submissions.find(
    s => s.studentId.toString() === submissionData.studentId.toString()
  );
  
  if (existingSubmission) {
    if (!this.settings.allowResubmission) {
      throw new Error('Resubmission not allowed');
    }
    
    const resubmissionCount = this.submissions.filter(
      s => s.studentId.toString() === submissionData.studentId.toString()
    ).length;
    
    if (resubmissionCount >= this.settings.maxResubmissions) {
      throw new Error('Maximum resubmissions reached');
    }
  }
  
  const isLate = new Date() > this.dueDate;
  
  if (isLate && !this.settings.allowLateSubmission) {
    throw new Error('Late submission not allowed');
  }
  
  this.submissions.push({
    ...submissionData,
    isLate,
    submittedDate: new Date(),
    status: 'submitted'
  });
  
  this.stats.totalSubmissions += 1;
  if (isLate) {
    this.stats.lateSubmissions += 1;
  } else {
    this.stats.onTimeSubmissions += 1;
  }
  this.stats.pendingGrading += 1;
};

// Method to grade submission
assignmentSchema.methods.gradeSubmission = function(submissionId, gradeData) {
  const submission = this.submissions.id(submissionId);
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.status = 'graded';
  submission.pointsAwarded = gradeData.pointsAwarded;
  submission.grade = gradeData.grade;
  submission.feedback = gradeData.feedback;
  submission.gradedDate = new Date();
  submission.gradedBy = gradeData.gradedBy;
  
  this.stats.pendingGrading = Math.max(0, this.stats.pendingGrading - 1);
  
  // Recalculate average score
  const gradedSubmissions = this.submissions.filter(s => s.status === 'graded');
  if (gradedSubmissions.length > 0) {
    const total = gradedSubmissions.reduce((sum, s) => sum + (s.pointsAwarded || 0), 0);
    this.stats.averageScore = total / gradedSubmissions.length;
  }
};

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
