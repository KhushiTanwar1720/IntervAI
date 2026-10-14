const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Ensure db schema is initialized
require('./db/database');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const resumeRoutes = require('./routes/resume.routes');
const rolesRoutes = require('./routes/roles.routes');
const jdRoutes = require('./routes/jd.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const resourcesRoutes = require('./routes/resources.routes');
const interviewRoutes = require('./routes/interview.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const settingsRoutes = require('./routes/settings.routes');

const app = express();

// Global middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/jd', jdRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// In production, serve the built Vite client from client/dist
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

const server = app.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(`🎯 AI Interview Preparation Platform Backend Running`);
  console.log(`📡 URL: http://localhost:${config.PORT}`);
  console.log(`🩺 Health: http://localhost:${config.PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = app;
