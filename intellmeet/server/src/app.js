import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import env from './config/env.js';
import logger from './utils/logger.js';
import authRoutes from './routes/auth.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import errorMiddleware from './middleware/error.middleware.js';
import AppError from './utils/AppError.js';
import { apiRateLimiter } from './middleware/rateLimit.middleware.js';

const app = express();

/**
 * Trust Proxy Configuration: Mandatory for cloud hosting platforms (Render, Railway, Fly.io, Heroku)
 * positioned behind reverse proxies. Ensures express-rate-limit accurately resolves client IP.
 */
app.set('trust proxy', 1);

// Apply Helmet Middleware to establish secure HTTP response headers
app.use(helmet());

// Apply CORS configurations mapped strictly to the frontend SaaS client domain
// Apply CORS configurations mapped strictly to the frontend SaaS client domain (with local and Vercel sub-domain fallbacks)
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl, postman, or mobile apps)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.endsWith('.vercel.app') || 
                        origin.endsWith('.netlify.app') ||
                        env.NODE_ENV !== 'production';
      
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error(`Origin '${origin}' not authorized by CORS policy.`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow session cookies / authorization headers
  })
);

// Payload size limitations to shield against Denial-of-Service (DoS) attacks
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom lightweight logging middleware to track HTTP requests in development
app.use((req, res, next) => {
  logger.debug(`${req.method} request received at ${req.originalUrl}`);
  next();
});

// Protect all backend API resource endpoints under a standard rate limit
app.use('/api', apiRateLimiter);

// Register Core Authentication Routes
app.use('/api/auth', authRoutes);

// Register Core Meeting CRUD Routes
app.use('/api/meetings', meetingRoutes);

// Fallback Route Handler for undefined endpoints
app.all('*', (req, res, next) => {
  next(new AppError(`Requested resource '${req.originalUrl}' could not be located on this server.`, 404));
});

// Register Centralized Error Middleware (Must reside at the very end of middleware pipeline)
app.use(errorMiddleware);

export default app;
