const db = require('../db/database');

class ResourceService {
  getResources({ category, type, search, userId } = {}) {
    let sql = `
      SELECT r.*, 
        COALESCE(ur.is_bookmarked, 0) as is_bookmarked,
        COALESCE(ur.is_completed, 0) as is_completed,
        COALESCE(ur.notes, '') as user_notes
      FROM resources r
      LEFT JOIN user_resources ur ON r.id = ur.resource_id AND ur.user_id = ?
      WHERE 1=1
    `;
    const params = [userId || -1];

    if (category && category !== 'All') {
      sql += ' AND r.category = ?';
      params.push(category);
    }

    if (type && type !== 'All') {
      sql += ' AND r.type = ?';
      params.push(type);
    }

    if (search) {
      sql += ' AND (LOWER(r.title) LIKE ? OR LOWER(r.description) LIKE ? OR LOWER(r.tags) LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY r.id ASC';

    const rows = db.all(sql, params);
    return rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      is_bookmarked: Boolean(r.is_bookmarked),
      is_completed: Boolean(r.is_completed)
    }));
  }

  toggleBookmark(userId, resourceId) {
    const existing = db.get(
      'SELECT id, is_bookmarked FROM user_resources WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );

    if (existing) {
      const newStatus = existing.is_bookmarked ? 0 : 1;
      db.run(
        'UPDATE user_resources SET is_bookmarked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, existing.id]
      );
      return { isBookmarked: Boolean(newStatus) };
    } else {
      db.run(
        'INSERT INTO user_resources (user_id, resource_id, is_bookmarked, is_completed) VALUES (?, ?, 1, 0)',
        [userId, resourceId]
      );
      return { isBookmarked: true };
    }
  }

  toggleCompleted(userId, resourceId) {
    const existing = db.get(
      'SELECT id, is_completed FROM user_resources WHERE user_id = ? AND resource_id = ?',
      [userId, resourceId]
    );

    if (existing) {
      const newStatus = existing.is_completed ? 0 : 1;
      db.run(
        'UPDATE user_resources SET is_completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, existing.id]
      );
      return { isCompleted: Boolean(newStatus) };
    } else {
      db.run(
        'INSERT INTO user_resources (user_id, resource_id, is_bookmarked, is_completed) VALUES (?, ?, 0, 1)',
        [userId, resourceId]
      );
      return { isCompleted: true };
    }
  }

  getUserBookmarks(userId) {
    const sql = `
      SELECT r.*, 1 as is_bookmarked, COALESCE(ur.is_completed, 0) as is_completed
      FROM resources r
      INNER JOIN user_resources ur ON r.id = ur.resource_id
      WHERE ur.user_id = ? AND ur.is_bookmarked = 1
      ORDER BY ur.updated_at DESC
    `;
    const rows = db.all(sql, [userId]);
    return rows.map(r => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      is_bookmarked: true,
      is_completed: Boolean(r.is_completed)
    }));
  }
}

module.exports = new ResourceService();
