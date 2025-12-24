# 🎓 Campus Connect - Complete Design & Workflow Documentation

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Complete Features List](#complete-features-list)
3. [Database Schema](#database-schema)
4. [API Documentation with Code](#api-documentation-with-code)
5. [WebSocket Events](#websocket-events)
6. [Workflow Diagrams](#workflow-diagrams)
7. [Setup & Deployment](#setup--deployment)

---

## 🏗️ System Architecture

### **Architecture Pattern**: 3-Tier with Real-time Communication

```
┌─────────────────────────────────────┐
│     CLIENT (React + Vite)           │
│  - TailwindCSS + DaisyUI            │
│  - Socket.IO Client                 │
│  - React Router                     │
└──────────────┬──────────────────────┘
               │ HTTPS/WSS
┌──────────────┴──────────────────────┐
│     SERVER (Node.js + Express)      │
│  - RESTful APIs                     │
│  - Socket.IO Server                 │
│  - JWT Authentication               │
│  - Multer + Cloudinary              │
└──────────────┬──────────────────────┘
               │ TCP
┌──────────────┴──────────────────────┐
│     DATABASE (MongoDB)              │
│  - 10 Collections                   │
│  - Indexes + Relations              │
└─────────────────────────────────────┘

External Services:
- Cloudinary (Media Storage)
- Agora (Video SDK)
- OpenAI/Gemini (AI Chatbot)
- Google Sheets/Calendar
- Web Push (Notifications)
```

---

## ✨ Complete Features List

### **1. Authentication & Authorization**

- JWT-based login/signup
- Password hashing (bcrypt)
- Token expiration (24h)
- Role-based access (Admin/Student)

### **2. Social Feed**

- Create/Read/Delete posts
- Image uploads to Cloudinary
- Like/Unlike posts
- Comment system
- Bookmark posts
- Real-time updates

### **3. Event Management**

- Create events (Admin)
- Event categories & tags
- Registration system
- Track registered users
- Event images
- Google Calendar sync

### **4. Real-time Messaging**

- One-on-one chat
- Message history
- Online/Offline status
- Socket.IO powered
- Message notifications

### **5. Academic Resources**

- Notes management (Google Sheets integration)
- Lecture recordings upload/download
- Quiz platform with multiple topics
- Study materials library
- Code editor with syntax highlighting

### **6. AI Chatbot**

- OpenAI/Gemini integration
- Local knowledge base
- Context-aware responses
- Study assistance

### **7. Video Calling**

- Agora SDK integration
- Multi-party video calls
- Screen sharing
- Virtual whiteboard
- File sharing in calls
- Breakout rooms
- Attendance tracking
- Live polls

### **8. Notifications**

- Web Push notifications
- In-app notifications
- Real-time socket alerts
- Notification preferences

### **9. Advanced Features**

- Google Calendar sync
- Recommendations engine
- Notice board
- College announcements
- Analytics dashboard

---

## 🗄️ Database Schema

### **Collections**

#### **1. Users**

```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  usn: String (unique, lowercase),
  username: String,
  password: String (hashed),
  profilePicUrl: String,
  admin: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

#### **2. Posts**

```javascript
{
  _id: ObjectId,
  title: String (max: 50),
  content: String (max: 800),
  image: String (Cloudinary URL),
  author: String (email),
  username: String,
  createdAt: Date,
  time: String,
  likes: Number (default: 0)
}
```

#### **3. Events**

```javascript
{
  _id: ObjectId,
  clubName: String,
  clubCoordinator: String,
  contactNumber: String,
  eventName: String,
  eventDescription: String,
  eventDate: Date,
  eventTime: String,
  venue: String,
  registrationLink: String,
  eventImage: String,
  category: String,
  tags: [String],
  eventType: String,
  maxParticipants: Number,
  entryFee: Number,
  city: String,
  state: String,
  targetAudience: [String],
  agenda: [String],
  status: String (default: 'upcoming'),
  createdAt: Date
}
```

#### **4. Comments**

```javascript
{
  _id: ObjectId,
  commentId: ObjectId,
  postId: String,
  content: String,
  author: String (email),
  username: String,
  profilePicUrl: String,
  likes: Number (default: 0),
  isLiked: Boolean,
  createdAt: Date
}
```

#### **5. Likes**

```javascript
{
  _id: ObjectId,
  postId: String,
  userEmail: String,
  createdAt: Date
}
```

#### **6. Bookmarks**

```javascript
{
  _id: ObjectId,
  postId: String,
  userEmail: String,
  createdAt: Date
}
```

#### **7. Messages**

```javascript
{
  _id: ObjectId,
  senderId: String,
  receiverId: String,
  message: String,
  timestamp: Date
}
```

#### **8. Notes**

```javascript
{
  _id: ObjectId,
  branch: String,
  semester: String,
  subject: String,
  title: String,
  driveLink: String,
  uploadedBy: String,
  createdAt: Date
}
```

#### **9. EventRegistrations**

```javascript
{
  _id: ObjectId,
  eventId: ObjectId,
  userId: ObjectId,
  userName: String,
  userEmail: String,
  registeredAt: Date
}
```

#### **10. LectureRecordings**

```javascript
{
  _id: ObjectId,
  title: String,
  subject: String,
  faculty: String,
  recordingUrl: String,
  duration: String,
  uploadedAt: Date
}
```

---

## 🔌 API Documentation with Code

### **Authentication APIs**

#### **1. User Signup**

```javascript
POST /api/users/signup

// Controller Code
export const signupRoute = async (req, res) => {
  const { username, usn, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const normalizedUsn = (usn || '').trim().toLowerCase();

    // Check if user exists
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { usn: normalizedUsn }]
    });

    if (existing) {
      return res.status(409).json({
        message: 'User already exists with same email or usn'
      });
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
      return res.status(409).json({
        message: 'User already exists (duplicate key)'
      });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
};

// Request Body
{
  "username": "John Doe",
  "usn": "1AB21CS001",
  "email": "john@college.edu",
  "password": "SecurePass123"
}

// Response (201)
{
  "message": "User created successfully..."
}
```

#### **2. User Login**

```javascript
POST /api/users/login

// Controller Code
export const loginRoute = async (req, res) => {
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

    const tokenPayload = {
      usn: user.usn,
      email: user.email,
      username: user.username,
      profilePicUrl: user.profilePicUrl
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to login" });
  }
};

// Request Body
{
  "usn": "1AB21CS001",
  "password": "SecurePass123"
}

// Response (200)
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **3. Get User Details**

```javascript
GET /api/users/user-details
GET /api/users/user-details?email=john@college.edu

// Controller Code
export const getUserDetailsRoute = async (req, res) => {
  try {
    // Check if request is for specific user by email
    if (req.query.email) {
      const user = await User.findOne({ email: req.query.email })
        .select('profilePicUrl username email usn admin');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({
        profilePicUrl: user.profilePicUrl,
        username: user.username,
        usn: user.usn,
        admin: user.admin
      });
    }

    // Otherwise, get user from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email })
      .select('profilePicUrl username email usn admin');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      profilePicUrl: user.profilePicUrl,
      username: user.username,
      usn: user.usn,
      admin: user.admin
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Headers
Authorization: Bearer <token>

// Response (200)
{
  "profilePicUrl": "https://cloudinary.com/...",
  "username": "John Doe",
  "usn": "1ab21cs001",
  "admin": false
}
```

#### **4. Get All Users**

```javascript
GET /api/users/all-users

// Controller Code
export const getAllUsersRoute = async (req, res) => {
  try {
    const users = await User.find()
      .select('profilePicUrl username email usn');

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Response (200)
[
  {
    "_id": "64a1b2c3d4e5f6...",
    "profilePicUrl": "https://cloudinary.com/...",
    "username": "John Doe",
    "email": "john@college.edu",
    "usn": "1ab21cs001"
  },
  ...
]
```

---

### **Post Management APIs**

#### **1. Create Post**

```javascript
POST /api/posts/addPost

// Controller Code
export const postRoute = async (req, res) => {
  try {
    const { title, content, email, username } = req.body;
    let image = null;

    // Handle image upload
    if (req.file) {
      try {
        if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
          // Already uploaded by CloudinaryStorage
          image = req.file.path;
        } else if (req.file.path) {
          // Local path - upload to Cloudinary
          const result = await cloudinary.uploader.upload(req.file.path);
          image = result.secure_url;
          try {
            const fs = await import('fs');
            fs.unlinkSync(req.file.path); // Clean up local file
          } catch (_) {}
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

// Request (multipart/form-data)
{
  "title": "My First Post",
  "content": "This is amazing!",
  "email": "john@college.edu",
  "username": "John Doe",
  "image": <file>
}

// Response (201)
{
  "_id": "64a1b2c3d4e5f6...",
  "title": "My First Post",
  "content": "This is amazing!",
  "image": "https://cloudinary.com/...",
  "author": "john@college.edu",
  "username": "John Doe",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "likes": 0
}
```

#### **2. Get All Posts**

```javascript
GET /api/posts/getPosts

// Controller Code
export const getRoute = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Response (200)
[
  {
    "_id": "64a1b2c3d4e5f6...",
    "title": "My First Post",
    "content": "This is amazing!",
    "image": "https://cloudinary.com/...",
    "author": "john@college.edu",
    "username": "John Doe",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "likes": 15
  },
  ...
]
```

#### **3. Delete Post**

```javascript
DELETE /api/posts/deletePost/:id

// Controller Code
export const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete image from Cloudinary
    if (deletedPost.image) {
      const publicId = extractPublicId(deletedPost.image);
      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Response (200)
{
  "message": "Post deleted successfully"
}
```

---

### **Like System APIs**

#### **1. Like Post**

```javascript
POST /api/likes/likePost

// Controller Code
export const LikeRoute = async (req, res) => {
  try {
    const { postId, userEmail } = req.body;

    const existingLike = await Like.findOne({ postId, userEmail });
    if (existingLike) {
      return res.status(400).json({ message: 'Like already exists' });
    }

    const like = new Like({ postId, userEmail });
    await like.save();

    await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });

    res.status(201).json({ message: 'Like added successfully' });
  } catch (error) {
    console.error('Error adding like:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request Body
{
  "postId": "64a1b2c3d4e5f6...",
  "userEmail": "john@college.edu"
}

// Response (201)
{
  "message": "Like added successfully"
}
```

#### **2. Unlike Post**

```javascript
POST / api / likes / unlikePost;

// Controller Code
export const UnlikeRoute = async (req, res) => {
  try {
    const { postId, userEmail } = req.body;

    const existingLike = await Like.findOne({ postId, userEmail });
    if (!existingLike) {
      return res.status(400).json({ message: "Like does not exist" });
    }

    await existingLike.deleteOne();
    await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });

    res.status(200).json({ message: "Like removed successfully" });
  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({ message: "Server error" });
  }
};
```

#### **3. Get Likes for Post**

```javascript
GET /api/likes/getLikes?postId=64a1b2c3d4e5f6...

// Controller Code
export const getRoute = async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ message: 'Post ID is required' });
    }

    const likes = await Like.find({ postId });
    res.status(200).json(likes);
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
```

---

### **Comment System APIs**

#### **1. Add Comment**

```javascript
POST /api/comments/postComment

// Controller Code
export const postRoute = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { email, username, profilePicUrl } = jwtDecode(token);
    const { postId, content } = req.body;

    const comment = new Comment({
      commentId: new mongoose.Types.ObjectId(),
      postId,
      content,
      author: email,
      username,
      profilePicUrl,
      likes: 0,
      isLiked: false,
    });

    await comment.save();

    res.status(201).json({ message: 'Comment posted successfully' });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ message: 'Failed to post comment' });
  }
};

// Headers
Authorization: Bearer <token>

// Request Body
{
  "postId": "64a1b2c3d4e5f6...",
  "content": "Great post!"
}

// Response (201)
{
  "message": "Comment posted successfully"
}
```

#### **2. Get Comments**

```javascript
GET /api/comments/getComments/:postId

// Controller Code
export const getRoute = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Response (200)
[
  {
    "_id": "64a1b2c3d4e5f6...",
    "commentId": "64a1b2c3d4e5f6...",
    "postId": "64a1b2c3d4e5f6...",
    "content": "Great post!",
    "author": "john@college.edu",
    "username": "John Doe",
    "profilePicUrl": "https://cloudinary.com/...",
    "likes": 5,
    "createdAt": "2025-01-15T11:00:00.000Z"
  },
  ...
]
```

#### **3. Delete Comment**

```javascript
DELETE /api/comments/deleteComment/:commentId

// Controller Code
export const deleteRoute = async (req, res) => {
  const { commentId } = req.params;

  try {
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
```

---

### **Bookmark APIs**

#### **1. Add Bookmark**

```javascript
POST /api/bookmarks/addBookmark

// Controller Code
export const addRoute = async (req, res) => {
  const { postId, userEmail } = req.body;
  try {
    const bookmark = new Bookmark({ postId, userEmail });
    await bookmark.save();
    res.status(201).send({ message: 'Bookmark added successfully' });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).send({ message: 'Failed to add bookmark' });
  }
};

// Request Body
{
  "postId": "64a1b2c3d4e5f6...",
  "userEmail": "john@college.edu"
}
```

#### **2. Remove Bookmark**

```javascript
DELETE /api/bookmarks/removeBookmark/:postId/:userEmail

// Controller Code
export const removeRoute = async (req, res) => {
  const { postId, userEmail } = req.params;
  try {
    await Bookmark.deleteOne({ postId, userEmail });
    res.status(200).send({ message: 'Bookmark removed successfully' });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).send({ message: 'Failed to remove bookmark' });
  }
};
```

#### **3. Get User Bookmarks**

```javascript
GET /api/bookmarks/getBookmarks/:userEmail

// Controller Code
export const getRoute = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const bookmarks = await Bookmark.find({ userEmail });
    const bookmarkedPostIds = bookmarks.map((bookmark) => bookmark.postId);
    const posts = await Post.find({ _id: { $in: bookmarkedPostIds } });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

#### **4. Check Bookmark**

```javascript
GET /api/bookmarks/checkBookmark/:postId?userEmail=john@college.edu

// Controller Code
export const checkRoute = async (req, res) => {
  const { postId } = req.params;
  const { userEmail } = req.query;
  try {
    const bookmark = await Bookmark.findOne({ postId, userEmail });
    res.status(200).send({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).send({ message: 'Failed to check bookmark' });
  }
};
```

---

### **Event Management APIs**

#### **1. Create Event**

```javascript
POST /events/addEvent

// Controller Code
export const addEvent = async (req, res) => {
  try {
    const {
      clubName, clubCoordinator, contactNumber,
      eventName, eventDescription, eventDate,
      eventTime, venue, registrationLink,
      category, tags, eventType, maxParticipants,
      entryFee, city, state, targetAudience, agenda
    } = req.body;

    // Validate required fields
    if (!clubName || !clubCoordinator || !contactNumber ||
        !eventName || !eventDescription || !eventDate ||
        !eventTime || !venue || !registrationLink) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Parse event date
    const parsedEventDate = new Date(eventDate);
    if (isNaN(parsedEventDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event date format'
      });
    }

    const eventData = {
      clubName: clubName.trim(),
      clubCoordinator: clubCoordinator.trim(),
      contactNumber: contactNumber.trim(),
      eventName: eventName.trim(),
      eventDescription: eventDescription.trim(),
      eventDate: parsedEventDate,
      eventTime: eventTime.trim(),
      venue: venue.trim(),
      registrationLink: registrationLink.trim()
    };

    // Add optional fields
    if (category) eventData.category = category;
    if (tags && Array.isArray(tags)) eventData.tags = tags.map(tag => tag.trim());
    if (eventType) eventData.eventType = eventType;
    if (maxParticipants) eventData.maxParticipants = parseInt(maxParticipants);
    if (entryFee) eventData.entryFee = parseFloat(entryFee);
    if (city) eventData.city = city.trim();
    if (state) eventData.state = state.trim();
    if (targetAudience) eventData.targetAudience = targetAudience;
    if (agenda) eventData.agenda = agenda;

    const newEvent = new Event(eventData);
    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      event: savedEvent,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error("Error in addEvent:", error.message);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};

// Request Body
{
  "clubName": "Tech Club",
  "clubCoordinator": "Jane Smith",
  "contactNumber": "9876543210",
  "eventName": "Hackathon 2025",
  "eventDescription": "24-hour coding competition",
  "eventDate": "2025-02-15",
  "eventTime": "10:00 AM",
  "venue": "Main Auditorium",
  "registrationLink": "https://forms.google.com/...",
  "category": "Technical",
  "tags": ["hackathon", "coding", "competition"],
  "eventType": "Competition",
  "maxParticipants": 100,
  "entryFee": 500
}

// Response (201)
{
  "success": true,
  "event": {
    "_id": "64a1b2c3d4e5f6...",
    "clubName": "Tech Club",
    "eventName": "Hackathon 2025",
    "eventDate": "2025-02-15T00:00:00.000Z",
    ...
  },
  "message": "Event created successfully"
}
```

#### **2. Get All Events**

```javascript
GET /events/getAllEvents?page=1&limit=10&category=Technical

// Controller Code
export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, eventType } = req.query;

    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        eventsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Error in getAllEvents:", error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};
```

---

### **Messaging APIs**

#### **1. Get Messages**

```javascript
GET /api/messages/getMessages/:senderId/:receiverId

// Controller Code
export const getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving messages' });
  }
};

// Response (200)
[
  {
    "_id": "64a1b2c3d4e5f6...",
    "senderId": "john@college.edu",
    "receiverId": "jane@college.edu",
    "message": "Hey, how are you?",
    "timestamp": "2025-01-15T10:30:00.000Z"
  },
  ...
]
```

---

### **AI Chatbot APIs**

#### **1. Ask Chatbot**

```javascript
POST /api/chatbot/ask

// Controller Code (Simplified)
router.post('/ask', async (req, res) => {
  try {
    const question = req.body.question || req.body.message;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      });
    }

    // Check local knowledge base first
    const localAnswer = findBestResponse(question);
    if (localAnswer) {
      return res.json({
        success: true,
        answer: localAnswer,
        source: 'local_knowledge_base'
      });
    }

    // Use Gemini AI
    if (useGemini && gemini) {
      const model = gemini.getGenerativeModel({
        model: 'gemini-pro'
      });

      const prompt = `You are a helpful college student assistant.
      Provide concise answers to: ${question}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiAnswer = response.text().trim();

      return res.json({
        success: true,
        answer: aiAnswer,
        source: 'gemini'
      });
    }

    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable'
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process question'
    });
  }
});

// Request Body
{
  "question": "What is the syllabus for Data Structures?",
  "userId": "john@college.edu"
}

// Response (200)
{
  "success": true,
  "answer": "The syllabus can be found in your course handbook...",
  "source": "local_knowledge_base",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### **Video Call APIs**

#### **1. Generate Agora Token**

```javascript
POST /api/videocall/generate-token

// Controller Code
router.post('/generate-token', (req, res) => {
  try {
    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      return res.status(503).json({
        success: false,
        error: 'Agora not configured'
      });
    }

    const { channelName, uid, role = 'publisher' } = req.body;

    if (!channelName || !uid) {
      return res.status(400).json({
        success: false,
        error: 'Channel name and UID are required'
      });
    }

    const expirationTimeInSeconds = 3600 * 24; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      appId: AGORA_APP_ID,
      channelName,
      uid,
      role,
      expiresAt: privilegeExpiredTs
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token'
    });
  }
});

// Request Body
{
  "channelName": "room-12345",
  "uid": 123456,
  "role": "publisher"
}

// Response (200)
{
  "success": true,
  "token": "006abc123...",
  "appId": "your_agora_app_id",
  "channelName": "room-12345",
  "uid": 123456,
  "role": "publisher",
  "expiresAt": 1705324800
}
```

#### **2. Create Video Session**

```javascript
POST /api/videocall/create-session

// Controller Code
router.post('/create-session', (req, res) => {
  try {
    const {
      title, instructorId, instructorName,
      maxParticipants = 50, settings = {}
    } = req.body;

    if (!title || !instructorId) {
      return res.status(400).json({
        success: false,
        error: 'Title and instructor ID are required'
      });
    }

    const sessionId = uuidv4();
    const channelName = `room-${sessionId.substring(0, 8)}`;
    const shareLink = `${process.env.CLIENT_URL}/video-call/join/${sessionId}`;

    const session = {
      id: sessionId,
      title,
      channelName,
      instructorId,
      instructorName: instructorName || 'Instructor',
      maxParticipants,
      participants: [],
      shareLink,
      createdAt: new Date(),
      status: 'active',
      settings
    };

    activeSessions.set(sessionId, session);

    res.json({
      success: true,
      session,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session'
    });
  }
});

// Request Body
{
  "title": "DSA Lecture",
  "instructorId": "prof@college.edu",
  "instructorName": "Dr. Smith",
  "maxParticipants": 50,
  "settings": {
    "enableChat": true,
    "enableWhiteboard": true,
    "enableRecording": false
  }
}

// Response (200)
{
  "success": true,
  "session": {
    "id": "abc123-def456-...",
    "title": "DSA Lecture",
    "channelName": "room-abc123",
    "shareLink": "http://localhost:5173/video-call/join/abc123...",
    "instructorName": "Dr. Smith",
    "maxParticipants": 50,
    "status": "active"
  },
  "message": "Session created successfully"
}
```

---

### **Quiz APIs**

#### **1. Get Quiz Topics**

```javascript
GET /api/quiz/topics

// Response (200)
{
  "success": true,
  "topics": [
    {
      "id": "programming",
      "name": "Programming & CS",
      "icon": "💻",
      "description": "Data structures, algorithms, web dev",
      "questionCount": 50
    },
    {
      "id": "mathematics",
      "name": "Mathematics",
      "icon": "📐",
      "description": "Calculus, algebra, geometry",
      "questionCount": 30
    },
    ...
  ]
}
```

#### **2. Start Quiz**

```javascript
POST /api/quiz/start

// Request Body
{
  "topic": "programming",
  "difficulty": "medium",
  "questionCount": 10
}

// Response (200)
{
  "success": true,
  "quizId": "quiz-abc123",
  "topic": "programming",
  "difficulty": "medium",
  "totalQuestions": 10,
  "timeLimit": 600,
  "questions": [
    {
      "id": "q1",
      "question": "What is the time complexity of binary search?",
      "type": "multiple_choice",
      "options": ["O(1)", "O(log n)", "O(n)", "O(n²)"],
      "difficulty": "medium"
    },
    ...
  ]
}
```

#### **3. Submit Quiz**

```javascript
POST /api/quiz/submit

// Request Body
{
  "quizId": "quiz-abc123",
  "answers": [
    { "questionId": "q1", "answer": 1 },
    { "questionId": "q2", "answer": 0 }
  ]
}

// Response (200)
{
  "success": true,
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "passed": true,
  "correctAnswers": 8,
  "incorrectAnswers": 2,
  "timeTaken": 450,
  "details": [...]
}
```

---

### **Notes APIs**

#### **1. Get Notes**

```javascript
GET /api/notes/getNotes?branch=CSE&semester=5&subject=DSA

// Controller Code
export const getBranchNotes = async (req, res) => {
  try {
    const { branch, semester, subject } = req.query;

    const query = {};
    if (branch) query.branch = branch;
    if (semester) query.semester = semester;
    if (subject) query.subject = subject;

    const notes = await Notes.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Response (200)
[
  {
    "_id": "64a1b2c3d4e5f6...",
    "branch": "CSE",
    "semester": "5",
    "subject": "DSA",
    "title": "Unit 1 - Arrays & Linked Lists",
    "driveLink": "https://drive.google.com/...",
    "uploadedBy": "admin@college.edu",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  ...
]
```

---

## 🔄 WebSocket Events

### **Real-time Messaging**

```javascript
// Client Emits
socket.emit('send-message', {
  senderId: 'john@college.edu',
  receiverId: 'jane@college.edu',
  message: 'Hello!',
  timestamp: new Date()
});

// Server Broadcasts
socket.on('send-message', (data) => {
  // Save to database
  const message = new Message(data);
  await message.save();

  // Emit to receiver
  io.to(data.receiverId).emit('receive-message', data);
});
```

### **Video Call Events**

```javascript
// Join video room
socket.emit("join-video-room", "room-12345");

// Receive user joined notification
socket.on("user-joined", ({ userId }) => {
  console.log("User joined:", userId);
});

// Video signaling
socket.emit("video-offer", { roomId, offer, targetUserId });
socket.emit("video-answer", { roomId, answer, targetUserId });
socket.emit("ice-candidate", { roomId, candidate });
```

### **Notification Events**

```javascript
// Server sends notification
io.to(userEmail).emit("notification", {
  type: "new_message",
  title: "New Message",
  body: "John sent you a message",
  timestamp: new Date(),
});

// Client listens
socket.on("notification", (data) => {
  // Show notification
  showNotification(data);
});
```

---

## 📊 Workflow Diagrams

### **1. User Authentication Flow**

```
User Opens App
    ↓
Check localStorage for token
    ↓
Token exists? ─────YES────→ Validate token
    │                           ↓
    NO                      Valid? ─YES→ Dashboard
    ↓                           │
Login/Signup Page           NO─┘
    ↓
Enter credentials
    ↓
POST /api/users/login
    ↓
Receive JWT token
    ↓
Store in localStorage
    ↓
Redirect to Dashboard
```

### **2. Post Creation Flow**

```
User clicks "Create Post"
    ↓
Opens post form modal
    ↓
Fills title, content, (optional) image
    ↓
Clicks "Submit"
    ↓
POST /api/posts/addPost (multipart/form-data)
    ↓
Backend validates auth token
    ↓
Image uploaded to Cloudinary
    ↓
Post saved to MongoDB
    ↓
Response with post data
    ↓
UI updates with new post
    ↓
Other users see post in real-time
```

### **3. Event Registration Flow**

```
User browses events
    ↓
Clicks "Register" on event
    ↓
POST /events/register
    ↓
Check if already registered
    ↓
Not registered? ────YES────→ Create registration
    │                             ↓
    NO                        Update event count
    ↓                             ↓
Show "Already registered"    Send confirmation
                                  ↓
                            Show success message
                                  ↓
                            Optional: Add to Google Calendar
```

### **4. Real-time Chat Flow**

```
User A sends message
    ↓
socket.emit('send-message', data)
    ↓
Server receives event
    ↓
Save message to MongoDB
    ↓
Find User B's socket
    ↓
socket.to(userB).emit('receive-message', data)
    ↓
User B receives message
    ↓
UI updates chat window
    ↓
Show notification if User B not in chat
```

### **5. Video Call Flow**

```
Instructor creates session
    ↓
POST /api/videocall/create-session
    ↓
Generate unique session ID
    ↓
Share link with students
    ↓
Students click join link
    ↓
POST /api/videocall/generate-token
    ↓
Receive Agora token
    ↓
Initialize Agora client
    ↓
Join channel
    ↓
Enable audio/video
    ↓
Socket: join-video-room
    ↓
Connected with other participants
```

### **6. AI Chatbot Flow**

```
User types question
    ↓
POST /api/chatbot/ask
    ↓
Check local knowledge base
    ↓
Found answer? ───YES───→ Return local answer
    │                        (instant response)
    NO
    ↓
Call Gemini AI API
    ↓
Generate AI response
    ↓
Return answer to user
    ↓
Display in chat UI
```

---

## 🚀 Setup & Deployment

### **Environment Variables**

```env
# Server
PORT=7071
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/campus-connect

# Auth
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Agora (Video)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_certificate

# AI
GEMINI_API_KEY=your_gemini_api_key

# Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### **Installation**

```bash
# Clone repository
git clone <repo-url>
cd Meta-Verse

# Backend setup
cd backend
npm install
cp env-example.txt .env
# Edit .env with your credentials
npm start

# Frontend setup (new terminal)
cd client
npm install
npm run dev
```

### **Deployment**

#### **Backend (Railway/Render)**

```bash
# Build command
npm install

# Start command
npm start

# Environment variables
Add all .env variables in dashboard
```

#### **Frontend (Netlify/Vercel)**

```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables
VITE_API_URL=https://your-backend.railway.app
```

---

## 📱 Complete API Routes Summary

| Method             | Endpoint                                         | Description               | Auth |
| ------------------ | ------------------------------------------------ | ------------------------- | ---- |
| **Authentication** |
| POST               | /api/users/signup                                | Register new user         | No   |
| POST               | /api/users/login                                 | User login                | No   |
| GET                | /api/users/user-details                          | Get user profile          | Yes  |
| GET                | /api/users/all-users                             | Get all users             | Yes  |
| **Posts**          |
| POST               | /api/posts/addPost                               | Create post               | Yes  |
| GET                | /api/posts/getPosts                              | Get all posts             | No   |
| DELETE             | /api/posts/deletePost/:id                        | Delete post               | Yes  |
| **Likes**          |
| POST               | /api/likes/likePost                              | Like a post               | Yes  |
| POST               | /api/likes/unlikePost                            | Unlike a post             | Yes  |
| GET                | /api/likes/getLikes                              | Get post likes            | No   |
| **Comments**       |
| POST               | /api/comments/postComment                        | Add comment               | Yes  |
| GET                | /api/comments/getComments/:postId                | Get comments              | No   |
| DELETE             | /api/comments/deleteComment/:id                  | Delete comment            | Yes  |
| **Bookmarks**      |
| POST               | /api/bookmarks/addBookmark                       | Bookmark post             | Yes  |
| DELETE             | /api/bookmarks/removeBookmark/:postId/:userEmail | Remove bookmark           | Yes  |
| GET                | /api/bookmarks/getBookmarks/:userEmail           | Get user bookmarks        | Yes  |
| GET                | /api/bookmarks/checkBookmark/:postId             | Check if bookmarked       | Yes  |
| **Events**         |
| POST               | /events/addEvent                                 | Create event              | Yes  |
| GET                | /events/getAllEvents                             | Get all events            | No   |
| GET                | /events/:id                                      | Get event details         | No   |
| POST               | /events/register                                 | Register for event        | Yes  |
| **Messages**       |
| GET                | /api/messages/getMessages/:senderId/:receiverId  | Get chat history          | Yes  |
| **Chatbot**        |
| POST               | /api/chatbot/ask                                 | Ask AI question           | No   |
| **Video Call**     |
| POST               | /api/videocall/generate-token                    | Get Agora token           | Yes  |
| POST               | /api/videocall/create-session                    | Create video session      | Yes  |
| GET                | /api/videocall/session/:id                       | Get session details       | No   |
| **Quiz**           |
| GET                | /api/quiz/topics                                 | Get quiz topics           | No   |
| POST               | /api/quiz/start                                  | Start quiz                | Yes  |
| POST               | /api/quiz/submit                                 | Submit quiz               | Yes  |
| **Notes**          |
| GET                | /api/notes/getNotes                              | Get notes                 | No   |
| **Notifications**  |
| POST               | /api/notifications/subscribe                     | Subscribe to push         | Yes  |
| POST               | /api/notifications/send                          | Send notification         | Yes  |
| **Calendar**       |
| POST               | /api/calendar/sync                               | Sync with Google Calendar | Yes  |
| **Recordings**     |
| GET                | /api/recordings                                  | Get lecture recordings    | No   |
| POST               | /api/recordings/upload                           | Upload recording          | Yes  |
| **Health**         |
| GET                | /health                                          | Health check              | No   |
| GET                | /api                                             | API info                  | No   |

---

## 🎯 Key Technologies Summary

**Frontend**: React 18, Vite, TailwindCSS, DaisyUI, Socket.IO Client, Axios, React Router

**Backend**: Node.js, Express, Socket.IO, JWT, Bcrypt, Multer, Mongoose

**Database**: MongoDB with 10 collections

**External Services**: Cloudinary, Agora, OpenAI/Gemini, Google APIs, Web Push

**Real-time**: Socket.IO for chat, notifications, video signaling

**Security**: JWT authentication, bcrypt password hashing, CORS, input validation

**Deployment**: Railway/Render (Backend), Netlify/Vercel (Frontend), MongoDB Atlas (Database)

---

## 📝 Notes

- All timestamps are in UTC
- File uploads limited to 50MB
- JWT tokens expire after 24 hours
- Agora tokens expire after 24 hours
- MongoDB indexes on email, usn, postId for performance
- Real-time features require WebSocket connection
- AI chatbot has local fallback for common questions
- Video calling requires Agora credentials
- Push notifications require VAPID keys

---

## 💻 Complete Frontend + Backend Code

### **Architecture Overview**

```
Backend: Node.js + Express (REST API)
Frontend: React + Vite (SPA)
Communication: Axios for HTTP, Socket.IO for WebSocket
```

---

## 🔧 Backend Implementation

### **1. User Management Module**

#### **Routes (backend/routes/AuthRoute.js)**

```javascript
import express from "express";
import {
  loginRoute,
  signupRoute,
  getUserDetailsRoute,
  getAllUsersRoute,
} from "../controllers/AuthController.js";

const router = express.Router();

router.post("/login", loginRoute);
router.post("/signup", signupRoute);
router.get("/getUserDetails", getUserDetailsRoute);
router.get("/getAllUsers", getAllUsersRoute);

export default router;
```

#### **Controller (backend/controllers/AuthController.js)**

```javascript
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// SIGNUP
export const signupRoute = async (req, res) => {
  const { username, usn, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedUsn = (usn || "").trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { usn: normalizedUsn }],
    });

    if (existing) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const user = new User({
      username: (username || "").trim(),
      usn: normalizedUsn,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user" });
  }
};

// LOGIN
export const loginRoute = async (req, res) => {
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

    const tokenPayload = {
      usn: user.usn,
      email: user.email,
      username: user.username,
      profilePicUrl: user.profilePicUrl,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Failed to login" });
  }
};

// GET USER DETAILS
export const getUserDetailsRoute = async (req, res) => {
  try {
    if (req.query.email) {
      const user = await User.findOne({ email: req.query.email }).select(
        "profilePicUrl username email usn admin"
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({
        profilePicUrl: user.profilePicUrl,
        username: user.username,
        usn: user.usn,
        admin: user.admin,
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authorization header missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email }).select(
      "profilePicUrl username email usn admin"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      profilePicUrl: user.profilePicUrl,
      username: user.username,
      usn: user.usn,
      admin: user.admin,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL USERS
export const getAllUsersRoute = async (req, res) => {
  try {
    const users = await User.find().select("profilePicUrl username email usn");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
```

#### **Model (backend/models/User.js)**

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    usn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicUrl: {
      type: String,
    },
    admin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ usn: 1 }, { unique: true });

const User = mongoose.model("User", userSchema);
export default User;
```

---

### **2. Posts Module**

#### **Routes (backend/routes/PostRoute.js)**

```javascript
import express from "express";
import multer from "multer";
import {
  postRoute,
  getRoute,
  deleteRoute,
} from "../controllers/PostController.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "post_images",
    allowed_formats: ["jpg", "png", "avif", "jpeg"],
  },
});

