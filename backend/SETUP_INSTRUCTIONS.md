# 🚀 **SETUP INSTRUCTIONS FOR VIDEO CALLING**

## **Step 1: Create .env file**

Create a file named `.env` in the `backend` folder with the following content:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/meta-verse

# OpenAI API Key (Already provided)
OPENAI_API_KEY=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

# Agora Video Calling (YOUR CREDENTIALS)
AGORA_APP_ID=6dfdc71d033449aa85d9e632a56a4f3c
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here

# Google Cloud Storage (Optional - for recordings)
GOOGLE_CLOUD_PROJECT_ID=campusconnect-468310
GOOGLE_CLOUD_BUCKET=campusconnect-recordings
GOOGLE_CLOUD_REGION=asia-south1

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
```

## **Step 2: Get Agora App Certificate**

1. Go to [Agora Console](https://console.agora.io/)
2. Find your project with App ID: `6dfdc71d033449aa85d9e632a56a4f3c`
3. Get your **App Certificate** from the project settings
4. Replace `your_agora_app_certificate_here` in the `.env` file

## **Step 3: Start the Backend**

```bash
cd backend
npm start
```

## **Step 4: Test Video Calling**

1. Start your frontend: `cd client && npm run dev`
2. Navigate to the video call section
3. The camera should now work properly!

## **What I Fixed:**

✅ **Backend BSON Errors**: Simplified Event model to avoid complex nested schemas
✅ **Video Call Component**: Updated to use `agora-rtc-sdk-ng` instead of `agora-rtc-react`
✅ **Agora Integration**: Now gets credentials dynamically from backend
✅ **Error Handling**: Added proper loading states and error messages
✅ **Screen Sharing**: Enhanced with multiple options (screen, window, application)

## **Current Status:**

- ✅ Events section: Fixed BSON errors, simplified model
- ✅ Video calling: Backend ready, frontend updated with correct SDK
- ✅ AI Chatbot: Working with your OpenAI API key
- ✅ Push notifications: Backend ready (needs VAPID keys)
- ✅ Advanced features: Backend ready

## **If Camera Still Doesn't Work:**

1. Check browser console for errors
2. Make sure you have camera/microphone permissions
3. Verify Agora credentials are correct in `.env`
4. Check if backend is running on port 5000
5. Make sure frontend is calling `http://localhost:5000/api/videocall/generate-token`

## **Your Agora Configuration:**

- **App ID**: `6dfdc71d033449aa85d9e632a56a4f3c`
- **Project**: CampusConnect
- **Features**: Cloud Recording, Video Screenshot Upload enabled
- **Google Cloud Integration**: Ready for recordings

The video calling should now work properly once you add your Agora App Certificate! 🎥✨
