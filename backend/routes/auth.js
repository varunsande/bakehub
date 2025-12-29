import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTP } from '../utils/emailService.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateTokens.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Normalize email to lowercase for consistent storage
    const normalizedEmail = email.toLowerCase();
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(normalizedEmail, { otp, expiresAt });

    const result = await sendOTP(email, otp);

    if (!result.success) {
      // Log detailed error for debugging
      console.error('OTP sending failed:', {
        email,
        error: result.error,
        details: result.details
      });
      
      return res.status(500).json({ 
        message: result.error || 'Failed to send OTP',
        details: result.details || result.error
      });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      details: error.message
    });
  }
});

// Verify OTP and Login/Register
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase();
    const storedData = otpStore.get(normalizedEmail);

    if (!storedData) {
      // Debug: Log available emails in store (for development only)
      const availableEmails = Array.from(otpStore.keys());
      console.log(`OTP verification failed - Email not found: ${normalizedEmail}`);
      console.log(`Available emails in store: ${availableEmails.length > 0 ? availableEmails.join(', ') : 'none'}`);
      return res.status(400).json({ message: 'OTP not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (storedData.otp !== otp) {
      console.log(`OTP mismatch for ${normalizedEmail}`);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // OTP verified, remove from store
    otpStore.delete(normalizedEmail);

    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user
      user = new User({
        email: normalizedEmail,
        role: 'customer'
      });
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user._id);

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json({
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      mobileNumber: user.mobileNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, mobileNumber } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (mobileNumber) user.mobileNumber = mobileNumber;

    await user.save();

    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        mobileNumber: user.mobileNumber
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