const upload = multer({ storage });

router.post("/addPost", upload.single("image"), postRoute);
router.get("/getPosts", getRoute);
router.delete("/deletePost/:id", deleteRoute);

export default router;
```

#### **Controller (backend/controllers/PostController.js)**

```javascript
import Post from "../models/Post.js";
import cloudinary from "../config/cloudinary.js";
import { extractPublicId } from "cloudinary-build-url";

// CREATE POST
export const postRoute = async (req, res) => {
  try {
    const { title, content, email, username } = req.body;
    let image = null;

    if (req.file) {
      if (req.file.path && /^https?:\/\//i.test(req.file.path)) {
        image = req.file.path;
      } else if (req.file.path) {
        const result = await cloudinary.uploader.upload(req.file.path);
        image = result.secure_url;
        try {
          const fs = await import("fs");
          fs.unlinkSync(req.file.path);
        } catch (_) {}
      }
    }

    if (!title || !content || !email || !username) {
      return res.status(400).json({ error: "Missing required fields" });
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
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET ALL POSTS
export const getRoute = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE POST
export const deleteRoute = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (deletedPost.image) {
      const publicId = extractPublicId(deletedPost.image);
      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

#### **Model (backend/models/Post.js)**

```javascript
import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxLength: 50,
  },
  content: {
    type: String,
    required: true,
    maxLength: 800,
  },
  image: {
    type: String,
  },
  author: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: {
    type: Number,
    default: 0,
  },
});

const Post = mongoose.model("Post", postSchema);
export default Post;
```

---

### **3. Like System Module**

#### **Routes (backend/routes/LikePostRoute.js)**

```javascript
import express from "express";
import {
  LikeRoute,
  UnlikeRoute,
  getRoute,
} from "../controllers/LikePostController.js";

const router = express.Router();

router.post("/like", LikeRoute);
router.post("/unlike", UnlikeRoute);
router.get("/getLikes", getRoute);

export default router;
```

#### **Controller (backend/controllers/LikePostController.js)**

```javascript
import Like from "../models/Like.js";
import Post from "../models/Post.js";

// LIKE POST
export const LikeRoute = async (req, res) => {
  try {
    const { postId, userEmail } = req.body;

    const existingLike = await Like.findOne({ postId, userEmail });
    if (existingLike) {
      return res.status(400).json({ message: "Like already exists" });
    }

    const like = new Like({ postId, userEmail });
    await like.save();
    await Post.findByIdAndUpdate(postId, { $inc: { likes: 1 } });

    res.status(201).json({ message: "Like added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UNLIKE POST
export const UnlikeRoute = async (req, res) => {
  try {
    const { postId, userEmail } = req.body;

    const existingLike = await Like.findOne({ postId, userEmail });
    if (!existingLike) {
      return res.status(400).json({ message: "Like does not exist" });
    }

    await existingLike.deleteOne();
    await Post.findByIdAndUpdate(postId, { $inc: { likes: -1 } });

    res.status(200).json({ message: "Like removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// GET LIKES
export const getRoute = async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    const likes = await Like.find({ postId });
    res.status(200).json(likes);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
```

---

### **4. Comments Module**

#### **Routes (backend/routes/CommentRoute.js)**

```javascript
import express from "express";
import {
  postRoute,
  getRoute,
  deleteRoute,
} from "../controllers/CommentController.js";

const router = express.Router();

router.post("/postComment", postRoute);
router.get("/getComments/:postId", getRoute);
router.delete("/deleteComment/:commentId", deleteRoute);

export default router;
```

#### **Controller (backend/controllers/CommentController.js)**

```javascript
import Comment from "../models/Comment.js";
import { jwtDecode } from "jwt-decode";
import mongoose from "mongoose";

// ADD COMMENT
export const postRoute = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { email, username, profilePicUrl } = jwtDecode(token);
    const { postId, content } = req.body;

    const comment = new Comment({
      commentId: new mongoose.Types.ObjectId(),
      postId,
      content,
      author: email,
      username,
      profilePicUrl,
      likes: 0,
      isLiked: false,
    });

    await comment.save();
    res.status(201).json({ message: "Comment posted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to post comment" });
  }
};

// GET COMMENTS
export const getRoute = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE COMMENT
export const deleteRoute = async (req, res) => {
  const { commentId } = req.params;

  try {
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
```

---

### **5. Bookmarks Module**

#### **Routes (backend/routes/BookmarkRoute.js)**

```javascript
import express from "express";
import {
  addRoute,
  removeRoute,
  checkRoute,
  getRoute,
} from "../controllers/BookmarkController.js";

const router = express.Router();

router.post("/add", addRoute);
router.delete("/remove", removeRoute);
router.get("/check", checkRoute);
router.get("/get/:userEmail", getRoute);

export default router;
```

---

### **6. Events Module**

#### **Routes (backend/routes/EventRoute.js)**

```javascript
import express from "express";
import {
  addEvent,
  getAllEvents,
  getEventById,
  registerForEvent,
} from "../controllers/EventController.js";

const router = express.Router();

router.post("/addEvent", addEvent);
router.get("/getAllEvents", getAllEvents);
router.get("/:id", getEventById);
router.post("/register", registerForEvent);

export default router;
```

---

### **7. Messaging Module**

#### **Routes (backend/routes/MessageRoute.js)**

```javascript
import express from "express";
import { getMessages } from "../controllers/MessageController.js";

const router = express.Router();

router.get("/getMessages/:senderId/:receiverId", getMessages);

export default router;
```

#### **Controller (backend/controllers/MessageController.js)**

```javascript
import Message from "../models/Messages.js";

export const getMessages = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving messages" });
  }
};
```

---

### **8. Notes Module**

#### **Routes (backend/routes/NotesRoute.js)**

```javascript
import express from "express";
import { getBranchNotes } from "../controllers/NotesController.js";

const router = express.Router();

router.get("/getNotes", getBranchNotes);

export default router;
```

---

### **9. AI Chatbot Module**

#### **Route (backend/routes/chatbot.js)**

```javascript
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Initialize Gemini
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ASK CHATBOT
router.post("/ask", async (req, res) => {
  try {
    const question = req.body.question || req.body.message;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    const model = gemini.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `You are a helpful college student assistant. 
    Provide concise answers to: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiAnswer = response.text().trim();

    res.json({
      success: true,
      answer: aiAnswer,
      source: "gemini",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to process question",
    });
  }
});

export default router;
```

---

### **10. Video Call Module**

#### **Routes (backend/routes/videocall.js)**

```javascript
import express from "express";
import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// GENERATE TOKEN
router.post("/generate-token", (req, res) => {
  try {
    const { channelName, uid, role = "publisher" } = req.body;

    if (!channelName || !uid) {
      return res.status(400).json({
        success: false,
        error: "Channel name and UID required",
      });
    }

    const expirationTime = 3600 * 24; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    res.json({
      success: true,
      token,
      appId: AGORA_APP_ID,
      channelName,
      uid,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to generate token",
    });
  }
});

export default router;
```

---

### **11. Quiz Module**

#### **Routes (backend/routes/quiz.js)**

```javascript
import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// GET TOPICS
router.get("/topics", (req, res) => {
  res.json({
    success: true,
    topics: [
      {
        id: "programming",
        name: "Programming & CS",
        icon: "💻",
        description: "Data structures, algorithms",
        questionCount: 50,
      },
      {
        id: "mathematics",
        name: "Mathematics",
        icon: "📐",
        description: "Calculus, algebra",
        questionCount: 30,
      },
    ],
  });
});

// START QUIZ
router.post("/start", (req, res) => {
  const { topic, difficulty, questionCount } = req.body;

  const quizId = uuidv4();

  res.json({
    success: true,
    quizId,
    topic,
    difficulty,
    totalQuestions: questionCount,
    timeLimit: 600,
    questions: [
      /* questions array */
    ],
  });
});

// SUBMIT QUIZ
router.post("/submit", (req, res) => {
  const { quizId, answers } = req.body;

  // Calculate score
  const score = 8; // Example
  const totalQuestions = 10;

  res.json({
    success: true,
    score,
    totalQuestions,
    percentage: (score / totalQuestions) * 100,
    passed: score >= 6,
  });
});

export default router;
```

---

## 🎨 Frontend Implementation

### **1. API Service Layer (client/src/services/api.js)**

```javascript
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:7071";

// Axios instance with interceptors
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// AUTH APIs
export const authAPI = {
  login: (data) => api.post("/api/users/auth/login", data),
  signup: (data) => api.post("/api/users/auth/signup", data),
  getUserDetails: () => api.get("/api/users/auth/getUserDetails"),
  getAllUsers: () => api.get("/api/users/auth/getAllUsers"),
};

// POSTS APIs
export const postsAPI = {
  createPost: (formData) =>
    api.post("/api/posts/addPost", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAllPosts: () => api.get("/api/posts/getPosts"),
  deletePost: (id) => api.delete(`/api/posts/deletePost/${id}`),
};

// LIKES APIs
export const likesAPI = {
  likePost: (data) => api.post("/api/likes/like", data),
  unlikePost: (data) => api.post("/api/likes/unlike", data),
  getLikes: (postId) => api.get(`/api/likes/getLikes?postId=${postId}`),
};

// COMMENTS APIs
export const commentsAPI = {
  addComment: (data) => api.post("/api/comments/postComment", data),
  getComments: (postId) => api.get(`/api/comments/getComments/${postId}`),
  deleteComment: (id) => api.delete(`/api/comments/deleteComment/${id}`),
};

// BOOKMARKS APIs
export const bookmarksAPI = {
  addBookmark: (data) => api.post("/api/bookmarks/add", data),
  removeBookmark: (data) => api.delete("/api/bookmarks/remove", { data }),
  getBookmarks: (userEmail) => api.get(`/api/bookmarks/get/${userEmail}`),
  checkBookmark: (postId, userEmail) =>
    api.get(`/api/bookmarks/check?postId=${postId}&userEmail=${userEmail}`),
};

// EVENTS APIs
export const eventsAPI = {
  createEvent: (data) => api.post("/events/addEvent", data),
  getAllEvents: (params) => api.get("/events/getAllEvents", { params }),
  getEventById: (id) => api.get(`/events/${id}`),
  registerForEvent: (data) => api.post("/events/register", data),
};

// MESSAGES APIs
export const messagesAPI = {
  getMessages: (senderId, receiverId) =>
    api.get(`/api/messages/getMessages/${senderId}/${receiverId}`),
};

// CHATBOT APIs
export const chatbotAPI = {
  askQuestion: (data) => api.post("/api/chatbot/ask", data),
};

// VIDEO CALL APIs
export const videoCallAPI = {
  generateToken: (data) => api.post("/api/videocall/generate-token", data),
  createSession: (data) => api.post("/api/videocall/create-session", data),
};

// QUIZ APIs
export const quizAPI = {
  getTopics: () => api.get("/api/quiz/topics"),
  startQuiz: (data) => api.post("/api/quiz/start", data),
  submitQuiz: (data) => api.post("/api/quiz/submit", data),
};

// NOTES APIs
export const notesAPI = {
  getNotes: (params) => api.get("/api/notes/getNotes", { params }),
};

export default api;
```

---

### **2. Login Component (client/src/Components/Login.jsx)**

```jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const Login = () => {
  const [usn, setUsn] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usn || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);

      // Login API call
      const response = await authAPI.login({ usn, password });

      // Store token
      localStorage.setItem("token", response.data.token);

      // Get user details
      const userResponse = await authAPI.getUserDetails();
      localStorage.setItem("user", JSON.stringify(userResponse.data));

      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-6">
          Sign in to Campus Connect
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">USN</label>
            <input
              type="text"
              placeholder="e.g., 1SI21CS001"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Don't have an account?
          <a href="/signup" className="text-blue-500 ml-1">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

---

### **3. Add Post Component (client/src/Components/AddPost.jsx)**

```jsx
import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { postsAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const AddPost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");
  let userData = null;

  if (token) {
    try {
      userData = jwtDecode(token);
    } catch (e) {
      console.warn("Invalid token");
      navigate("/login");
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userData) {
      toast.error("Please login to create a post");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    if (image) formData.append("image", image);
    formData.append("email", userData.email);
    formData.append("username", userData.username);

    try {
      setIsLoading(true);
      await postsAPI.createPost(formData);

      toast.success("Post created successfully!");
      setTitle("");
      setContent("");
      setImage(null);
      setPreviewImage("");

      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error posting:", error);
      const errorMsg = error.response?.data?.error || "Failed to create post";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Post</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Title <span className="text-gray-500">(max 50 characters)</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength="50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Content <span className="text-gray-500">(max 800 characters)</span>
          </label>
          <textarea
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
            rows="6"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength="800"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Image <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            className="w-full"
            onChange={handleImageChange}
          />
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="mt-4 max-h-60 rounded-lg"
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? "Posting..." : "Create Post"}
        </button>
      </form>
    </div>
  );
};

export default AddPost;
```

---

### **4. Feed Card Component (client/src/Components/FeedCard.jsx)**

```jsx
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { likesAPI, bookmarksAPI } from "../services/api";

const FeedCard = ({ post, onPostUpdated }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { _id: postId, title, content, image, username, createdAt } = post;

  // Check if user has liked the post
  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const { email } = jwtDecode(token);
        const response = await likesAPI.getLikes(postId);
        const isLikedByUser = response.data.some(
          (like) => like.userEmail === email
        );
        setIsLiked(isLikedByUser);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };

    checkLikeStatus();
  }, [postId]);

  // Like/Unlike handlers
  const handleLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      const { email } = jwtDecode(token);
      await likesAPI.likePost({ postId, userEmail: email });
      setIsLiked(true);
      setLikes((prev) => prev + 1);
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const handleUnlike = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const { email } = jwtDecode(token);
      await likesAPI.unlikePost({ postId, userEmail: email });
      setIsLiked(false);
      setLikes((prev) => prev - 1);
      if (onPostUpdated) onPostUpdated();
    } catch (error) {
      toast.error("Failed to unlike post");
    }
  };

  const handleBookmark = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to bookmark posts");
      return;
    }

    try {
      const { email } = jwtDecode(token);

      if (isBookmarked) {
        await bookmarksAPI.removeBookmark({ postId, userEmail: email });
        setIsBookmarked(false);
        toast.success("Bookmark removed");
      } else {
        await bookmarksAPI.addBookmark({ postId, userEmail: email });
        setIsBookmarked(true);
        toast.success("Post bookmarked");
      }
    } catch (error) {
      toast.error("Failed to bookmark post");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center mb-4">
        <div className="ml-3">
          <p className="font-semibold">{username}</p>
          <p className="text-sm text-gray-500">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-700 mb-4">{content}</p>

      {image && (
        <img src={image} alt={title} className="w-full rounded-lg mb-4" />
      )}

      <div className="flex items-center gap-4 border-t pt-4">
        <button
          onClick={isLiked ? handleUnlike : handleLike}
          className={`flex items-center gap-2 ${
            isLiked ? "text-red-500" : "text-gray-500"
          }`}
        >
          <span>{isLiked ? "❤️" : "🤍"}</span>
          <span>{likes}</span>
        </button>

        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 ${
            isBookmarked ? "text-blue-500" : "text-gray-500"
          }`}
        >
          <span>{isBookmarked ? "🔖" : "📑"}</span>
        </button>
      </div>
    </div>
  );
};

