# Meta-Verse New Features Setup Instructions

This document explains how to set up the three new features added to your Meta-Verse project:

1. **Video Calls for Online Classes**
2. **Push Notifications for Urgent Updates**
3. **AI Chatbot for Student Questions**

## Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Modern web browser with WebRTC support

## 1. Video Calls Setup (Agora)

### Step 1: Get Agora Credentials
1. Go to [Agora Console](https://console.agora.io/)
2. Create a new project
3. Get your App ID and App Certificate

### Step 2: Install Dependencies
```bash
cd backend
npm install agora-access-token
```

### Step 3: Environment Variables
Add these to your backend `.env` file:
```env
AGORA_APP_ID=your-agora-app-id-here
AGORA_APP_CERTIFICATE=your-agora-app-certificate-here
```

### Step 4: Frontend Dependencies
```bash
cd client
npm install agora-rtc-react
```

## 2. Push Notifications Setup

### Step 1: Install Dependencies
```bash
cd backend
npm install web-push
```

### Step 2: Generate VAPID Keys
The VAPID keys will be auto-generated when you start the server. You can also generate them manually:

```bash
cd backend
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log('Public Key:', keys.publicKey); console.log('Private Key:', keys.privateKey);"
```

### Step 3: Frontend Dependencies
```bash
cd client
npm install react-push-notification
```

### Step 4: Service Worker
The service worker file `client/public/sw.js` is already created and will handle push notifications automatically.

## 3. AI Chatbot Setup

### Step 1: Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and get your API key

### Step 2: Install Dependencies
```bash
cd backend
npm install openai
```

### Step 3: Environment Variables
Add this to your backend `.env` file:
```env
OPENAI_API_KEY=your-openai-api-key-here
```

## 4. Complete Environment File

Create a `.env` file in your backend directory with all required variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/meta-verse

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API Key (for AI chatbot)
OPENAI_API_KEY=your-openai-api-key-here

# Agora Video Call Configuration
AGORA_APP_ID=your-agora-app-id-here
AGORA_APP_CERTIFICATE=your-agora-app-certificate-here

# Server Configuration
PORT=7071
NODE_ENV=development
```

## 5. Install All Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd client
npm install
```

## 6. Start the Application

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd client
npm run dev
```

## 7. Testing the Features

### Video Calls
1. Navigate to `/online-classes`
2. Click on a class to join
3. Allow camera and microphone permissions
4. Test video and audio

### Push Notifications
1. Go to the Online Classes page
2. Click the bell icon to open notifications panel
3. Click "Enable" to subscribe
4. Allow notification permissions
5. Test with the "Send Test Notification" button

### AI Chatbot
1. Click the floating chat button (bottom-left corner)
2. Ask questions like:
   - "When is the next exam?"
   - "What's the syllabus for this semester?"
   - "When are assignment deadlines?"

## 8. Features Overview

### Video Calls
- **Real-time video and audio communication**
- **Screen sharing for instructors**
- **Participant management**
- **Responsive design for all devices**
- **Mute/unmute and video on/off controls**

### Push Notifications
- **Instant urgent updates**
- **Customizable notification preferences**
- **Background notification handling**
- **Click to navigate to relevant pages**
- **Test notification functionality**

### AI Chatbot
- **Voice input support**
- **Quick suggestion buttons**
- **Knowledge base for common questions**
- **OpenAI integration for complex queries**
- **Fallback responses for offline scenarios**

## 9. Troubleshooting

### Video Calls Not Working
- Check if Agora credentials are correct
- Ensure camera and microphone permissions are granted
- Check browser console for errors
- Verify WebRTC support in your browser

### Push Notifications Not Working
- Check if service worker is registered
- Verify notification permissions are granted
- Check browser console for errors
- Ensure HTTPS is used (required for service workers)

### AI Chatbot Not Responding
- Verify OpenAI API key is correct
- Check backend console for errors
- Ensure internet connection is stable
- Check if the backend server is running

## 10. Production Considerations

### Security
- Use environment variables for all API keys
- Implement proper authentication for video calls
- Rate limit chatbot requests
- Validate all user inputs

### Performance
- Implement caching for chatbot responses
- Use CDN for video call resources
- Optimize service worker caching
- Monitor API usage and costs

### Scalability
- Use database for notification subscriptions
- Implement queue system for notifications
- Consider multiple Agora projects for different regions
- Monitor server resources and scale accordingly

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend console for server errors
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
5. Check if the required services (MongoDB, etc.) are running

Happy coding! 🚀
