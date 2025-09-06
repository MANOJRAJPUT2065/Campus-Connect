import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import { extractPublicId } from 'cloudinary-build-url';

export const postRoute = async (req, res) => {
  console.log("Adding post re...");
  try {
    const { title, content, email, username } = req.body;
    let image = null;
    
    // If using CloudinaryStorage in multer, the file is already uploaded
    // and req.file.path contains the Cloudinary URL. Support both cases
    // (direct CloudinaryStorage URL and local path uploads).
    if (req.file) {
      try {
        if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
          // Already uploaded by CloudinaryStorage
          image = req.file.path;
        } else if (req.file.path) {
          // Local path provided (fallback) → upload then best-effort cleanup
          const result = await cloudinary.uploader.upload(req.file.path);
          image = result.secure_url;
          try {
            const fs = await import('fs');
            fs.unlinkSync(req.file.path);
          } catch (_) {
            // ignore cleanup errors
          }
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload image' });
      }
    }

    if (!title || !content || !email || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPost = new Post({
      title,
      content,
      image,
      author: email,
      username,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getRoute = async (req, res) => {
  console.log("Inside get post route...");

  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (deletedPost.image) {
      const publicId = extractPublicId(deletedPost.image);

      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
