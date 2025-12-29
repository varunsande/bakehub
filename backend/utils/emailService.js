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
    // Connection timeout settings (important for production/cloud environments)
    connectionTimeout: 60000, // 60 seconds (default is 2 seconds, too short for cloud)
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    // Retry settings
    maxConnections: 5,
    maxMessages: 100,
    // Pool connections for better performance
    pool: true,
    // Rate limiting
    rateLimit: 14, // Limit to 14 messages per second
    // Debug (only in development)
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development',
  };

  // For port 587 (STARTTLS), ensure TLS is properly configured
  if (smtpPort === 587 && !smtpSecure) {
    transporterConfig.requireTLS = true;
    transporterConfig.tls = {
      // Don't reject unauthorized certificates (some SMTP servers have self-signed certs)
      rejectUnauthorized: false,
      // Additional TLS options for better compatibility
      minVersion: 'TLSv1.2',
    };
  }

  transporter = nodemailer.createTransport(transporterConfig);
  
  // Verify connection on startup (with timeout)
  // Don't block startup if verification fails - it might be a temporary network issue
  transporter.verify((error, success) => {
    if (error) {
      console.error("⚠️  SMTP Connection Error:", error.message);
      console.error("   This is a warning - emails will still be attempted to send.");
      console.error("   If emails fail, check your SMTP settings and network connectivity.");
    } else {
      console.log("✓ SMTP server connection verified");
    }
  }).catch((err) => {
    // Verification timeout or error - don't crash the app
    console.warn("⚠️  SMTP verification skipped:", err.message);
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

    // Send with timeout handling
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout after 60 seconds')), 60000);
    });

    await Promise.race([sendPromise, timeoutPromise]);

    return { success: true };
  } catch (error) {
    console.error("OTP email error:", error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = 'Connection timeout. The SMTP server took too long to respond. This might be a network issue or the server might be temporarily unavailable.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Check your SMTP host and port settings.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check your SMTP username and password.';
    }
    
    return {
      success: false,
      error: "Failed to send OTP",
      details: errorMessage,
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

    // Send with timeout handling
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout after 60 seconds')), 60000);
    });

    await Promise.race([sendPromise, timeoutPromise]);

    return { success: true };
  } catch (error) {
    console.error("Order confirmation email error:", error);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = 'Connection timeout. The SMTP server took too long to respond.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused. Check your SMTP host and port settings.';
    } else if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check your SMTP username and password.';
    }
    
    return {
      success: false,
      error: "Failed to send order confirmation",
      details: errorMessage,
    };
  }
};

// Default export (safe)
export default transporter;
