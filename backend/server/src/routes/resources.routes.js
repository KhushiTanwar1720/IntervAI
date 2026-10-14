const express = require('express');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const resourceService = require('../services/resourceService');

const router = express.Router();

// GET /api/resources
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, type, search } = req.query;
    const resources = resourceService.getResources({
      category,
      type,
      search,
      userId: req.user?.id
    });
    res.json(resources);
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({ error: 'Failed to fetch learning resources.' });
  }
});

// GET /api/resources/bookmarks
router.get('/bookmarks', authenticateToken, (req, res) => {
  try {
    const bookmarks = resourceService.getUserBookmarks(req.user.id);
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookmarks.' });
  }
});

// POST /api/resources/:id/bookmark
router.post('/:id/bookmark', authenticateToken, (req, res) => {
  try {
    const result = resourceService.toggleBookmark(req.user.id, Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

// POST /api/resources/:id/complete
router.post('/:id/complete', authenticateToken, (req, res) => {
  try {
    const result = resourceService.toggleCompleted(req.user.id, Number(req.params.id));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle resource completion.' });
  }
});

module.exports = router;
