import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { extractPublicId } from 'cloudinary-build-url'


export const uploadProfilePic = async (req, res) => {
  try {
    const { usn } = req.body;
    const profilePicUrl = req.file.path?req.file.path:null;

    const user = await User.findOneAndUpdate(
      { usn },
      { profilePicUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ profilePicUrl: user.profilePicUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Allow students to submit or update their CGPA with optional proof link
export const updateCgpa = async (req, res) => {
  try {
    // Only coordinator/admin can set official CGPA for a student
    if (req.user?.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students cannot update official CGPA' });
    }

    const rawCgpa = req.body.cgpa;
    const proofUrl = req.body.proofUrl;
    const studentId = req.body.studentId;
    const usn = req.body.usn;
    const numericCgpa = Number(rawCgpa);

    if (rawCgpa === undefined || Number.isNaN(numericCgpa)) {
      return res.status(400).json({ success: false, message: 'Valid cgpa is required' });
    }

    if (!studentId && !usn) {
      return res.status(400).json({ success: false, message: 'Provide studentId or usn to update CGPA' });
    }

    const student = await User.findOne({
      role: 'student',
      $or: [
        studentId ? { _id: studentId } : null,
        usn ? { usn: (usn || '').toLowerCase() } : null
      ].filter(Boolean)
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updates = {
      cgpa: numericCgpa,
      cgpaVerified: true,
      cgpaLastUpdated: new Date(),
      cgpaFlagReason: null,
    };

    if (proofUrl !== undefined) {
      updates.cgpaProofUrl = proofUrl || null;
    }

    // Guard: keep within logical bounds
    if (numericCgpa < 0 || numericCgpa > 10) {
      updates.cgpaFlagReason = 'Out of valid range (0-10)';
      updates.cgpaVerified = false;
    }

    const updated = await User.findByIdAndUpdate(student._id, updates, {
      new: true,
      select: 'username email usn department semester cgpa cgpaVerified cgpaFlagReason cgpaProofUrl cgpaLastUpdated',
    });

    res.status(200).json({
      success: true,
      message: 'Official CGPA updated',
      student: updated,
    });
  } catch (error) {
    console.error('Error updating CGPA:', error);
    res.status(500).json({ success: false, message: 'Failed to update CGPA' });
  }
};

export const deleteProfilePic = async (req, res) => {
  try {
    const { usn } = req.body;

    const user = await User.findOne({ usn });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profilePicUrl) {
      const publicId = extractPublicId(user.profilePicUrl);
      // console.log(publicId)
      await cloudinary.uploader.destroy(publicId);
    }

    user.profilePicUrl = null;
    await user.save();

    res.status(200).json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

