const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { parseResume } = require('../services/resumeParserService');

const router = express.Router();

// POST /api/resume/upload
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded.' });
    }

    const { rawText, parsed } = await parseResume(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // Save resume record in DB
    const insertRes = db.run(`
      INSERT INTO resumes (user_id, filename, file_size, raw_text, parsed_data)
      VALUES (?, ?, ?, ?, ?)
    `, [
      req.user.id,
      req.file.originalname,
      req.file.size,
      rawText,
      JSON.stringify(parsed)
    ]);

    const resumeId = insertRes.lastInsertRowid;

    // Fetch current user profile to calculate preview of diffs
    const currentProfile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const currentSkills = JSON.parse(currentProfile?.skills || '[]');

    // Calculate new skills that are not already present
    const currentSkillSet = new Set(currentSkills.map(s => s.toLowerCase()));
    const newDetectedSkills = parsed.skills.filter(s => !currentSkillSet.has(s.toLowerCase()));

    res.json({
      message: 'Resume parsed successfully. Please review and confirm before merging.',
      resumeId,
      filename: req.file.originalname,
      extracted: parsed,
      analysis: {
        totalSkillsFound: parsed.skills.length,
        newSkillsCount: newDetectedSkills.length,
        newSkills: newDetectedSkills,
        existingSkillsCount: currentSkills.length
      }
    });
  } catch (err) {
    console.error('Resume upload/parsing error:', err);
    res.status(500).json({ error: `Resume parsing failed: ${err.message}` });
  }
});

// POST /api/resume/merge
// Explicitly merges reviewed data into profile with user approval
router.post('/merge', authenticateToken, (req, res) => {
  try {
    const {
      skills = [],
      work_experience = [],
      education = [],
      projects = [],
      certifications = [],
      phone,
      linkedin_url,
      github_url,
      portfolio_url,
      mergeMode = 'merge' // 'merge' (combine) or 'replace'
    } = req.body;

    const currentProfile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    if (!currentProfile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    let finalSkills = [];
    let finalExperience = [];
    let finalEducation = [];
    let finalProjects = [];
    let finalCerts = [];

    if (mergeMode === 'merge') {
      const existingSkills = JSON.parse(currentProfile.skills || '[]');
      const skillSet = new Set(existingSkills.map(s => s.toLowerCase()));
      finalSkills = [...existingSkills];
      for (const s of skills) {
        if (!skillSet.has(s.toLowerCase())) {
          finalSkills.push(s);
          skillSet.add(s.toLowerCase());
        }
      }

      const existingExp = JSON.parse(currentProfile.work_experience || '[]');
      finalExperience = [...existingExp, ...work_experience];

      const existingEdu = JSON.parse(currentProfile.education || '[]');
      finalEducation = [...existingEdu, ...education];

      const existingProj = JSON.parse(currentProfile.projects || '[]');
      finalProjects = [...existingProj, ...projects];

      const existingCerts = JSON.parse(currentProfile.certifications || '[]');
      finalCerts = [...existingCerts, ...certifications];
    } else {
      finalSkills = skills;
      finalExperience = work_experience;
      finalEducation = education;
      finalProjects = projects;
      finalCerts = certifications;
    }

    db.run(`
      UPDATE profiles
      SET skills = ?,
          work_experience = ?,
          education = ?,
          projects = ?,
          certifications = ?,
          phone = CASE WHEN ? != '' THEN ? ELSE phone END,
          linkedin_url = CASE WHEN ? != '' THEN ? ELSE linkedin_url END,
          github_url = CASE WHEN ? != '' THEN ? ELSE github_url END,
          portfolio_url = CASE WHEN ? != '' THEN ? ELSE portfolio_url END,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      JSON.stringify(finalSkills),
      JSON.stringify(finalExperience),
      JSON.stringify(finalEducation),
      JSON.stringify(finalProjects),
      JSON.stringify(finalCerts),
      phone || '', phone || '',
      linkedin_url || '', linkedin_url || '',
      github_url || '', github_url || '',
      portfolio_url || '', portfolio_url || '',
      req.user.id
    ]);

    const updatedProfile = db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);

    res.json({
      message: 'Resume data merged successfully into profile.',
      profile: {
        ...updatedProfile,
        skills: JSON.parse(updatedProfile.skills || '[]'),
        work_experience: JSON.parse(updatedProfile.work_experience || '[]'),
        education: JSON.parse(updatedProfile.education || '[]'),
        projects: JSON.parse(updatedProfile.projects || '[]'),
        certifications: JSON.parse(updatedProfile.certifications || '[]')
      }
    });
  } catch (err) {
    console.error('Error merging resume data:', err);
    res.status(500).json({ error: 'Failed to merge resume into profile.' });
  }
});

// GET /api/resume/history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const resumes = db.all(`
      SELECT id, filename, file_size, created_at, parsed_data
      FROM resumes
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json(resumes.map(r => ({
      ...r,
      parsed_data: JSON.parse(r.parsed_data || '{}')
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resume history.' });
  }
});

module.exports = router;
