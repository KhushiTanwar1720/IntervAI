const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function computeCompleteness(p) {
  let score = 0;
  const breakdown = {};

  const skills = Array.isArray(p.skills) ? p.skills : JSON.parse(p.skills || '[]');
  const exp = Array.isArray(p.work_experience) ? p.work_experience : JSON.parse(p.work_experience || '[]');
  const edu = Array.isArray(p.education) ? p.education : JSON.parse(p.education || '[]');
  const proj = Array.isArray(p.projects) ? p.projects : JSON.parse(p.projects || '[]');
  const certs = Array.isArray(p.certifications) ? p.certifications : JSON.parse(p.certifications || '[]');

  if (skills.length >= 3) { score += 20; breakdown.skills = 20; }
  else if (skills.length > 0) { score += 10; breakdown.skills = 10; }
  else breakdown.skills = 0;

  if (exp.length > 0) { score += 20; breakdown.experience = 20; }
  else breakdown.experience = 0;

  if (edu.length > 0) { score += 20; breakdown.education = 20; }
  else breakdown.education = 0;

  if (proj.length > 0) { score += 20; breakdown.projects = 20; }
  else breakdown.projects = 0;

  if (p.phone || p.location) { score += 10; breakdown.contact = 10; }
  else breakdown.contact = 0;

  if (p.linkedin_url || p.github_url || p.portfolio_url) { score += 10; breakdown.links = 10; }
  else breakdown.links = 0;

  return { score: Math.min(100, score), breakdown };
}

// GET /api/profile
router.get('/', authenticateToken, (req, res) => {
  try {
    const user = db.get('SELECT id, email, name, headline FROM users WHERE id = ?', [req.user.id]);
    let profile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);

    if (!profile) {
      db.run('INSERT INTO profiles (user_id) VALUES (?)', [req.user.id]);
      profile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    }

    const completeness = computeCompleteness(profile);

    res.json({
      user,
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills || '[]'),
        work_experience: JSON.parse(profile.work_experience || '[]'),
        education: JSON.parse(profile.education || '[]'),
        projects: JSON.parse(profile.projects || '[]'),
        certifications: JSON.parse(profile.certifications || '[]'),
        career_preferences: JSON.parse(profile.career_preferences || '{}'),
        completeness
      }
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// PUT /api/profile
router.put('/', authenticateToken, (req, res) => {
  try {
    const {
      headline,
      name,
      phone,
      location,
      linkedin_url,
      github_url,
      portfolio_url,
      target_role,
      target_level,
      skills,
      experience_years,
      work_experience,
      education,
      projects,
      certifications,
      career_preferences
    } = req.body;

    // Update headline / name if provided
    if (name || headline !== undefined) {
      db.run(
        'UPDATE users SET name = COALESCE(?, name), headline = COALESCE(?, headline) WHERE id = ?',
        [name, headline, req.user.id]
      );
    }

    const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : []);
    const expJson = JSON.stringify(Array.isArray(work_experience) ? work_experience : []);
    const eduJson = JSON.stringify(Array.isArray(education) ? education : []);
    const projJson = JSON.stringify(Array.isArray(projects) ? projects : []);
    const certJson = JSON.stringify(Array.isArray(certifications) ? certifications : []);
    const prefJson = JSON.stringify(typeof career_preferences === 'object' ? career_preferences : {});

    const completenessData = computeCompleteness({
      skills: skillsJson,
      work_experience: expJson,
      education: eduJson,
      projects: projJson,
      certifications: certJson,
      phone,
      location,
      linkedin_url,
      github_url,
      portfolio_url
    });

    db.run(`
      UPDATE profiles
      SET phone = ?, location = ?, linkedin_url = ?, github_url = ?, portfolio_url = ?,
          target_role = ?, target_level = ?, skills = ?, experience_years = ?,
          work_experience = ?, education = ?, projects = ?, certifications = ?,
          career_preferences = ?, completeness_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      phone || '',
      location || '',
      linkedin_url || '',
      github_url || '',
      portfolio_url || '',
      target_role || 'Full Stack Developer',
      target_level || 'Mid',
      skillsJson,
      Number(experience_years) || 0,
      expJson,
      eduJson,
      projJson,
      certJson,
      prefJson,
      completenessData.score,
      req.user.id
    ]);

    const updatedProfile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const updatedUser = db.get('SELECT id, email, name, headline FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
      profile: {
        ...updatedProfile,
        skills: JSON.parse(updatedProfile.skills || '[]'),
        work_experience: JSON.parse(updatedProfile.work_experience || '[]'),
        education: JSON.parse(updatedProfile.education || '[]'),
        projects: JSON.parse(updatedProfile.projects || '[]'),
        certifications: JSON.parse(updatedProfile.certifications || '[]'),
        career_preferences: JSON.parse(updatedProfile.career_preferences || '{}'),
        completeness: completenessData
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// GET /api/profile/completeness
router.get('/completeness', authenticateToken, (req, res) => {
  try {
    const profile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    if (!profile) return res.json({ score: 0, breakdown: {} });
    res.json(computeCompleteness(profile));
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute profile completeness.' });
  }
});

module.exports = router;
