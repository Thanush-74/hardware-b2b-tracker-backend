require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { successResponse, errorResponse } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse incoming JSON and urlencoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Hardware B2B Tracker Backend is running'
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// 404 Not Found Handler for unmatched routes
app.use((req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Login endpoint: http://localhost:${PORT}/api/auth/login`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
