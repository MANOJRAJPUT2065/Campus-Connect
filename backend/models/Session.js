import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    instructorId: { type: String, required: true }, // Can be email, USN, or ObjectId
    instructorName: { type: String, default: 'Instructor' },
    channelName: { type: String, unique: true, required: true },
    sessionLink: String,
    branch: { type: String, default: null },
    semester: { type: Number, default: null },
    startTime: Date,
    endTime: Date,
    duration: String,
    status: { 
      type: String, 
      enum: ['scheduled', 'live', 'ended'], 
      default: 'scheduled' 
    },
    maxParticipants: { type: Number, default: 50 },
    participants: [
      {
        // Allow non-ObjectId identifiers (e.g., email/usn) to avoid cast errors
        userId: { type: String, required: true },
        userName: String,
        joinedAt: Date,
        role: String
      }
    ],
    isRecording: { type: Boolean, default: false },
    recordingUrl: String,
    settings: {
      allowChat: { type: Boolean, default: true },
      allowScreenShare: { type: Boolean, default: true },
      allowRecording: { type: Boolean, default: true },
      isLocked: { type: Boolean, default: false }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
