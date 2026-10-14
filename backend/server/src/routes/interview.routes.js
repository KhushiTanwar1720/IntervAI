const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const interviewService = require('../services/interviewService');

const router = express.Router();

// POST /api/interview/create
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      roleTitle = 'Full Stack Developer',
      interviewType = 'technical',
      difficulty = 'Mid',
      durationMinutes = 30,
      totalQuestions = 5
    } = req.body;

    const session = await interviewService.createSession({
      userId: req.user.id,
      roleTitle,
      interviewType,
      difficulty,
      durationMinutes: Number(durationMinutes) || 30,
      totalQuestions: Number(totalQuestions) || 5
    });

    res.status(201).json(session);
  } catch (err) {
    console.error('Error starting interview session:', err);
    res.status(500).json({ error: `Failed to create interview session: ${err.message}` });
  }
});

// GET /api/interview/history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const history = interviewService.getUserInterviewHistory(req.user.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve interview history.' });
  }
});

// GET /api/interview/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const session = interviewService.getSessionById(Number(req.params.id), req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session details.' });
  }
});

// POST /api/interview/:id/answer
router.post('/:id/answer', authenticateToken, async (req, res) => {
  try {
    const { questionId, userAnswer, answerDurationSeconds = 0 } = req.body;
    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required.' });
    }
    if (!userAnswer || userAnswer.trim().length === 0) {
      return res.status(400).json({ error: 'userAnswer cannot be empty.' });
    }

    const updatedSession = await interviewService.submitAnswer({
      sessionId: Number(req.params.id),
      questionId: Number(questionId),
      userAnswer,
      answerDurationSeconds: Number(answerDurationSeconds) || 0,
      userId: req.user.id
    });

    res.json(updatedSession);
  } catch (err) {
    console.error('Error submitting answer:', err);
    res.status(500).json({ error: `Failed to submit answer: ${err.message}` });
  }
});

// POST /api/interview/:id/finish
router.post('/:id/finish', authenticateToken, async (req, res) => {
  try {
    const completedSession = await interviewService.finishSession(Number(req.params.id), req.user.id);
    res.json(completedSession);
  } catch (err) {
    console.error('Error completing session:', err);
    res.status(500).json({ error: `Failed to finalize interview: ${err.message}` });
  }
});

module.exports = router;
