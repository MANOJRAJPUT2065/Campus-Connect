# 🚀 Deployment Setup Guide - Railway & Netlify

## 📋 Quick Setup Checklist

### Backend (Railway)
- [ ] Create Railway account
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy

### Frontend (Netlify)
- [ ] Create Netlify account
- [ ] Create new site
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Deploy

---

## 🔧 Railway Backend Setup

### Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 2: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
# Server
PORT=7071
NODE_ENV=production
CLIENT_URL=https://your-netlify-app.netlify.app

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meta-verse?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Agora (Optional - for video calls)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# VAPID (Optional - for push notifications)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# AI Chatbot
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your_openai_api_key
# OR for Gemini:
# AI_PROVIDER=gemini
# GEMINI_API_KEY=your_gemini_api_key
# GEMINI_MODEL=gemini-1.5-flash
```

### Step 3: Configure Build Settings

Railway will auto-detect, but verify:
- **Root Directory**: Leave empty (or set to `backend` if needed)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 4: Get Your Backend URL

After deployment, Railway will provide a URL like:
```
https://your-app-name.up.railway.app
```

**Save this URL** - you'll need it for frontend!

---

## 🌐 Netlify Frontend Setup

### Step 1: Create Netlify Site

1. Go to [Netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Select your repository

### Step 2: Configure Build Settings

In Netlify dashboard:

- **Base directory**: `client`
- **Build command**: `npm run build`
- **Publish directory**: `client/dist`

### Step 3: Set Environment Variables

Go to **Site settings** → **Environment variables** and add:

```env
# Backend API URL (from Railway)
VITE_API_URL=https://your-app-name.up.railway.app

# RapidAPI Key (Optional - for code editor)
VITE_RAPID_API_KEY=your_rapid_api_key
```

### Step 4: Deploy

Click "Deploy site" - Netlify will build and deploy automatically!

---

## 🔗 Connect Frontend to Backend

### Update CORS in Railway Backend

Make sure your Railway backend has:
```env
CLIENT_URL=https://your-netlify-app.netlify.app
```

This allows your frontend to make API calls.

---

## ✅ Verification Steps

### 1. Test Backend
```bash
curl https://your-app-name.up.railway.app/health
```
Should return: `{"status":"OK",...}`

### 2. Test Frontend
Visit: `https://your-netlify-app.netlify.app`

### 3. Test API Connection
- Open browser console on frontend
- Try to login/signup
- Check Network tab for API calls

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is 32+ characters
- [ ] MongoDB has authentication enabled
- [ ] CORS is configured correctly
- [ ] Environment variables are set (not hardcoded)
- [ ] HTTPS is enabled (automatic on Railway/Netlify)
- [ ] API keys are kept secret

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check Railway logs
- Verify all required env vars are set
- Check MongoDB connection string

**Problem**: CORS errors
- Verify `CLIENT_URL` matches your Netlify URL exactly
- Check backend logs for CORS errors

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Verify backend is running (check Railway logs)

**Problem**: Build fails
- Check Netlify build logs
- Verify Node.js version (should be 18+)
- Clear cache and rebuild

---

## 📊 Monitoring

### Railway
- View logs in Railway dashboard
- Set up alerts for errors
- Monitor resource usage

### Netlify
- View build logs
- Check function logs (if using)
- Monitor bandwidth usage

---

## 🔄 Continuous Deployment

Both Railway and Netlify support automatic deployments:
- **Railway**: Deploys on every push to main branch
- **Netlify**: Deploys on every push to main branch

To disable auto-deploy:
- Railway: Settings → Source → Disable auto-deploy
- Netlify: Site settings → Build & deploy → Stop auto publishing

---

## 💰 Cost Estimation

### Railway
- **Free tier**: $5 credit/month
- **Hobby**: $5/month (after free tier)
- **Pro**: $20/month

### Netlify
- **Free tier**: 100GB bandwidth, 300 build minutes
- **Pro**: $19/month (more bandwidth, build minutes)

### MongoDB Atlas
- **Free tier**: 512MB storage
- **M0**: Free forever (shared cluster)

---

## 📞 Support

If you encounter issues:
1. Check logs in Railway/Netlify dashboard
2. Verify environment variables
3. Test API endpoints with Postman/curl
4. Check MongoDB connection
5. Review error messages carefully

---

**Happy Deploying! 🚀**

