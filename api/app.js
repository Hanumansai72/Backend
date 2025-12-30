const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Config imports
const connectDB = require('./config/database');
const { initializeSocket } = require('./utils/socketHandler');
const { initRedis, getRedisClient } = require('./config/redis');
const session = require('express-session');
const RedisStore = require('connect-redis').default;

// Middleware imports
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const walletRoutes = require('./routes/walletRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const utilityRoutes = require('./routes/utilityRoutes');

// App initialization
const app = express();
const server = http.createServer(app);

// Security Middleware
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Security headers
app.use(helmet());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// NoSQL injection protection
// NoSQL injection protection using safe middleware (handles read-only query/params)
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize.sanitize(req.body);
  }
  // Try to sanitize query/params if writable
  try {
    if (req.query) req.query = mongoSanitize.sanitize(req.query);
  } catch (e) {
    // Ignore read-only errors
  }
  try {
    if (req.params) req.params = mongoSanitize.sanitize(req.params);
  } catch (e) {
    // Ignore read-only errors
  }
  next();
});

// Compression
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// Database connection
connectDB();

// Redis initialization
initRedis().then((client) => {
  if (client) {
    app.use(session({
      store: new RedisStore({ client }),
      secret: process.env.SESSION_SECRET || 'apna_mestri_secret',
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      }
    }));
    console.log('Session management with Redis initialized');
  } else {
    // Fallback to memory store if Redis is unavailable (not recommended for production)
    app.use(session({
      secret: process.env.SESSION_SECRET || 'apna_mestri_secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production' }
    }));
    console.log('Session management fallback to memory initialized');
  }
}).catch(err => {
  console.log('Redis initialization failed, session management may be limited:', err.message);
});

// Socket.IO initialization
initializeSocket(server);

// Routes - mounting all route modules
// Note: Routes are mounted without prefix to maintain backward compatibility
app.use('/', authRoutes);
app.use('/', vendorRoutes);
app.use('/', productRoutes);
app.use('/', orderRoutes);
app.use('/', cartRoutes);
app.use('/', bookingRoutes);
app.use('/', chatRoutes);
app.use('/', walletRoutes);
app.use('/', reviewRoutes);
app.use('/', projectRoutes);
app.use('/', userRoutes);
app.use('/', utilityRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Server start
server.listen(8031, () => {
  console.log('Server started on http://localhost:8031');
});

module.exports = app;
