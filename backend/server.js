import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================
   LOAD ENV VARIABLES
========================= */
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: false });

/* =========================
   IMPORT ROUTES
========================= */
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import addressRoutes from "./routes/addresses.js";
import couponRoutes from "./routes/coupons.js";
import bannerRoutes from "./routes/banners.js";
import deliveryBoyRoutes from "./routes/deliveryBoy.js";
import adminRoutes from "./routes/admin.js";
import deliveryPincodeRoutes from "./routes/deliveryPincodes.js";
import paymentRoutes from "./routes/payments.js";
import uploadRoutes from "./routes/upload.js";

/* =========================
   APP INIT
========================= */
const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(morgan("dev"));

/* ✅ SIMPLE & CORRECT CORS (PRODUCTION SAFE) */
app.use(
  cors({
    origin: [
      "https://sweethub.shop",
      "https://www.sweethub.shop",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/delivery-boy", deliveryBoyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/delivery-pincodes", deliveryPincodeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SweetHub Backend is running 🚀",
  });
});

/* =========================
   ROOT (OPTIONAL)
========================= */
app.get("/", (req, res) => {
  res.send("SweetHub Backend Live 🚀");
});

/* =========================
   DATABASE
========================= */
mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
