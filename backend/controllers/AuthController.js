import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const jwtKey = process.env.JWT_SECRET;

export const signupRoute = async (req, res) => {
    const { username, usn, email, password } = req.body;
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      console.log("Inside Signup Route");
      const normalizedEmail = (email || '').trim().toLowerCase();
      const normalizedUsn = (usn || '').trim().toLowerCase();

      // Guard: prevent duplicate users
      const existing = await User.findOne({ $or: [ { email: normalizedEmail }, { usn: normalizedUsn } ] });
      if (existing) {
        return res.status(409).json({ message: 'User already exists with same email or usn' });
      }

      const user = new User({
        username: (username || '').trim(),
        usn: normalizedUsn,
        email: normalizedEmail,
        password: hashedPassword, 
      });
      await user.save();
      res.status(201).json({ message: "User created successfully..." });
    } catch (err) {
      console.error(err);
      if (err && err.code === 11000) {
        return res.status(409).json({ message: 'User already exists (duplicate key)' });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  };

export const loginRoute = async (req, res) => {
  console.log("Inside Login Route")
  const { usn, password } = req.body;

  try {
    const user = await User.findOne({ usn });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const tokenPayload = { usn: user.usn, email: user.email, username: user.username, profilePicUrl: user.profilePicUrl };

    const token = jwt.sign(tokenPayload, jwtKey, { expiresIn: "1d" });

    res.status(200).json({ message: "Login successful", token });
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

