import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    // Basic Event Information (Required Fields)
    clubName: { 
        type: String, 
        required: true,
        trim: true
    },
    clubCoordinator: { 
        type: String, 
        required: true,
        trim: true
    },
    contactNumber: { 
        type: String, 
        required: true,
        trim: true
    },
    eventName: { 
        type: String, 
        required: true,
        trim: true
    },
    eventDescription: { 
        type: String, 
        required: true,
        trim: true
    },
    eventDate: { 
        type: Date, 
        required: true
    },
    eventTime: { 
        type: String, 
        required: true,
        trim: true
    },
    venue: { 
        type: String, 
        required: true,
        trim: true
    },
    registrationLink: { 
        type: String, 
        required: true,
        trim: true
    },
    eventImage: { 
        type: String, 
        required: false,
        default: ''
    },
    
    // Simple Event Details
    category: { 
        type: String, 
        required: false,
        enum: ['academic', 'cultural', 'technical', 'sports', 'workshop', 'seminar', 'competition', 'social', 'other'],
        default: 'other'
    },
    tags: [{ 
        type: String,
        trim: true
    }],
    eventType: { 
        type: String, 
        enum: ['online', 'offline', 'hybrid'],
        default: 'offline'
    },
    maxParticipants: { 
        type: Number, 
        default: 0,
        min: 0
    },
    entryFee: { 
        type: Number, 
        default: 0,
        min: 0
    },
    
    // Simple Status
    status: { 
        type: String, 
        enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
        default: 'draft'
    },
    isFeatured: { 
        type: Boolean, 
        default: false 
    },
    
    // Coordinator and Ownership (ENHANCED)
    coordinatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    
    coordinatorEmail: {
        type: String,
        trim: true,
        lowercase: true,
        index: true
    },
    
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    },
    
    // Participant Management (NEW)
    registrations: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: String,
        email: String,
        phone: String,
        usn: String,
        registeredAt: {
            type: Date,
            default: Date.now
        },
        approvalStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'waitlisted'],
            default: 'pending'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        rejectionReason: String,
        attended: {
            type: Boolean,
            default: false
        },
        attendedAt: Date
    }],
    
    // Registration Settings (NEW)
    registrationDeadline: {
        type: Date
    },
    
    requiresApproval: {
        type: Boolean,
        default: false
    },
    
    autoApprove: {
        type: Boolean,
        default: true
    },
    
    // Capacity Management (ENHANCED)
    currentParticipants: {
        type: Number,
        default: 0
    },
    
    approvedParticipants: {
        type: Number,
        default: 0
    },
    
    waitlistCount: {
        type: Number,
        default: 0
    },
    
    // Simple Schedule
    startTime: { 
        type: Date, 
        required: false
    },
    endTime: { 
        type: Date, 
        required: false
    },
    
    // Simple Location
    locationType: { 
        type: String, 
        enum: ['physical', 'virtual', 'hybrid'],
        default: 'physical'
    },
    city: { 
        type: String, 
        default: '',
        trim: true
    },
    state: { 
        type: String, 
        default: '',
        trim: true
    },
    
    // Simple Arrays
    targetAudience: [{ 
        type: String,
        trim: true
    }],
    agenda: [{ 
        type: String,
        trim: true
    }],
    
    // Basic Stats
    likes: { 
        type: Number, 
        default: 0 
    },
    views: { 
        type: Number, 
        default: 0 
    },
    
    // Google Calendar Integration
    googleCalendarId: {
        type: String,
        default: null
    },
    isSyncedToCalendar: {
        type: Boolean,
        default: false
    },
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true,
    strict: false // Allow additional fields
});

// Pre-save middleware to update timestamps
eventSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    
    // Calculate start and end times if not provided
    if (this.eventDate && this.eventTime && !this.startTime) {
        try {
            const [hours, minutes] = this.eventTime.split(':');
            this.startTime = new Date(this.eventDate);
            this.startTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
            
            // Default duration: 2 hours
            this.endTime = new Date(this.startTime);
            this.endTime.setHours(this.startTime.getHours() + 2);
        } catch (error) {
            console.log('Time parsing error:', error);
        }
    }
    
    next();
});

// Virtual for event status based on date
eventSchema.virtual('currentStatus').get(function() {
    if (this.status === 'cancelled') return 'cancelled';
    if (this.startTime && new Date() < this.startTime) return 'upcoming';
    if (this.endTime && new Date() > this.endTime) return 'completed';
    if (this.startTime && this.endTime && new Date() >= this.startTime && new Date() <= this.endTime) return 'ongoing';
    return 'scheduled';
});

// Static method to get upcoming events
eventSchema.statics.getUpcomingEvents = function(limit = 10) {
    return this.find({
        startTime: { $gt: new Date() },
        status: { $in: ['published', 'draft'] }
    })
    .sort({ startTime: 1 })
    .limit(limit);
};

// Static method to get featured events
eventSchema.statics.getFeaturedEvents = function(limit = 5) {
    return this.find({
        isFeatured: true,
        status: { $in: ['published', 'draft'] }
    })
    .sort({ startTime: 1 })
    .limit(limit);
};

// Static method to search events
eventSchema.statics.searchEvents = function(query, filters = {}) {
    const searchQuery = {
        $or: [
            { eventName: { $regex: query, $options: 'i' } },
            { eventDescription: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } },
            { category: { $regex: query, $options: 'i' } }
        ]
    };
    
    // Apply additional filters
    if (filters.category) searchQuery.category = filters.category;
    if (filters.status) searchQuery.status = filters.status;
    if (filters.eventType) searchQuery.eventType = filters.eventType;
    
    return this.find(searchQuery).sort({ startTime: 1 });
};

// Method to check if registration is open (NEW)
eventSchema.methods.isRegistrationOpen = function() {
    if (!this.registrationDeadline) return true;
    return new Date() < this.registrationDeadline;
};

// Method to check if event is full (NEW)
eventSchema.methods.isFull = function() {
    if (this.maxParticipants === 0) return false;
    return this.approvedParticipants >= this.maxParticipants;
};

// Method to approve participant (NEW)
eventSchema.methods.approveParticipant = function(userId, approvedBy) {
    const registration = this.registrations.find(r => r.userId.toString() === userId.toString());
    
    if (!registration) {
        throw new Error('Registration not found');
    }
    
    if (registration.approvalStatus === 'approved') {
        throw new Error('Already approved');
    }
    
    if (this.isFull()) {
        registration.approvalStatus = 'waitlisted';
        this.waitlistCount += 1;
        throw new Error('Event is full, added to waitlist');
    }
    
    registration.approvalStatus = 'approved';
    registration.approvedBy = approvedBy;
    registration.approvedAt = new Date();
    this.approvedParticipants += 1;
};

// Method to reject participant (NEW)
eventSchema.methods.rejectParticipant = function(userId, reason, rejectedBy) {
    const registration = this.registrations.find(r => r.userId.toString() === userId.toString());
    
    if (!registration) {
        throw new Error('Registration not found');
    }
    
    if (registration.approvalStatus === 'rejected') {
        throw new Error('Already rejected');
    }
    
    const wasApproved = registration.approvalStatus === 'approved';
    
    registration.approvalStatus = 'rejected';
    registration.rejectionReason = reason;
    registration.approvedBy = rejectedBy;
    registration.approvedAt = new Date();
    
    if (wasApproved) {
        this.approvedParticipants = Math.max(0, this.approvedParticipants - 1);
    }
};

const Event = mongoose.model('Event', eventSchema);

export default Event;
