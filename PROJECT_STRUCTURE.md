# 📁 Meta-Verse Project Structure

## 🗂️ Directory Structure

```
Meta-Verse/
├── backend/                    # Backend Server (Node.js/Express)
│   ├── config/                 # Configuration files
│   │   ├── cloudinary.js       # Cloudinary setup
│   │   └── Socket.js           # Socket.IO configuration
│   ├── controllers/            # Route controllers
│   │   ├── AuthController.js   # Authentication logic
│   │   ├── PostController.js   # Post management
│   │   ├── EventController.js # Event management
│   │   ├── UserProfileController.js
│   │   └── ...                 # Other controllers
│   ├── middlewares/            # Custom middlewares
│   │   ├── auth.js             # JWT authentication
│   │   └── multer.js           # File upload handling
│   ├── models/                 # MongoDB models
│   │   ├── User.js             # User schema
│   │   ├── Post.js             # Post schema
│   │   ├── Event.js            # Event schema
│   │   └── ...                 # Other models
│   ├── routes/                 # API routes
│   │   ├── AuthRoute.js        # Auth endpoints
│   │   ├── PostRoute.js        # Post endpoints
│   │   ├── EventRoute.js       # Event endpoints
│   │   └── ...                 # Other routes
│   ├── utils/                  # Utility functions
│   ├── uploads/                # Uploaded files (local)
│   ├── index.js                # Main server file
│   ├── package.json            # Backend dependencies
│   └── .env                    # Environment variables (not in git)
│
├── client/                     # Frontend (React/Vite)
│   ├── public/                 # Static files
│   │   └── sw.js               # Service worker
│   ├── src/
│   │   ├── Components/         # React components
│   │   │   ├── AddPost.jsx
│   │   │   ├── AIChatbot.jsx
│   │   │   ├── VideoCall.jsx
│   │   │   ├── QuizPlatform.jsx
│   │   │   └── ...             # Other components
│   │   ├── Pages/              # Page components
│   │   │   ├── Feed.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Account.jsx
│   │   │   └── ...             # Other pages
│   │   ├── config/             # Configuration
│   │   │   └── api.js          # API configuration
│   │   ├── assets/             # Images, icons
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS config
│   └── .env                    # Frontend env vars (not in git)
│
├── .gitignore                  # Git ignore rules
├── README.md                   # Main documentation
├── DEPLOYMENT.md               # Deployment guide
├── DEPLOYMENT_SETUP.md         # Railway/Netlify setup
├── FIXES_SUMMARY.md            # All fixes applied
├── railway.json                # Railway configuration
├── railway.toml                # Railway alternative config
├── netlify.toml                # Netlify configuration
├── Procfile                   # Heroku/Railway process file
└── .env.example               # Environment variables template
```

## 🔑 Key Files

### Backend
- `backend/index.js` - Main server entry point
- `backend/package.json` - Dependencies and scripts
- `backend/.env` - Environment variables (create from env-example.txt)

### Frontend
- `client/src/App.jsx` - Main React app with routes
- `client/src/config/api.js` - API configuration
- `client/package.json` - Dependencies and scripts
- `client/.env` - Frontend environment variables

### Configuration
- `railway.json` / `railway.toml` - Railway deployment config
- `netlify.toml` - Netlify deployment config
- `Procfile` - Process file for Heroku/Railway

## 📝 Environment Variables

### Backend (.env in backend/)
```env
PORT=7071
NODE_ENV=production
CLIENT_URL=https://your-frontend.netlify.app
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
# ... other keys
```

### Frontend (.env in client/)
```env
VITE_API_URL=https://your-backend.railway.app
VITE_RAPID_API_KEY=your_rapid_api_key
```

## 🚀 Deployment Files

### Railway
- Uses `railway.json` or `railway.toml`
- Builds backend and frontend
- Serves from backend in production

### Netlify
- Uses `netlify.toml`
- Builds only frontend
- Serves static files from `client/dist`

## 📦 Build Process

### Development
```bash
# Backend
cd backend
npm run dev

# Frontend
cd client
npm run dev
```

### Production
```bash
# Build frontend
cd client
npm run build

# Start backend (serves frontend)
cd backend
npm start
```

## 🔄 Data Flow

1. **User Action** → Frontend Component
2. **API Call** → `buildApiUrl()` → Backend API
3. **Backend** → MongoDB → Response
4. **Frontend** → Update UI

## 🎯 Feature Organization

### Core Features
- Authentication (Login/Signup)
- Posts (Create, Read, Delete)
- Events (Create, View, Register)
- Messages (Real-time chat)

### Advanced Features
- AI Chatbot
- Video Calls
- Quiz Platform
- Code Editor
- Push Notifications

## 📚 Documentation Files

- `README.md` - Main project documentation
- `DEPLOYMENT.md` - General deployment guide
- `DEPLOYMENT_SETUP.md` - Railway/Netlify specific
- `FIXES_SUMMARY.md` - All fixes applied
- `PROJECT_STRUCTURE.md` - This file

---

**Last Updated**: After comprehensive fixes and deployment setup

