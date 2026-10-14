const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function calculateCompleteness(profile) {
  let score = 0;
  if (profile.skills && JSON.parse(profile.skills).length > 0) score += 20;
  if (profile.work_experience && JSON.parse(profile.work_experience).length > 0) score += 20;
  if (profile.education && JSON.parse(profile.education).length > 0) score += 20;
  if (profile.projects && JSON.parse(profile.projects).length > 0) score += 20;
  if (profile.phone || profile.location) score += 10;
  if (profile.linkedin_url || profile.github_url || profile.portfolio_url) score += 10;
  return Math.min(100, score);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, headline } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userResult = db.run(
      'INSERT INTO users (email, password_hash, name, headline) VALUES (?, ?, ?, ?)',
      [email.toLowerCase(), passwordHash, name, headline || 'Aspiring Software Engineer']
    );

    const userId = userResult.lastInsertRowid;

    // Create initial profile
    db.run(
      `INSERT INTO profiles (user_id, target_role, skills, work_experience, education, projects, certifications, completeness_score)
       VALUES (?, 'Full Stack Developer', '[]', '[]', '[]', '[]', '[]', 0)`,
      [userId]
    );

    // Create user settings
    db.run(
      'INSERT INTO user_settings (user_id, ai_provider, voice_enabled) VALUES (?, ?, 1)',
      [userId, config.DEFAULT_AI_PROVIDER]
    );

    const token = jwt.sign({ id: userId, email, name }, config.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, email, name, headline: headline || 'Aspiring Software Engineer' }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.get('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, config.JWT_SECRET, { expiresIn: '7d' });

    const profile = db.get('SELECT target_role, completeness_score FROM profiles WHERE user_id = ?', [user.id]);

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        headline: user.headline,
        targetRole: profile?.target_role || 'Full Stack Developer',
        completenessScore: profile?.completeness_score || 0
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.get('SELECT id, email, name, headline, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profile = db.get('SELECT target_role, completeness_score FROM profiles WHERE user_id = ?', [user.id]);

    res.json({
      user: {
        ...user,
        targetRole: profile?.target_role || 'Full Stack Developer',
        completenessScore: profile?.completeness_score || 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

module.exports = router;
