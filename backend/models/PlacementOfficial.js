import mongoose from 'mongoose';

const placementOfficialSchema = new mongoose.Schema({
  usn: { type: String, required: true, lowercase: true, trim: true, index: true },
  name: { type: String },
  branch: { type: String },
  batchYear: { type: String },
  officialCgpa: { type: Number },
  derivedBatch: { type: String },
  uploadId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementUpload' },
  uploadedBy: { type: String },
}, { timestamps: true, versionKey: false });

placementOfficialSchema.index({ usn: 1, uploadId: 1 }, { unique: true });

const PlacementOfficial = mongoose.model('PlacementOfficial', placementOfficialSchema);
export default PlacementOfficial;
