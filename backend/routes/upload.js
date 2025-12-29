import express from 'express';
import multer from 'multer';
import { cloudinaryStorage } from '../utils/cloudinary.js';
import { authenticate, authorize } from '../middleware/auth.js';

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed! (jpg, jpeg, png, gif, webp)'));
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: cloudinaryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (Cloudinary supports larger files)
  fileFilter: fileFilter
});

const router = express.Router();

// Single image upload
router.post('/single', authenticate, authorize('superAdmin'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Unexpected file field.' });
      }
      
      // Check for Cloudinary signature errors
      if (err.message && err.message.includes('Invalid Signature')) {
        return res.status(401).json({ 
          message: 'Cloudinary authentication failed. Please check your CLOUDINARY_API_SECRET in .env file.',
          error: 'Invalid Cloudinary API secret',
          hint: 'Make sure CLOUDINARY_API_SECRET is set to your actual API secret (not the placeholder)'
        });
      }
      
      return res.status(400).json({ 
        message: err.message || 'File upload failed',
        error: err.message 
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Debug: Log the file object structure
    console.log('Upload successful. File object:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: req.file.url,
      secure_url: req.file.secure_url,
      filename: req.file.filename,
      public_id: req.file.public_id,
      keys: Object.keys(req.file)
    });
    
    // CloudinaryStorage returns the URL in req.file.path or req.file.url
    // and public_id in req.file.filename or req.file.public_id
    const imageUrl = req.file.path || req.file.url || req.file.secure_url;
    const publicId = req.file.filename || req.file.public_id;
    
    if (!imageUrl) {
      console.error('No URL found in file object:', req.file);
      return res.status(500).json({ 
        message: 'Upload succeeded but URL not found',
        file: req.file 
      });
    }
    
    res.json({
      message: 'File uploaded successfully',
      imageUrl: imageUrl, // Cloudinary secure URL
      publicId: publicId // Cloudinary public_id (for future deletion if needed)
    });
  });
});

// Multiple images upload
router.post('/multiple', authenticate, authorize('superAdmin'), (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB per file.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Unexpected file field.' });
      }
      return res.status(400).json({ message: err.message || 'File upload failed' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    // CloudinaryStorage returns the URL in file.path or file.url
    // and public_id in file.filename or file.public_id
    const imageUrls = req.files.map(file => {
      const url = file.path || file.url || file.secure_url;
      const publicId = file.filename || file.public_id;
      return {
        url: url, // Cloudinary secure URL
        publicId: publicId // Cloudinary public_id (for future deletion if needed)
      };
    });
    res.json({
      message: 'Files uploaded successfully',
      imageUrls: imageUrls.map(img => img.url), // Return just URLs for backward compatibility
      images: imageUrls // Return full objects with publicId
    });
  });
});

export default router;

