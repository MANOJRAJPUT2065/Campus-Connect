import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Ensure .env is loaded even if the main server loads it later
dotenv.config();

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    '⚠️  Cloudinary is not fully configured. Missing:',
    {
      CLOUDINARY_CLOUD_NAME: Boolean(CLOUDINARY_CLOUD_NAME),
      CLOUDINARY_API_KEY: Boolean(CLOUDINARY_API_KEY),
      CLOUDINARY_API_SECRET: Boolean(CLOUDINARY_API_SECRET),
    }
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

console.log('🖼️  Cloudinary config:', {
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key_set: Boolean(CLOUDINARY_API_KEY),
  api_secret_set: Boolean(CLOUDINARY_API_SECRET)
});

export default cloudinary;
