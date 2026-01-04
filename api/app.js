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
const { initRedis } = require('./config/redis');

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

// CORS configuration - Specific origins for credentials mode
const allowedOrigins = [
  'https://www.apnamestri.com',
  'https://apnamestri.com',
  'https://partner.apnamestri.com',
  'https://product-apna-mestri.vercel.app',
  'https://vendor-apna.vercel.app',
  'https://admin-apna-mestri.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all for now, but log it
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
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

// Redis initialization (optional - won't fail if not configured)
initRedis().catch(err => console.log('Redis not available:', err.message));

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
