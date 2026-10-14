const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const roleService = require('../services/roleService');

const router = express.Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Profile information
    const user = db.get('SELECT id, email, name, headline FROM users WHERE id = ?', [userId]);
    const profile = db.get('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const userSkills = profile ? JSON.parse(profile.skills || '[]') : [];

    // 2. Selected roles & Target role
    const selectedRoles = roleService.getUserSelectedRoles(userId);
    const targetRole = profile?.target_role || 'Full Stack Developer';

    // 3. Active Roadmap progress
    const roadmap = db.get('SELECT * FROM roadmaps WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
    let roadmapStats = { totalTasks: 0, completedTasks: 0, progressPercent: 0 };
    if (roadmap) {
      const taskCounts = db.get(`
        SELECT COUNT(*) as total, SUM(is_completed) as completed
        FROM roadmap_tasks
        WHERE roadmap_id = ? AND user_id = ?
      `, [roadmap.id, userId]);
      const total = taskCounts?.total || 0;
      const completed = taskCounts?.completed || 0;
      roadmapStats = {
        totalTasks: total,
        completedTasks: completed,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }

    // 4. Interview performance metrics
    const sessions = db.all(`
      SELECT id, role_title, interview_type, difficulty, overall_score, status, created_at, completed_at
      FROM interview_sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY completed_at ASC
    `, [userId]);

    const totalInterviewsCompleted = sessions.length;
    const avgScore = totalInterviewsCompleted > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalInterviewsCompleted)
      : 0;

    // Performance trends over time
    const performanceTrend = sessions.map(s => ({
      id: s.id,
      date: new Date(s.completed_at || s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: s.overall_score,
      role: s.role_title,
      type: s.interview_type
    }));

    // 5. Skill gap analysis for active target role
    const roleRecord = roleService.getRoleByTitle(targetRole) || roleService.getRoleByTitle('Full Stack Developer');
    const requiredSkills = roleRecord?.required_skills || [];
    const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));

    const matchingSkills = requiredSkills.filter(s => userSkillSet.has(s.toLowerCase()));
    const missingSkills = requiredSkills.filter(s => !userSkillSet.has(s.toLowerCase()));
    const roleMatchPercent = requiredSkills.length > 0 
      ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
      : 0;

    // 6. Curated Next Actions based on actual data
    const nextActions = [];
    if (!profile || (profile.completeness_score || 0) < 60) {
      nextActions.push({
        id: 'complete_profile',
        title: 'Complete Your Career Profile',
        description: 'Upload your resume or add your education and projects to achieve >75% profile completeness.',
        link: '/profile',
        badge: 'Priority'
      });
    }

    if (missingSkills.length > 0) {
      nextActions.push({
        id: 'study_gaps',
        title: `Bridge Skill Gaps in ${missingSkills.slice(0, 2).join(' & ')}`,
        description: 'Check out verified learning resources and practice tutorials tailored for these topics.',
        link: '/resources',
        badge: 'Learning'
      });
    }

    if (totalInterviewsCompleted === 0) {
      nextActions.push({
        id: 'first_interview',
        title: 'Take Your First AI Mock Interview',
        description: `Simulate a realistic 15-minute technical session for ${targetRole}.`,
        link: '/interviews/new',
        badge: 'Practice'
      });
    } else {
      nextActions.push({
        id: 'next_interview',
        title: 'Practice a System Design or Behavioral Round',
        description: 'Broaden your interview skills with specialized behavioral or architectural rounds.',
        link: '/interviews/new',
        badge: 'Challenge'
      });
    }

    res.json({
      user,
      targetRole,
      profileCompleteness: profile?.completeness_score || 0,
      skillsCount: userSkills.length,
      selectedRolesCount: selectedRoles.length,
      roadmap: roadmapStats,
      interviews: {
        totalCompleted: totalInterviewsCompleted,
        averageScore: avgScore,
        recentSessions: sessions.slice(-5).reverse(),
        performanceTrend
      },
      skillGaps: {
        roleTitle: targetRole,
        matchPercent: roleMatchPercent,
        matchingSkills,
        missingSkills
      },
      nextActions
    });
  } catch (err) {
    console.error('Error fetching analytics dashboard:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics dashboard.' });
  }
});

module.exports = router;
