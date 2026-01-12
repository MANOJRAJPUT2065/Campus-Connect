import express from 'express';
import multer from 'multer';
import { uploadProfilePic, deleteProfilePic, updateCgpa } from '../controllers/UserProfileController.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile_pics',
    allowed_formats: ['jpg', 'png', 'avif', 'jpeg'],
  },
});

const upload = multer({ storage });

router.post('/uploadProfilePic', upload.single('file'), uploadProfilePic);
router.delete('/deleteProfilePic', deleteProfilePic);
router.put('/cgpa', authenticateToken, requireRole(['coordinator', 'admin']), updateCgpa);

export default router;
