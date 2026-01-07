import mongoose from 'mongoose';

/**
 * Club Schema - Student Club Management
 * Manages clubs, members, coordinators, and club activities
 */
const clubSchema = new mongoose.Schema({
  // Basic Information
  clubName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  clubCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  tagline: {
    type: String,
    trim: true
  },
  
  // Visual Assets
  logo: {
    type: String
  },
  
  coverImage: {
    type: String
  },
  
  // Club Category
  category: {
    type: String,
    enum: ['technical', 'cultural', 'sports', 'arts', 'social', 'academic', 'other'],
    required: true
  },
  
  // Coordinators
  coordinators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['president', 'vice-president', 'secretary', 'treasurer', 'coordinator'],
      default: 'coordinator'
    },
    joinedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Members
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    usn: String,
    department: String,
    semester: Number,
    
    joinedDate: {
      type: Date,
      default: Date.now
    },
    
    status: {
      type: String,
      enum: ['active', 'inactive', 'removed'],
      default: 'active'
    },
    
    membershipType: {
      type: String,
      enum: ['core', 'regular', 'volunteer'],
      default: 'regular'
    }
  }],
  
  // Club Details
  foundedDate: {
    type: Date
  },
  
  department: {
    type: String,
    trim: true
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  contactPhone: {
    type: String,
    trim: true
  },
  
  socialLinks: {
    website: String,
    instagram: String,
    linkedin: String,
    twitter: String,
    facebook: String
  },
  
  // Settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    
    requireApproval: {
      type: Boolean,
      default: true
    },
    
    maxMembers: {
      type: Number,
      default: 100
    },
    
    allowMultipleMembership: {
      type: Boolean,
      default: true
    }
  },
  
  // Events (reference to events created by this club)
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },
  
  // Statistics
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    
    activeMembers: {
      type: Number,
      default: 0
    },
    
    totalEvents: {
      type: Number,
      default: 0
    },
    
    upcomingEvents: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
clubSchema.index({ clubName: 1 });
clubSchema.index({ category: 1, status: 1 });
clubSchema.index({ 'coordinators.userId': 1 });
clubSchema.index({ 'members.userId': 1 });

// Virtual for active member count
clubSchema.virtual('activeMemberCount').get(function() {
  return this.members.filter(m => m.status === 'active').length;
});

// Method to add member
clubSchema.methods.addMember = function(memberData) {
  const alreadyMember = this.members.some(
    m => m.userId.toString() === memberData.userId.toString()
  );
  
  if (alreadyMember) {
    throw new Error('User is already a member');
  }
  
  if (this.activeMemberCount >= this.settings.maxMembers) {
    throw new Error('Club has reached maximum member capacity');
  }
  
  this.members.push({
    ...memberData,
    joinedDate: new Date(),
    status: 'active'
  });
  
  this.stats.totalMembers += 1;
  this.stats.activeMembers += 1;
};

// Method to add coordinator
clubSchema.methods.addCoordinator = function(coordinatorData) {
  const alreadyCoordinator = this.coordinators.some(
    c => c.userId.toString() === coordinatorData.userId.toString()
  );
  
  if (alreadyCoordinator) {
    throw new Error('User is already a coordinator');
  }
  
  this.coordinators.push({
    ...coordinatorData,
    joinedDate: new Date()
  });
};

// Method to check if user is coordinator
clubSchema.methods.isCoordinator = function(userId) {
  return this.coordinators.some(
    c => c.userId.toString() === userId.toString()
  );
};

const Club = mongoose.model('Club', clubSchema);

export default Club;
