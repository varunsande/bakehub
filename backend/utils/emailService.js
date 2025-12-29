import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env file if not already loaded (fallback)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.join(__dirname, "..", ".env");
const rootEnvPath = path.join(__dirname, "..", "..", ".env");
dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath, override: false });

// Get environment variables (support both BREVO_* and generic SMTP_* for backward compatibility)
const smtpHost = process.env.SMTP_HOST || process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const smtpPort = parseInt(process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || process.env.BREVO_SMTP_USER;
const smtpPass = process.env.SMTP_PASS || process.env.BREVO_SMTP_PASS;

// Determine secure flag based on port (465 = SSL, 587 = STARTTLS)
// Allow override via env var if needed
const smtpSecure = process.env.SMTP_SECURE === "true" 
  ? true 
  : process.env.SMTP_SECURE === "false" 
  ? false 
  : smtpPort === 465; // Default: secure for 465, not secure for 587

// Validate environment variables
if (!smtpUser || !smtpPass) {
  console.error("⚠️  Email Service Configuration Error:");
  console.error(`   SMTP_USER: ${smtpUser ? '✓ Set' : '✗ Missing'}`);
  console.error(`   SMTP_PASS: ${smtpPass ? '✓ Set' : '✗ Missing'}`);
  console.error("   Please check your .env file in the backend directory.");
  console.error("   Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS");
}

// SMTP transporter (only create if credentials are available)
let transporter = null;
if (smtpUser && smtpPass) {
  const transporterConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  // For port 587 (STARTTLS), ensure TLS is properly configured
  if (smtpPort === 587 && !smtpSecure) {
    transporterConfig.requireTLS = true;
  }

  transporter = nodemailer.createTransport(transporterConfig);
  
  // Verify connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error("⚠️  SMTP Connection Error:", error.message);
    } else {
      console.log("✓ SMTP server connection verified");
    }
  });
}

// -------------------- OTP EMAIL --------------------
export const sendOTP = async (email, otp) => {
  if (!transporter) {
    return {
      success: false,
      error: "Failed to send OTP",
      details: "Email service not configured. Missing SMTP credentials.",
    };
  }

  try {
    const mailOptions = {
      from: `"BakeHub OTP" <no-reply@bakehub.com>`,
      to: email,
      subject: "Your BakeHub OTP",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>🔐 Your OTP Code</h2>
          <p>Use the following OTP to login:</p>
          <h1 style="letter-spacing: 4px">${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error("OTP email error:", error);
    return {
      success: false,
      error: "Failed to send OTP",
      details: error.message,
    };
  }
};

// ---------------- ORDER CONFIRMATION EMAIL ----------------
export const sendOrderConfirmation = async (email, order) => {
  if (!transporter) {
    return {
      success: false,
      error: "Failed to send order confirmation",
      details: "Email service not configured. Missing SMTP credentials.",
    };
  }

  try {
    const mailOptions = {
      from: `"BakeHub Orders" <no-reply@bakehub.com>`,
      to: email,
      subject: "Your BakeHub Order Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif">
          <h2>🎂 Order Confirmed!</h2>
          <p>Thank you for your order.</p>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Total:</strong> ₹${order.totalAmount}</p>
          <p>We'll deliver your order soon 🚚</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true };
  } catch (error) {
    console.error("Order confirmation email error:", error);
    return {
      success: false,
      error: "Failed to send order confirmation",
      details: error.message,
    };
  }
};

// Default export (safe)
export default transporter;
