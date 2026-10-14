const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'ai-interview-prep-super-secret-jwt-key-2026',
  NODE_ENV: process.env.NODE_ENV || 'development',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER || 'local',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'interview_prep.db'),
};
