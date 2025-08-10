import express from 'express';
import { 
  addEvent, 
  getAllEvents, 
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getFeaturedEvents,
  searchEvents,
  toggleEventLike,
  addEventReview,
  getEventAnalytics,
  getEventsByCategory
} from '../controllers/EventController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import eventRegistrationRoute from './registerEventRoutes.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'event_images', // Changed from post_images to event_images
    allowed_formats: ['jpg', 'png', 'jpeg', 'avif', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'fill' },
      { quality: 'auto' }
    ]
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ===== BASIC EVENT CRUD =====
router.post('/addEvent', upload.single('eventImage'), addEvent);
router.get('/getEvents', getAllEvents);
router.get('/event/:id', getEventById);
router.put('/event/:id', upload.single('eventImage'), updateEvent);
router.delete('/event/:id', deleteEvent);

// ===== ADVANCED EVENT FEATURES =====
router.get('/upcoming', getUpcomingEvents);
router.get('/featured', getFeaturedEvents);
router.get('/search', searchEvents);
router.get('/category/:category', getEventsByCategory);

// ===== SOCIAL FEATURES =====
router.post('/event/:id/like', toggleEventLike);
router.post('/event/:id/review', addEventReview);

// ===== ANALYTICS =====
router.get('/event/:id/analytics', getEventAnalytics);

// ✅ Mount ALL event registration-related routes
router.use('/registerEvent', eventRegistrationRoute);

export default router;
