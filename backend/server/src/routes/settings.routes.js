const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// GET /api/settings
router.get('/', authenticateToken, (req, res) => {
  try {
    let settings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (!settings) {
      db.run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
      settings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    }

    res.json({
      ai_provider: settings.ai_provider || 'local',
      has_gemini_key: Boolean(settings.gemini_api_key || config.GEMINI_API_KEY),
      has_openai_key: Boolean(settings.openai_api_key || config.OPENAI_API_KEY),
      voice_enabled: Boolean(settings.voice_enabled),
      speech_rate: settings.speech_rate || 1.0,
      env_has_gemini: Boolean(config.GEMINI_API_KEY),
      env_has_openai: Boolean(config.OPENAI_API_KEY)
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings.' });
  }
});

// PUT /api/settings
router.put('/', authenticateToken, (req, res) => {
  try {
    const { ai_provider, gemini_api_key, openai_api_key, voice_enabled, speech_rate } = req.body;

    let settings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    if (!settings) {
      db.run('INSERT INTO user_settings (user_id) VALUES (?)', [req.user.id]);
    }

    db.run(`
      UPDATE user_settings
      SET ai_provider = COALESCE(?, ai_provider),
          gemini_api_key = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE gemini_api_key END,
          openai_api_key = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE openai_api_key END,
          voice_enabled = COALESCE(?, voice_enabled),
          speech_rate = COALESCE(?, speech_rate)
      WHERE user_id = ?
    `, [
      ai_provider,
      gemini_api_key, gemini_api_key, gemini_api_key,
      openai_api_key, openai_api_key, openai_api_key,
      voice_enabled !== undefined ? (voice_enabled ? 1 : 0) : null,
      speech_rate !== undefined ? Number(speech_rate) : null,
      req.user.id
    ]);

    const updated = db.get('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);

    res.json({
      message: 'Settings updated successfully.',
      ai_provider: updated.ai_provider,
      has_gemini_key: Boolean(updated.gemini_api_key || config.GEMINI_API_KEY),
      has_openai_key: Boolean(updated.openai_api_key || config.OPENAI_API_KEY),
      voice_enabled: Boolean(updated.voice_enabled),
      speech_rate: updated.speech_rate
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

module.exports = router;
