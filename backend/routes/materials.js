import express from 'express';
import StudyMaterial from '../models/StudyMaterial.js';
import { authenticateToken, optionalAuth, requireRole } from '../middlewares/auth.js';

const router = express.Router();

// Create material (teacher)
router.post('/', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { title, subject, description, type = 'document', fileUrl, branch, semester } = req.body;

    if (!title || !subject || !fileUrl || !branch || semester === undefined || semester === null) {
      return res.status(400).json({ success: false, error: 'title, subject, fileUrl, branch, and semester are required' });
    }

    const normalizedBranch = String(branch).trim().toLowerCase();
    const semNum = Number(semester);
    if (Number.isNaN(semNum)) {
      return res.status(400).json({ success: false, error: 'Semester must be a number' });
    }

    const material = await StudyMaterial.create({
      title,
      subject,
      description,
      type,
      fileUrl,
      branch: normalizedBranch,
      semester: semNum,
      teacherId: req.user.userId || req.user.email,
      teacherName: req.user.username || req.user.email,
      teacherEmail: req.user.email
    });

    res.status(201).json({ success: true, material });
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ success: false, error: 'Failed to create material' });
  }
});

// Debug: Get ALL materials (no filtering)
router.get('/debug/all', async (req, res) => {
  try {
    const materials = await StudyMaterial.find({})
      .sort({ publishedAt: -1 })
      .lean();

    console.log('All materials in DB:', materials.length);
    console.log('Materials:', JSON.stringify(materials, null, 2));
    res.json({ success: true, materials, total: materials.length });
  } catch (error) {
    console.error('Debug materials error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get materials (student-facing, filter by branch/semester/subject)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { branch, semester, subject } = req.query;

    const tokenBranch = req.user?.department || req.user?.branch || null;
    const tokenSemester = req.user?.semester ?? null;

    const query = {};

    // Use passed branch or token branch (normalize)
    const effectiveBranch = branch || tokenBranch;
    if (effectiveBranch) {
      const normalizedBranch = String(effectiveBranch).trim().toLowerCase();
      query.branch = new RegExp(`^${normalizedBranch}$`, 'i');
    }

    // Use passed semester or token semester  
    const effectiveSemester = semester !== undefined ? semester : tokenSemester;
    if (effectiveSemester !== undefined && effectiveSemester !== null) {
      const semNum = Number(effectiveSemester);
      if (!Number.isNaN(semNum)) {
        query.semester = semNum;
      }
    }

    // Subject filtering
    if (subject) {
      const regex = new RegExp(subject, 'i');
      query.subject = regex;
    }

    console.log('Materials query:', JSON.stringify(query));
    console.log('Token branch:', tokenBranch, 'Token semester:', tokenSemester);
    
    let materials = await StudyMaterial.find(query)
      .sort({ publishedAt: -1 })
      .lean();

    // Fallback: if strict branch+semester yields nothing, relax to branch-only
    if (materials.length === 0 && query.branch && query.semester !== undefined) {
      const relaxedQuery = { branch: query.branch };
      materials = await StudyMaterial.find(relaxedQuery)
        .sort({ publishedAt: -1 })
        .lean();
      console.log('Fallback to branch-only. Found:', materials.length);
    }

    // Ultimate fallback: return all if still empty (helps debug)
    if (materials.length === 0) {
      materials = await StudyMaterial.find({})
        .sort({ publishedAt: -1 })
        .lean();
      console.log('Ultimate fallback to all materials. Found:', materials.length);
    }

    console.log('Materials found:', materials.length, 'Query:', query);
    res.json({ success: true, materials, debug: { query, tokenBranch, tokenSemester } });
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

// Get teacher's own materials
router.get('/my-materials', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const teacherId = req.user.userId || req.user.email;
    const materials = await StudyMaterial.find({ teacherId })
      .sort({ publishedAt: -1 })
      .lean();

    res.json({ success: true, materials });
  } catch (error) {
    console.error('Get teacher materials error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch materials' });
  }
});

// Delete material (only teacher/admin can delete their own)
router.delete('/:id', authenticateToken, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.userId || req.user.email;

    // Find material
    const material = await StudyMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    // Check authorization (only teacher who created it or admin)
    if (material.teacherId !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this material' });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (material.fileUrl && material.fileUrl.includes('cloudinary')) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        // Extract public_id from URL and delete
        const publicId = material.fileUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`study-materials/${publicId}`);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Don't fail the request if Cloudinary delete fails
      }
    }

    // Delete material from database
    await StudyMaterial.findByIdAndDelete(id);

    res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

export default router;