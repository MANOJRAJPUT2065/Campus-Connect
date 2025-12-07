# 🚀 Campus Connect Platform

**Campus Connect** is a comprehensive student-oriented platform that provides a centralized hub for students to access notes, event details, social feed, and real-time communication features.

## ✨ Features

### Core Features

- **📝 Notes Management**: Access and manage curated notes from the best available resources
- **🎉 Events**: Find details about upcoming events in college and clubs with registration
- **📱 Social Feed**: Engage with other students through posts, comments, likes, and bookmarks
- **💬 Real-time Messaging**: Private chat with other students using Socket.IO
- **👤 User Profiles**: Complete user profile management with authentication

### Advanced Features

- **🤖 AI Chatbot**: Intelligent study assistant powered by OpenAI/Gemini
- **📹 Video Calls**: Integrated video calling with Agora
- **📊 Quiz Platform**: Interactive quiz system with multiple topics
- **💻 Code Editor**: Built-in code editor with syntax highlighting
- **📅 Google Calendar Sync**: Sync events with Google Calendar
- **📹 Lecture Recordings**: Access and manage lecture recordings
- **🔔 Push Notifications**: Real-time browser notifications
- **📋 Notices**: College notices and announcements

## 🛠️ Tech Stack

### Frontend

- **React 18** with Vite
- **TailwindCSS** + **DaisyUI** for styling
- **Socket.IO Client** for real-time features
- **React Router** for navigation
- **Axios** for API calls

### Backend

- **Node.js** with **Express**
- **MongoDB** with **Mongoose**
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Cloudinary** for image uploads
- **Multer** for file handling

## 📦 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Meta-Verse
```

### Step 2: Backend Setup

1. Navigate to backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file in `backend` directory:

```env
# Server Configuration
PORT=7071
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/meta-verse

# JWT Secret (generate a strong random string)
JWT_SECRET=your_jwt_secret_here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Agora (for video calls - optional)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Web Push Notifications (VAPID - optional)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# AI Chatbot (OpenAI or Gemini)
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=openai
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

4. Start the backend server:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:7071`

### Step 3: Frontend Setup

1. Navigate to client directory:

```bash
cd ../client
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file in `client` directory:

```env
# API Base URL
VITE_API_URL=http://localhost:7071
```

4. Start the development server:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🚀 Deployment

### Production Build

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd client
npm run build
```

The build output will be in `client/dist/`

### Deployment Options

#### Option 1: Deploy Backend + Frontend Together

The backend is configured to serve the React app in production mode. Just build the frontend and start the backend:

```bash
# Build frontend
cd client
npm run build

# Start backend (will serve frontend)
cd ../backend
NODE_ENV=production npm start
```

#### Option 2: Deploy Separately

- **Backend**: Deploy to platforms like Heroku, Railway, Render, etc.
- **Frontend**: Deploy to Vercel, Netlify, or any static hosting

**Important**: Update `VITE_API_URL` in frontend `.env` to point to your deployed backend URL.

### Environment Variables for Production

**Backend (.env)**:

```env
NODE_ENV=production
PORT=7071
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=your_mongodb_connection_string
# ... other variables
```

**Frontend (.env)**:

```env
VITE_API_URL=https://your-backend-domain.com
```

## 📡 API Endpoints

### Authentication

- `POST /api/users/auth/signup` - User registration
- `POST /api/users/auth/login` - User login
- `GET /api/users/auth/getUserDetails` - Get user details
- `GET /api/users/auth/getAllUsers` - Get all users

### Posts

- `GET /api/posts/getposts` - Get all posts
- `POST /api/posts` - Create new post
- `DELETE /api/posts/deletepost/:id` - Delete post

### Events

- `GET /events/getEvents` - Get all events
- `POST /events/addEvent` - Create event
- `PUT /events/updateEvent` - Update event
- `DELETE /events/deleteEvent` - Delete event

### Other Features

- `GET /api/likes` - Like/unlike posts
- `GET /api/bookmarks` - Bookmark posts
- `POST /api/comments` - Add comments
- `GET /api/messages` - Get messages
- `POST /api/chatbot/ask` - AI chatbot
- `GET /api/videocall/generate-token` - Video call token

For complete API documentation, visit `http://localhost:7071/api` when server is running.

## 🧪 Testing

### Health Check

```bash
curl http://localhost:7071/health
```

### API Documentation

Visit `http://localhost:7071/api` for interactive API documentation.

## 📁 Project Structure

```
Meta-Verse/
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middlewares/     # Custom middlewares
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── uploads/         # Uploaded files
│   ├── index.js         # Main server file
│   └── package.json
├── client/
│   ├── src/
│   │   ├── Components/  # React components
│   │   ├── Pages/       # Page components
│   │   ├── config/      # Configuration
│   │   └── main.jsx     # Entry point
│   ├── public/          # Static files
│   └── package.json
└── README.md
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env` file

2. **CORS Errors**

   - Update `CLIENT_URL` in backend `.env`
   - Ensure frontend URL matches

3. **Port Already in Use**

   - Change `PORT` in backend `.env`
   - Update `VITE_API_URL` in frontend `.env`

4. **Build Errors**
   - Delete `node_modules` and reinstall
   - Clear build cache: `npm run build -- --force`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React Team
- Express.js Community
- MongoDB
- All open-source contributors

---

**Made with ❤️ for students**
