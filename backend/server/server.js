import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';
import dns from 'dns';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import Wedding from './models/Wedding.js';
import authRoutes from './routes/authRoutes.js';
import weddingRoutes from './routes/weddingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// MongoDB Atlas SRV lookup ke liye public DNS servers set kiye taaki connection issue na aaye
dns.setServers(['1.1.1.1', '1.0.0.1']);

// ES modules me __dirname nikalne ke liye fileURLToPath use kar rahe hain
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/.env file se environment variables load kar rahe hain
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // Backup fallback current working directory ke liye

/**
 * Database Connection:
 * Server start hote hi MongoDB ke sath connection initialize karta hai.
 * Connect hone ke turant baad stuck generation jobs reset hote hain.
 */

/**
 * Stuck Generation Jobs Reset:
 * Server restart ke baad 'generating' status me phase hue background jobs
 * hamesha failed me atke rahenge — startup par unhe 'failed' mark kar dete hain
 * taaki user 'Try again' kar sake. MongoDB connect hone ke turant baad chalta hai.
 */
connectDB().then(async () => {
  try {
    const result = await Wedding.updateMany(
      { generationStatus: 'generating' },
      {
        generationStatus: 'failed',
        generationError: 'Server restart hone se generation ruk gayi, dobara try karein.',
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Startup Reset]: ${result.modifiedCount} stuck generation jobs ko 'failed' mark kiya.`.yellow);
    }
  } catch (resetError) {
    console.error('[Startup Reset Failed]:'.red, resetError.message);
  }
});

/**
 * Express Application:
 * Express ka main instance create kiya jo saari incoming HTTP requests handle karega.
 */
const app = express();

// Render ka reverse proxy — express-rate-limit ko client ka real IP mile (X-Forwarded-For)
// Ye rate limiters define hone se PEHLE set hona zaroori hai
app.set('trust proxy', 1);

// CORS configuration CLIENT_URL env variable se bind hai aur credentials allow hain
// Sirf comma-separated CLIENT_URL origins allow; localhost dev env me hi (NODE_ENV !== 'production')
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDev
  ? [...new Set([...envOrigins, 'http://localhost:5173'])]
  : envOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman, sandboxed iframes (origin 'null'), mobile apps ya server-to-server requests
      if (!origin || origin === 'null' || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Disallowed origin par error return karo, aur usme 403 status mark kiya
      // taaki global error handler 500 ke bajaye 403 Forbidden bheje
      const corsError = new Error(`CORS policy dwara origin ${origin} block kiya gaya hai.`);
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: true,
  })
);

/**
 * Rate Limiters:
 * Brute-force aur AI abuse se bachne ke liye sensitive routes par request limits.
 */
const makeLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, data: null, message },
  });

// Login/Register: 15 min window me max 20 attempts
const authLimiter = makeLimiter(
  15 * 60 * 1000,
  20,
  'Bahut zyada attempts ho gaye. Kripya 15 minute baad punah prayas karein.'
);

// AI generation: har ghante me max 10 calls (Gemini quota abuse rokne ke liye)
const aiLimiter = makeLimiter(
  60 * 60 * 1000,
  10,
  'AI generation limit reached. Kripya ek ghante baad try karein.'
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Base Health Check Route:
 * Check karta hai ki API live hai ya nahi, aur main routes ki summary return karta hai.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      endpoints: {
        auth: '/api/auth',
        wedding: '/api/wedding',
        admin: '/api/admin',
        ai: '/api/ai',
      },
      version: '1.0.0',
    },
    message: 'Welcome to ShaadiPage Backend API - AI Wedding Website Platform',
  });
});

/**
 * Route Handlers Mount Kar Rahe Hain:
 * Har module ke routes ko unke prefix ke sath link kar rahe hain.
 */
app.use('/api/auth/login', authLimiter);       // Login: brute-force protection
app.use('/api/auth/register', authLimiter);    // Register: spam account protection
app.use('/api/ai/generate', aiLimiter);        // AI generate: quota abuse protection
app.use('/api/auth', authRoutes);       // Authentication routes (register, login, profile)
app.use('/api/wedding', weddingRoutes); // Wedding CRUD & photo upload routes
app.use('/api/admin', adminRoutes);     // Admin management & analytics routes
app.use('/api/ai', aiRoutes);           // Gemini AI wedding website generation route

/**
 * 404 Route Handler Middleware:
 * // CHANGED: Consistent { success, data, message } format me 404 response
 */
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    data: null,
    message: `Ye API route server par nahi mila: ${req.method} ${req.originalUrl}`,
  });
});

/**
 * Global Error Handling Middleware:
 * // CHANGED: Consistent { success, data, message } format me centralized error response
 */
app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err.message);
  // CORS aur custom errors apna statusCode carry karte hain; baaki 500
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    data: null,
    message: err.message || 'Server par koi internal error aaya hai.',
    // NODE_ENV set na ho toh bhi production-safe: stack sirf 'development' me
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
});


/**
 * Server Start:
 * .env ke PORT (default 5000) par Express server ko listen/start karta hai.
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[ShaadiPage Server]: Running on port ${PORT}`.bgBlue.white);
  console.log(`[API Base URL]: http://localhost:${PORT}`.cyan);
});

export default app;
