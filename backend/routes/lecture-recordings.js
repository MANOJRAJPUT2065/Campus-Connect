import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import LectureRecording from '../models/LectureRecording.js';

dotenv.config();

const router = express.Router();

// Configure Cloudinary for video storage
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for video uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video and audio files are allowed'), false);
    }
  }
});

// Upload lecture recording
router.post('/upload', upload.single('recording'), async (req, res) => {
  try {
    const { title, description, subject, instructor, duration, tags } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No recording file provided' 
      });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'lecture-recordings',
          public_id: `${Date.now()}_${title.replace(/\s+/g, '_')}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(file.buffer);
    });

    // Create recording record
    const recording = new LectureRecording({
      title,
      description,
      subject,
      instructor,
      duration: parseInt(duration),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      videoUrl: result.secure_url,
      cloudinaryId: result.public_id,
      fileSize: file.size,
      format: file.mimetype,
      uploadedBy: req.user?.email || 'anonymous'
    });

    await recording.save();

    res.status(201).json({
      success: true,
      message: 'Lecture recording uploaded successfully',
      recording: {
        id: recording._id,
        title: recording.title,
        videoUrl: recording.videoUrl,
        duration: recording.duration,
        subject: recording.subject
      }
    });

  } catch (error) {
    console.error('Recording upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload recording' 
    });
  }
});

// Get all recordings with filters
router.get('/', async (req, res) => {
  try {
    const { subject, instructor, tags, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (instructor) query.instructor = { $regex: instructor, $options: 'i' };
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const recordings = await LectureRecording.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await LectureRecording.countDocuments(query);

    res.json({
      success: true,
      recordings,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + recordings.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Recordings fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recordings' 
    });
  }
});

// Get recording by ID
router.get('/:id', async (req, res) => {
  try {
    const recording = await LectureRecording.findById(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recording not found' 
      });
    }

    // Increment view count
    recording.views += 1;
    await recording.save();

    res.json({
      success: true,
      recording
    });

  } catch (error) {
    console.error('Recording fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch recording' 
    });
  }
});

// Update recording metadata
router.put('/:id', async (req, res) => {
  try {
    const { title, description, subject, tags } = req.body;
    
    const recording = await LectureRecording.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recording not found' 
      });
    }

    // Update fields
    if (title) recording.title = title;
    if (description) recording.description = description;
    if (subject) recording.subject = subject;
    if (tags) recording.tags = tags.split(',').map(tag => tag.trim());

    await recording.save();

    res.json({
      success: true,
      message: 'Recording updated successfully',
      recording
    });

  } catch (error) {
    console.error('Recording update error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update recording' 
    });
  }
});

// Delete recording
router.delete('/:id', async (req, res) => {
  try {
    const recording = await LectureRecording.findById(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recording not found' 
      });
    }

    // Delete from Cloudinary
    if (recording.cloudinaryId) {
      await cloudinary.uploader.destroy(recording.cloudinaryId, { resource_type: 'video' });
    }

    await LectureRecording.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Recording deleted successfully'
    });

  } catch (error) {
    console.error('Recording delete error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete recording' 
    });
  }
});

// Search recordings
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const searchQuery = {
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { subject: { $regex: query, $options: 'i' } },
        { instructor: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };

    const recordings = await LectureRecording.find(searchQuery)
      .sort({ relevance: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LectureRecording.countDocuments(searchQuery);

    res.json({
      success: true,
      recordings,
      query,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        hasNext: skip + recordings.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Recording search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search recordings' 
    });
  }
});

export default router;
