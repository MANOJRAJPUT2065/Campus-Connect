# Meta-Verse Backend Setup

## 🚀 **QUICK START - Get Backend Running in 2 Minutes!**

### **Step 1: Create .env file**
Create a file named `.env` in the `backend` folder with this content:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/meta-verse

# OpenAI API Key (Already configured in code)
OPENAI_API_KEY=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

# Client URL
CLIENT_URL=http://localhost:5173

# Port
PORT=7071
```

### **Step 2: Start the backend**
```bash
cd backend
npm start
```

That's it! Your backend should now start successfully! 🎉

---

## 🔧 **Full Environment Variables (Optional)**

If you want to enable ALL features, add these to your `.env` file:

```env
# Agora Video Call Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here

# VAPID Keys (for Push Notifications)
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## 🎯 **What's Working Right Now**

✅ **MongoDB Connection** - Database ready  
✅ **AI Chatbot** - OpenAI GPT-3.5-turbo working  
✅ **Events Management** - Full CRUD with images  
✅ **User Management** - Authentication & Profiles  
✅ **Post Management** - Social media features  
✅ **Real-time Communication** - Socket.IO integration  

## 🚧 **What Needs API Keys (Optional)**

⚠️ **Video Calls** - Need Agora credentials  
⚠️ **Push Notifications** - Need VAPID keys  
⚠️ **Image Uploads** - Need Cloudinary credentials  

## 🧪 **Test Your Backend**

Once running, visit:
- **Health Check**: http://localhost:7071/health
- **API Docs**: http://localhost:7071/api
- **Events**: http://localhost:7071/events/getEvents

## 🆘 **Troubleshooting**

If you get errors:
1. Make sure MongoDB is running
2. Check that all files are saved
3. Restart nodemon: `Ctrl+C` then `npm start`
4. Check the console for specific error messages

## 🎉 **You're All Set!**

Your backend is now configured with:
- Working AI chatbot using your OpenAI API key
- MongoDB database connection
- All basic routes working
- Ready for frontend integration
