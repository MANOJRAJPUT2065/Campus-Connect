import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    usn: { type: String, required: false, unique: true, sparse: true, trim: true, lowercase: true },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    profilePicUrl: { type: String },
    admin: { type: Boolean, default: false },
    role: { type: String, enum: ['student', 'teacher', 'coordinator'], default: 'student' },
    clubsManaged: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],
    department: String,
    semester: Number,
  },
  { timestamps: true, versionKey: false }
);

// Ensure unique indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ usn: 1 }, { unique: true, sparse: true });

const User = mongoose.model('User', userSchema);

export default User;