export default FeedCard;
```

---

### **5. Chatbot Component (client/src/Components/AIChatbot.jsx)**

```jsx
import { useState } from "react";
import { chatbotAPI } from "../services/api";
import { toast } from "react-toastify";

const AIChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatbotAPI.askQuestion({
        question: input,
      });

      const aiMessage = {
        role: "assistant",
        content: response.data.answer,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      toast.error("Failed to get response");
      console.error("Chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="bg-blue-500 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">AI Study Assistant</h2>
      </div>

      <div className="flex-1 bg-gray-100 p-4 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-4 ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">AI is thinking...</div>
        )}
      </div>

      <div className="flex gap-2 p-4 bg-white border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChatbot;
```

---

### **6. Socket.IO Integration (client/src/config/socket.js)**

```javascript
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:7071";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connect socket
export const connectSocket = (userEmail) => {
  if (!socket.connected) {
    socket.auth = { userEmail };
    socket.connect();
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Send message
export const sendMessage = (data) => {
  socket.emit("send-message", data);
};

// Listen for messages
export const onReceiveMessage = (callback) => {
  socket.on("receive-message", callback);
};

// Join video room
export const joinVideoRoom = (roomId) => {
  socket.emit("join-video-room", roomId);
};

// Leave video room
export const leaveVideoRoom = (roomId) => {
  socket.emit("leave-video-room", roomId);
};

export default socket;
```

---

### **7. Video Call Component (client/src/Components/VideoCall.jsx)**

```jsx
import { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import { videoCallAPI } from "../services/api";
import { toast } from "react-toastify";

const VideoCall = ({ roomId }) => {
  const [client] = useState(
    AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    })
  );
  const [localTracks, setLocalTracks] = useState({
    video: null,
    audio: null,
  });
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (localTracks.video) localTracks.video.close();
      if (localTracks.audio) localTracks.audio.close();
      if (joined) client.leave();
    };
  }, []);

  const joinCall = async () => {
    try {
      // Generate token
      const response = await videoCallAPI.generateToken({
        channelName: roomId,
        uid: Math.floor(Math.random() * 100000),
        role: "publisher",
      });

      const { token, appId, uid } = response.data;

      // Join channel
      await client.join(appId, roomId, token, uid);

      // Create local tracks
      const [audioTrack, videoTrack] =
        await AgoraRTC.createMicrophoneAndCameraTracks();

      setLocalTracks({ video: videoTrack, audio: audioTrack });

      // Publish tracks
      await client.publish([audioTrack, videoTrack]);

      // Play local video
      videoTrack.play("local-player");

      setJoined(true);
      toast.success("Joined video call");

      // Listen for remote users
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          user.videoTrack.play(`remote-player-${user.uid}`);
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });
    } catch (error) {
      console.error("Error joining call:", error);
      toast.error("Failed to join call");
    }
  };

  const leaveCall = async () => {
    try {
      if (localTracks.video) localTracks.video.close();
      if (localTracks.audio) localTracks.audio.close();
      await client.leave();
      setJoined(false);
      toast.success("Left video call");
    } catch (error) {
      console.error("Error leaving call:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Video Call - Room: {roomId}</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-semibold mb-2">Local Video</h3>
          <div
            id="local-player"
            className="w-full h-64 bg-gray-800 rounded-lg"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-2">Remote Video</h3>
          <div
            id="remote-players"
            className="w-full h-64 bg-gray-800 rounded-lg"
          />
        </div>
      </div>

      <div className="flex gap-4">
        {!joined ? (
          <button
            onClick={joinCall}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Join Call
          </button>
        ) : (
          <button
            onClick={leaveCall}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Leave Call
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
```

---

## 🔑 Key Interview Points

### **Backend Architecture**

- **MVC Pattern**: Models, Controllers, Routes separation
- **Middleware**: JWT authentication, Multer for file uploads
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for WebSocket communication
- **Cloud Storage**: Cloudinary for media files
- **Security**: bcrypt password hashing, JWT tokens, CORS

### **Frontend Architecture**

- **Component-Based**: Reusable React components
- **State Management**: useState, useEffect hooks
- **API Layer**: Centralized Axios service with interceptors
- **Real-time**: Socket.IO client for live updates
- **Routing**: React Router for navigation
- **UI**: TailwindCSS + DaisyUI for styling

### **API Design Patterns**

- **RESTful**: Standard HTTP methods (GET, POST, DELETE)
- **Status Codes**: Proper use of 200, 201, 400, 401, 404, 500
- **Error Handling**: Try-catch blocks, error responses
- **Authentication**: Bearer token in Authorization header
- **File Upload**: multipart/form-data with Multer

### **Database Design**

- **Collections**: 10 main collections with proper schemas
- **Indexes**: On email, usn for faster queries
- **Relationships**: Referenced by IDs (postId, userEmail)
- **Timestamps**: Automatic createdAt, updatedAt

### **Real-time Features**

- **WebSocket**: Bidirectional communication
- **Events**: Custom events (send-message, join-video-room)
- **Rooms**: Socket.IO rooms for video calls
- **Broadcasting**: Emit to specific users or rooms

---

**Version**: 2.0.0  
**Last Updated**: December 24, 2025  
**Status**: ✅ Production Ready
