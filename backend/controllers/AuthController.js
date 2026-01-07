import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const jwtKey = process.env.JWT_SECRET;

export const signupRoute = async (req, res) => {
    const { username, usn, email, password, role = 'student', department, semester } = req.body;
  
    // Validate role
    const validRoles = ['student', 'teacher', 'coordinator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be student, teacher, or coordinator.' });
    }

    // Role-specific validation
    if (role === 'student' && !usn) {
      return res.status(400).json({ message: 'USN is required for students.' });
    }

    if (role === 'teacher' && (usn || !email)) {
      return res.status(400).json({ message: 'Teachers must use email, not USN.' });
    }

    // Coordinators can have either USN or email (or both)
    if (role === 'coordinator' && !email && !usn) {
      return res.status(400).json({ message: 'Coordinators must provide either USN or email.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      console.log("Inside Signup Route for role:", role);
      const normalizedEmail = (email || '').trim().toLowerCase();
      const normalizedUsn = (usn || '').trim().toLowerCase() || null;

      // Guard: prevent duplicate users
      if (role === 'student') {
        const existing = await User.findOne({ $or: [ { email: normalizedEmail }, { usn: normalizedUsn } ] });
        if (existing) {
          return res.status(409).json({ message: 'User already exists with same email or usn' });
        }
      } else if (role === 'teacher') {
        // Teacher - only check email
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(409).json({ message: 'User already exists with this email' });
        }
      } else if (role === 'coordinator') {
        // Coordinator - check both USN (if provided) and email (if provided)
        const query = [];
        if (normalizedEmail) query.push({ email: normalizedEmail });
        if (normalizedUsn) query.push({ usn: normalizedUsn });
        
        if (query.length > 0) {
          const existing = await User.findOne({ $or: query });
          if (existing) {
            return res.status(409).json({ message: 'User already exists with this email or USN' });
          }
        }
      }

      const user = new User({
        username: (username || '').trim(),
        usn: role === 'student' || role === 'coordinator' ? normalizedUsn : null,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        department: role === 'student' || role === 'coordinator' ? department : null,
        semester: role === 'student' ? semester : null
      });
      await user.save();
      res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`, role });
    } catch (err) {
      console.error(err);
      if (err && err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({ message: `User already exists with this ${field}` });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  };

export const loginRoute = async (req, res) => {
  console.log("Inside Login Route");
  const { usn, email, password, role } = req.body;

  try {
    // Role-specific login logic
    let user;
    
    if (role === 'student') {
      // Students login with USN
      if (!usn) {
        return res.status(400).json({ message: 'USN is required for student login' });
      }
      user = await User.findOne({ usn, role: 'student' });
      if (!user) {
        return res.status(404).json({ message: 'Student not found' });
      }
    } else if (role === 'teacher') {
      // Teachers login with email only
      if (!email) {
        return res.status(400).json({ message: 'Email is required for teacher login' });
      }
      user = await User.findOne({ email, role: 'teacher' });
      if (!user) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
    } else if (role === 'coordinator') {
      // Coordinators can login with USN or email
      if (!usn && !email) {
        return res.status(400).json({ message: 'USN or Email is required for coordinator login' });
      }
      
      // Try to find by USN first if provided, then email
      const query = [];
      if (usn) query.push({ usn: usn.toLowerCase() });
      if (email) query.push({ email: email.toLowerCase() });
      
      user = await User.findOne({ $or: query, role: 'coordinator' });
      if (!user) {
        return res.status(404).json({ message: 'Coordinator not found' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Build token payload based on role
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      profilePicUrl: user.profilePicUrl,
    };

    // Add role-specific fields
    if (user.role === 'student') {
      tokenPayload.usn = user.usn;
      tokenPayload.department = user.department;
      tokenPayload.semester = user.semester;
    }

    const token = jwt.sign(tokenPayload, jwtKey, { expiresIn: "1d" });

    res.status(200).json({ 
      message: "Login successful", 
      token, 
      role: user.role,
      userId: user._id 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const getUserDetailsRoute = async (req, res) => {
  try {
    // Check if request is for specific user by email (for post author lookup)
    if (req.query.email) {
      const user = await User.findOne({ email: req.query.email }).select('profilePicUrl username email usn admin'); 
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ profilePicUrl: user.profilePicUrl, username: user.username, usn: user.usn, admin: user.admin });
    }

    // Otherwise, get user from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // Decode the token to get user info
    const decoded = jwt.verify(token, jwtKey);
    const user = await User.findOne({ email: decoded.email }).select('profilePicUrl username email usn admin'); 
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ profilePicUrl: user.profilePicUrl, username: user.username, usn: user.usn, admin: user.admin });
  } catch (error) {
    console.error('Error fetching user details:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

  export const getAllUsersRoute = async (req, res) => {
    try {
        const users = await User.find().select('profilePicUrl username email usn');
        
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

