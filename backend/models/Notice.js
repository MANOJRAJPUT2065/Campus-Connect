import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  category: { type: String, default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, default: 'coordinator' },
  branch: { type: String, default: null },
  semester: { type: Number, default: null },
  targetRoles: { type: [String], default: ['student'] },
  attachments: [{ type: String }],
  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

noticeSchema.index({ branch: 1, semester: 1, targetRoles: 1, isActive: 1, publishedAt: -1 });

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;