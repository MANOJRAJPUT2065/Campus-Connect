import mongoose from 'mongoose';

const placementStudentSchema = new mongoose.Schema({
  usn: { type: String, required: true, lowercase: true, trim: true, index: true },
  name: { type: String },
  branch: { type: String },
  batchYear: { type: String },
  derivedBatch: { type: String },
  companyId: { type: String },
  companyName: { type: String },
  enteredCgpa: { type: Number },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementUpload' },
  uploadedBy: { type: String },
}, { timestamps: true, versionKey: false });

placementStudentSchema.index({ usn: 1, companyId: 1, uploadId: 1 });

const PlacementStudent = mongoose.model('PlacementStudent', placementStudentSchema);
export default PlacementStudent;
