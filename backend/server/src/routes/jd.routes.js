const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// POST /api/jd/analyze
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { title, company = '', jdText } = req.body;
    if (!jdText || jdText.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide a valid job description text (minimum 20 characters).' });
    }

    const profile = db.get('SELECT skills FROM profiles WHERE user_id = ?', [req.user.id]);
    const candidateSkills = profile ? JSON.parse(profile.skills || '[]') : [];

    const userSettings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]) || {};

    const analysis = await aiService.analyzeJobDescription({
      jdText,
      candidateSkills,
      userSettings
    });

    const insertRes = db.run(`
      INSERT INTO job_descriptions (
        user_id, title, company, raw_text, extracted_skills, experience_level, match_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      title || 'Software Engineering Position',
      company,
      jdText,
      JSON.stringify(analysis.extractedSkills),
      analysis.detectedLevel,
      JSON.stringify(analysis)
    ]);

    res.json({
      id: insertRes.lastInsertRowid,
      title: title || 'Software Engineering Position',
      company,
      analysis
    });
  } catch (err) {
    console.error('JD analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze job description.' });
  }
});

// GET /api/jd/history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const records = db.all(`
      SELECT id, title, company, experience_level, match_analysis, created_at
      FROM job_descriptions
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(records.map(r => ({
      ...r,
      match_analysis: JSON.parse(r.match_analysis || '{}')
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch JD analysis history.' });
  }
});

// GET /api/jd/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const record = db.get('SELECT * FROM job_descriptions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!record) return res.status(404).json({ error: 'Job description record not found.' });

    res.json({
      ...record,
      extracted_skills: JSON.parse(record.extracted_skills || '[]'),
      match_analysis: JSON.parse(record.match_analysis || '{}')
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch record.' });
  }
});

module.exports = router;
