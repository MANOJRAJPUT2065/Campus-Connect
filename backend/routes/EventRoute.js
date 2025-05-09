// import express from 'express';
// import { addEvent, getAllEvents } from '../controllers/EventController.js';
// import multer from 'multer';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import cloudinary from '../config/cloudinary.js';

// const router = express.Router();

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'post_images',
//     allowed_formats: ['jpg', 'png', 'avif', 'jpeg'],
//   },
// });

// const upload = multer({ storage });

// router.post('/addEvent', upload.single('eventImage'), addEvent);
// router.get('/getEvents', getAllEvents);

// export default router;

import express from 'express';
import { addEvent, getAllEvents } from '../controllers/EventController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Configure Cloudinary storage for file uploads
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'post_images', // Specify the folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif'], // Allowed image formats
  },
});

// Set up multer middleware with Cloudinary storage
const upload = multer({ storage });

// Routes
router.post('/addEvent', upload.single('eventImage'), addEvent); // Image upload handled here
router.get('/getEvents', getAllEvents);

export default router;
