


//   // routes/eventRoutes.js
// import express from 'express';
// import { addEvent, getAllEvents } from '../controllers/EventController.js';
// import multer from 'multer';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import cloudinary from '../config/cloudinary.js';
// import  eventRegistrationRoute from './registerEventRoutes.js'

// const router = express.Router();

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'post_images', // Cloudinary folder
//     allowed_formats: ['jpg', 'png', 'jpeg', 'avif'],
//   },
// });

// const upload = multer({ storage });

// // Routes
// router.post('/addEvent', upload.single('eventImage'), addEvent);
// router.get('/getEvents', getAllEvents);
// router.post('/registerEvent', eventRegistrationRoute);
// router.get('/')
// export default router;


import express from 'express';
import { addEvent, getAllEvents } from '../controllers/EventController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import eventRegistrationRoute from './registerEventRoutes.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'post_images', // Cloudinary folder
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif'],
  },
});

const upload = multer({ storage });

// Event CRUD
router.post('/addEvent', upload.single('eventImage'), addEvent);
router.get('/getEvents', getAllEvents);

// ✅ Mount ALL event registration-related routes
router.use('/registerEvent', eventRegistrationRoute);

export default router;
