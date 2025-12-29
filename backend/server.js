import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file FIRST - before importing any routes that might use env vars
// Try backend directory first, then root directory
const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: backendEnvPath });
// Also load from root if backend .env doesn't exist (for flexibility)
dotenv.config({ path: rootEnvPath, override: false });

// Import routes AFTER environment variables are loaded
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import addressRoutes from './routes/addresses.js';
import couponRoutes from './routes/coupons.js';
import bannerRoutes from './routes/banners.js';
import deliveryBoyRoutes from './routes/deliveryBoy.js';
import adminRoutes from './routes/admin.js';
import deliveryPincodeRoutes from './routes/deliveryPincodes.js';
import paymentRoutes from './routes/payments.js';
import uploadRoutes from './routes/upload.js';

const app = express();

// Middleware
app.use(morgan('dev')); // HTTP request logger
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/delivery-boy', deliveryBoyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery-pincodes', deliveryPincodeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BakeHub API is running' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bakehub')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

