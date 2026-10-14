const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

function calculateRoadmapProgress(roadmapId, userId) {
  const stats = db.get(`
    SELECT COUNT(*) as total, SUM(is_completed) as completed
    FROM roadmap_tasks
    WHERE roadmap_id = ? AND user_id = ?
  `, [roadmapId, userId]);

  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  db.run('UPDATE roadmaps SET overall_progress = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [progressPercent, roadmapId]);
  return { total, completed, progressPercent };
}

// GET /api/roadmap
router.get('/', authenticateToken, (req, res) => {
  try {
    let roadmap = db.get(
      'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [req.user.id]
    );

    if (!roadmap) {
      // Auto-generate initial roadmap based on user's target role in profile
      const profile = db.get('SELECT target_role FROM profiles WHERE user_id = ?', [req.user.id]);
      const targetRole = profile?.target_role || 'Full Stack Developer';

      const plan = aiService.generateRoadmap({
        targetRole,
        targetDeadlineWeeks: 4,
        dailyHours: 2.0
      });

      const insertRoadmap = db.run(`
        INSERT INTO roadmaps (user_id, target_role, target_deadline_weeks, daily_hours, overall_progress, milestones)
        VALUES (?, ?, ?, ?, 0, ?)
      `, [
        req.user.id,
        targetRole,
        plan.targetDeadlineWeeks,
        plan.dailyHours,
        JSON.stringify(plan.milestones)
      ]);

      const roadmapId = insertRoadmap.lastInsertRowid;

      // Insert all milestone tasks
      const insertTask = db.prepare(`
        INSERT INTO roadmap_tasks (
          roadmap_id, user_id, milestone_id, title, description, category, priority, is_completed, due_week
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);

      for (const m of plan.milestones) {
        for (const t of m.tasks) {
          insertTask.run(
            roadmapId,
            req.user.id,
            m.id,
            t.title,
            t.description,
            t.category,
            t.priority,
            t.dueWeek
          );
        }
      }

      roadmap = db.get('SELECT * FROM roadmaps WHERE id = ?', [roadmapId]);
    }

    const tasks = db.all(
      'SELECT * FROM roadmap_tasks WHERE roadmap_id = ? AND user_id = ? ORDER BY due_week ASC, id ASC',
      [roadmap.id, req.user.id]
    );

    const progress = calculateRoadmapProgress(roadmap.id, req.user.id);

    res.json({
      ...roadmap,
      milestones: JSON.parse(roadmap.milestones || '[]'),
      tasks: tasks.map(t => ({
        ...t,
        is_completed: Boolean(t.is_completed),
        resource_links: JSON.parse(t.resource_links || '[]')
      })),
      progress
    });
  } catch (err) {
    console.error('Error fetching roadmap:', err);
    res.status(500).json({ error: 'Failed to fetch roadmap.' });
  }
});

// POST /api/roadmap/generate
router.post('/generate', authenticateToken, (req, res) => {
  try {
    const { targetRole, targetDeadlineWeeks = 4, dailyHours = 2, skillGaps = [] } = req.body;
    const role = targetRole || 'Full Stack Developer';

    const plan = aiService.generateRoadmap({
      targetRole: role,
      targetDeadlineWeeks: Number(targetDeadlineWeeks) || 4,
      dailyHours: Number(dailyHours) || 2,
      skillGaps
    });

    const insertRoadmap = db.run(`
      INSERT INTO roadmaps (user_id, target_role, target_deadline_weeks, daily_hours, overall_progress, milestones)
      VALUES (?, ?, ?, ?, 0, ?)
    `, [
      req.user.id,
      role,
      plan.targetDeadlineWeeks,
      plan.dailyHours,
      JSON.stringify(plan.milestones)
    ]);

    const roadmapId = insertRoadmap.lastInsertRowid;

    // Insert tasks
    const insertTask = db.prepare(`
      INSERT INTO roadmap_tasks (
        roadmap_id, user_id, milestone_id, title, description, category, priority, is_completed, due_week
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    for (const m of plan.milestones) {
      for (const t of m.tasks) {
        insertTask.run(
          roadmapId,
          req.user.id,
          m.id,
          t.title,
          t.description,
          t.category,
          t.priority,
          t.dueWeek
        );
      }
    }

    const tasks = db.all(
      'SELECT * FROM roadmap_tasks WHERE roadmap_id = ? AND user_id = ? ORDER BY due_week ASC, id ASC',
      [roadmapId, req.user.id]
    );

    res.json({
      message: 'Personalized roadmap created successfully',
      roadmap: {
        id: roadmapId,
        target_role: role,
        target_deadline_weeks: plan.targetDeadlineWeeks,
        daily_hours: plan.dailyHours,
        overall_progress: 0,
        milestones: plan.milestones,
        tasks: tasks.map(t => ({
          ...t,
          is_completed: Boolean(t.is_completed),
          resource_links: JSON.parse(t.resource_links || '[]')
        }))
      }
    });
  } catch (err) {
    console.error('Error generating roadmap:', err);
    res.status(500).json({ error: 'Failed to generate roadmap.' });
  }
});

// PATCH /api/roadmap/tasks/:id/toggle
router.patch('/tasks/:id/toggle', authenticateToken, (req, res) => {
  try {
    const task = db.get('SELECT * FROM roadmap_tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const newStatus = task.is_completed ? 0 : 1;
    const completedAt = newStatus ? 'CURRENT_TIMESTAMP' : 'NULL';

    db.run(`
      UPDATE roadmap_tasks
      SET is_completed = ?, completed_at = ${completedAt}
      WHERE id = ?
    `, [newStatus, task.id]);

    const progress = calculateRoadmapProgress(task.roadmap_id, req.user.id);

    res.json({
      taskId: task.id,
      isCompleted: Boolean(newStatus),
      progress
    });
  } catch (err) {
    console.error('Error toggling task:', err);
    res.status(500).json({ error: 'Failed to toggle task completion.' });
  }
});

module.exports = router;
