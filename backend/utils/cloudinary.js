import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file if not already loaded (fallback)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.join(__dirname, '..', '.env');
const rootEnvPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath, override: false });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary configuration
const hasPlaceholder = process.env.CLOUDINARY_API_SECRET === '<your_api_secret>' || 
                       process.env.CLOUDINARY_API_SECRET?.includes('your_api_secret');

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  Cloudinary Configuration Error:');
  console.error('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
} else if (hasPlaceholder) {
  console.error('⚠️  Cloudinary Configuration Error:');
  console.error('   CLOUDINARY_API_SECRET is still set to placeholder value.');
  console.error('   Please replace <your_api_secret> with your actual API secret from Cloudinary dashboard.');
  console.error('   Get it from: https://console.cloudinary.com/settings/api-keys');
} else {
  console.log('✓ Cloudinary configured successfully');
}

// Create Cloudinary storage for multer
export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file field name or route
    let folder = 'bakehub';
    
    // You can customize folder structure based on file type or route
    if (file.fieldname === 'banner' || req.path?.includes('banner')) {
      folder = 'bakehub/banners';
    } else if (file.fieldname === 'product' || req.path?.includes('product')) {
      folder = 'bakehub/products';
    } else if (file.fieldname === 'image' || file.fieldname === 'images') {
      folder = 'bakehub/uploads';
    }

    return {
      folder: folder,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        {
          quality: 'auto',
          fetch_format: 'auto'
        }
      ],
      // Generate unique filename
      public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
      resource_type: 'auto', // Automatically detect image or video
    };
  },
});

// Helper function to upload a file directly (for programmatic uploads)
export const uploadToCloudinary = async (filePath, folder = 'bakehub/uploads') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
    });
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Helper function to delete a file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Helper function to extract public_id from Cloudinary URL
export const extractPublicId = (url) => {
  if (!url) return null;
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (matches && matches[1]) {
      // Remove folder prefix if present
      return matches[1].replace(/^bakehub\//, '');
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Helper function to generate optimized URL (auto-format and auto-quality)
export const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options,
  });
};

// Helper function to generate transformed URL (e.g., auto-crop, resize)
export const getTransformedUrl = (publicId, transformationOptions = {}) => {
  const defaultOptions = {
    crop: 'auto',
    gravity: 'auto',
    ...transformationOptions,
  };
  return cloudinary.url(publicId, defaultOptions);
};

// Helper function to generate responsive image URL
export const getResponsiveUrl = (publicId, width, options = {}) => {
  return cloudinary.url(publicId, {
    width: width,
    crop: 'scale',
    fetch_format: 'auto',
    quality: 'auto',
    ...options,
  });
};

export default cloudinary;

