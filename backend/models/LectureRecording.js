import mongoose from 'mongoose';

const lectureRecordingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  videoUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    required: true
  },
  format: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  thumbnailUrl: {
    type: String
  },
  transcript: {
    type: String
  },
  chapters: [{
    title: String,
    startTime: Number, // in seconds
    endTime: Number
  }]
}, {
  timestamps: true
});

// Index for search optimization
lectureRecordingSchema.index({
  title: 'text',
  description: 'text',
  subject: 'text',
  tags: 'text'
});

// Virtual for formatted duration
lectureRecordingSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for formatted file size
lectureRecordingSchema.virtual('formattedFileSize').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Ensure virtual fields are serialized
lectureRecordingSchema.set('toJSON', { virtuals: true });
lectureRecordingSchema.set('toObject', { virtuals: true });

const LectureRecording = mongoose.model('LectureRecording', lectureRecordingSchema);

export default LectureRecording;
