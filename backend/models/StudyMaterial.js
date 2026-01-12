import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, enum: ['pdf', 'video', 'link', 'document', 'presentation', 'other'], default: 'document' },
  fileUrl: { type: String, required: true },
  branch: { type: String, required: true, trim: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  teacherId: { type: String, required: true },
  teacherName: { type: String, required: true },
  teacherEmail: { type: String },
  publishedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

studyMaterialSchema.index({ branch: 1, semester: 1, subject: 1, publishedAt: -1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

export default StudyMaterial;