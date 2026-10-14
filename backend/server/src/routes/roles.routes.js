const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const roleService = require('../services/roleService');

const router = express.Router();

// GET /api/roles
router.get('/', (req, res) => {
  try {
    const roles = roleService.getAllRoles();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles.' });
  }
});

// GET /api/roles/recommendations
router.get('/recommendations', authenticateToken, (req, res) => {
  try {
    const profile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const skills = profile ? JSON.parse(profile.skills || '[]') : [];
    const expYears = profile ? Number(profile.experience_years) || 0 : 0;

    const recommendations = roleService.calculateRecommendations(skills, expYears);
    const selected = roleService.getUserSelectedRoles(req.user.id);
    const selectedTitles = new Set(selected.map(s => s.role_title.toLowerCase()));

    res.json({
      targetRole: profile?.target_role || 'Full Stack Developer',
      totalRolesAnalyzed: recommendations.length,
      recommendations: recommendations.map(r => ({
        ...r,
        isSelected: selectedTitles.has(r.title.toLowerCase()),
        isPrimary: selected.find(s => s.role_title.toLowerCase() === r.title.toLowerCase())?.is_primary === 1
      }))
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ error: 'Failed to compute role recommendations.' });
  }
});

// GET /api/roles/selected
router.get('/selected', authenticateToken, (req, res) => {
  try {
    const roles = roleService.getUserSelectedRoles(req.user.id);
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch selected roles.' });
  }
});

// POST /api/roles/select
router.post('/select', authenticateToken, (req, res) => {
  try {
    const { roleTitle, isPrimary = false, matchScore = 0 } = req.body;
    if (!roleTitle) return res.status(400).json({ error: 'Role title is required.' });

    roleService.setUserSelectedRole(req.user.id, roleTitle, isPrimary, matchScore);
    const selected = roleService.getUserSelectedRoles(req.user.id);

    res.json({
      message: `Role "${roleTitle}" updated in target preferences.`,
      selectedRoles: selected
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update selected role.' });
  }
});

// DELETE /api/roles/select/:roleTitle
router.delete('/select/:roleTitle', authenticateToken, (req, res) => {
  try {
    const { roleTitle } = req.params;
    roleService.removeUserSelectedRole(req.user.id, decodeURIComponent(roleTitle));
    const selected = roleService.getUserSelectedRoles(req.user.id);

    res.json({
      message: `Role "${roleTitle}" removed.`,
      selectedRoles: selected
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove selected role.' });
  }
});

module.exports = router;
