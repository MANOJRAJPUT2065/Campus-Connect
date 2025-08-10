// Simple test script to check backend startup
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing backend startup...');

// Test MongoDB connection
async function testMongoDB() {
  try {
    console.log('📡 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/meta-verse');
    console.log('✅ MongoDB connection successful!');
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnection successful!');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }
}

// Test environment variables
function testEnvVars() {
  console.log('🔧 Testing environment variables...');
  
  const required = [
    'MONGODB_URI',
    'AGORA_APP_ID', 
    'AGORA_APP_CERTIFICATE',
    'OPENAI_API_KEY',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    console.log('✅ All environment variables are set!');
  } else {
    console.log('⚠️  Missing environment variables:', missing);
    console.log('📝 Please check env-example.txt for required variables');
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting backend tests...\n');
  
  testEnvVars();
  console.log('');
  
  await testMongoDB();
  console.log('');
  
  console.log('🎯 Test completed!');
  console.log('💡 If all tests pass, you can run: npm start');
}

runTests().catch(console.error);
