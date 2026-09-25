const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const codingRoutes = require('./routes/codingRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const plagiarismRoutes = require('./routes/plagiarismRoutes');
const antiCheatRoutes = require('./routes/antiCheatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const proctorRoutes = require('./routes/proctorRoutes');
const examAssignmentRoutes = require('./routes/examAssignmentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate Limiter for API protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Mount API Routes
app.use('/api/public', publicRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/assessments', examRoutes);
app.use('/api', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/anti-cheat', antiCheatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/exam-assignments', examAssignmentRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API Server Healthy', timestamp: new Date() });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
