# ⚡ Quick Start Guide - Meta-Verse

## 🚀 Get Running in 5 Minutes

### Step 1: Clone & Install
```bash
git clone <your-repo-url>
cd Meta-Verse

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Setup Environment Variables

**Backend** (`backend/.env`):
```env
PORT=7071
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/meta-verse
JWT_SECRET=your_secret_key_here_min_32_chars
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:7071
```

### Step 3: Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Step 5: Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:7071
- API Docs: http://localhost:7071/api

---

## 🌐 Deploy to Railway + Netlify

### Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables (see DEPLOYMENT_SETUP.md)
4. Deploy!

### Frontend (Netlify)
1. Go to [netlify.com](https://netlify.com)
2. Add new site → Import from GitHub
3. Build settings:
   - Base: `client`
   - Build: `npm run build`
   - Publish: `client/dist`
4. Add `VITE_API_URL` environment variable
5. Deploy!

---

## ✅ That's It!

Your app is now running! 🎉

For detailed setup, see:
- `README.md` - Full documentation
- `DEPLOYMENT_SETUP.md` - Deployment guide
- `PROJECT_STRUCTURE.md` - Project structure

