import mongoose from 'mongoose';

/**
 * Notification Schema - System-wide Notification Management
 * Handles academic, event, announcement, and system notifications
 */
const notificationSchema = new mongoose.Schema({
  // Notification Content
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Type and Category
  type: {
    type: String,
    enum: ['academic', 'event', 'announcement', 'system', 'assignment', 'grade', 'attendance', 'general'],
    required: true,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Sender Information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  senderName: String,
  senderRole: {
    type: String,
    enum: ['admin', 'teacher', 'coordinator', 'system']
  },
  
  // Recipients
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    isRead: {
      type: Boolean,
      default: false
    },
    
    readAt: Date,
    
    isArchived: {
      type: Boolean,
      default: false
    }
  }],
  
  // Targeting
  targetRoles: [{
    type: String,
    enum: ['student', 'teacher', 'coordinator', 'admin', 'all']
  }],
  
  targetDepartments: [String],
  targetSemesters: [Number],
  
  // Related Entities
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['class', 'assignment', 'event', 'club', 'attendance', 'post', 'none'],
      default: 'none'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // Action/Link
  actionUrl: {
    type: String,
    trim: true
  },
  
  actionLabel: {
    type: String,
    trim: true
  },
  
  // Scheduling
  scheduledFor: {
    type: Date
  },
  
  expiresAt: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'expired'],
    default: 'sent',
    index: true
  },
  
  // Metadata
  metadata: {
    imageUrl: String,
    iconName: String,
    color: String
  },
  
  // Statistics
  stats: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    
    readCount: {
      type: Number,
      default: 0
    },
    
    unreadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
notificationSchema.index({ 'recipients.userId': 1, 'recipients.isRead': 1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ senderId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = function(userId) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId.toString());
  
  if (recipient && !recipient.isRead) {
    recipient.isRead = true;
    recipient.readAt = new Date();
    this.stats.readCount += 1;
    this.stats.unreadCount = Math.max(0, this.stats.unreadCount - 1);
  }
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function(userId) {
  const recipient = this.recipients.find(r => r.userId.toString() === userId.toString());
  
  if (recipient && recipient.isRead) {
    recipient.isRead = false;
    recipient.readAt = null;
    this.stats.readCount = Math.max(0, this.stats.readCount - 1);
    this.stats.unreadCount += 1;
  }
};

// Static method to create notification for multiple users
notificationSchema.statics.createForUsers = async function(notificationData, userIds) {
  const recipients = userIds.map(userId => ({
    userId,
    isRead: false,
    isArchived: false
  }));
  
  const notification = new this({
    ...notificationData,
    recipients,
    stats: {
      totalRecipients: recipients.length,
      readCount: 0,
      unreadCount: recipients.length
    }
  });
  
  return await notification.save();
};

// Static method to create notification for role
notificationSchema.statics.createForRole = async function(notificationData, role) {
  const User = mongoose.model('User');
  const users = await User.find({ role }).select('_id');
  const userIds = users.map(u => u._id);
  
  return await this.createForUsers(notificationData, userIds);
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
