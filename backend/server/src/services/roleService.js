const db = require('../db/database');

class RoleService {
  getAllRoles() {
    const roles = db.all('SELECT * FROM roles ORDER BY id ASC');
    return roles.map(r => ({
      ...r,
      required_skills: JSON.parse(r.required_skills || '[]'),
      preferred_skills: JSON.parse(r.preferred_skills || '[]'),
      interview_focus: JSON.parse(r.interview_focus || '[]')
    }));
  }

  getRoleById(id) {
    const role = db.get('SELECT * FROM roles WHERE id = ?', [id]);
    if (!role) return null;
    return {
      ...role,
      required_skills: JSON.parse(role.required_skills || '[]'),
      preferred_skills: JSON.parse(role.preferred_skills || '[]'),
      interview_focus: JSON.parse(role.interview_focus || '[]')
    };
  }

  getRoleByTitle(title) {
    const role = db.get('SELECT * FROM roles WHERE LOWER(title) = LOWER(?)', [title]);
    if (!role) return null;
    return {
      ...role,
      required_skills: JSON.parse(role.required_skills || '[]'),
      preferred_skills: JSON.parse(role.preferred_skills || '[]'),
      interview_focus: JSON.parse(role.interview_focus || '[]')
    };
  }

  calculateRecommendations(candidateSkills = [], candidateExperienceYears = 0) {
    const roles = this.getAllRoles();
    const candidateSkillsLower = new Set(candidateSkills.map(s => s.toLowerCase()));

    const scoredRoles = roles.map(role => {
      const required = role.required_skills;
      const preferred = role.preferred_skills;

      const matchingRequired = required.filter(s => candidateSkillsLower.has(s.toLowerCase()));
      const missingRequired = required.filter(s => !candidateSkillsLower.has(s.toLowerCase()));

      const matchingPreferred = preferred.filter(s => candidateSkillsLower.has(s.toLowerCase()));
      const missingPreferred = preferred.filter(s => !candidateSkillsLower.has(s.toLowerCase()));

      // Weighted score: 75% required skills, 25% preferred skills
      const reqRatio = required.length > 0 ? matchingRequired.length / required.length : 0;
      const prefRatio = preferred.length > 0 ? matchingPreferred.length / preferred.length : 0;
      const matchScore = Math.min(100, Math.round((reqRatio * 75) + (prefRatio * 25)));

      // Priorities for preparation
      const priorities = missingRequired.slice(0, 3).map(skill => ({
        skill,
        importance: 'High',
        reason: 'Required foundational skill for this role'
      }));

      if (priorities.length < 3 && missingPreferred.length > 0) {
        priorities.push({
          skill: missingPreferred[0],
          importance: 'Medium',
          reason: 'Preferred modern technology to stand out'
        });
      }

      return {
        ...role,
        matchScore,
        matchingSkills: [...matchingRequired, ...matchingPreferred],
        missingSkills: [...missingRequired, ...missingPreferred],
        preparationPriorities: priorities
      };
    });

    // Sort descending by match score
    return scoredRoles.sort((a, b) => b.matchScore - a.matchScore);
  }

  getUserSelectedRoles(userId) {
    return db.all(
      'SELECT * FROM user_selected_roles WHERE user_id = ? ORDER BY is_primary DESC, created_at DESC',
      [userId]
    );
  }

  setUserSelectedRole(userId, roleTitle, isPrimary = false, matchScore = 0) {
    // If setting as primary, unset other primaries
    if (isPrimary) {
      db.run('UPDATE user_selected_roles SET is_primary = 0 WHERE user_id = ?', [userId]);
      // Also update target_role in profiles
      db.run('UPDATE profiles SET target_role = ? WHERE user_id = ?', [roleTitle, userId]);
    }

    const existing = db.get(
      'SELECT id FROM user_selected_roles WHERE user_id = ? AND LOWER(role_title) = LOWER(?)',
      [userId, roleTitle]
    );

    if (existing) {
      db.run(
        'UPDATE user_selected_roles SET is_primary = ?, match_score = ? WHERE id = ?',
        [isPrimary ? 1 : 0, matchScore, existing.id]
      );
      return existing.id;
    } else {
      const result = db.run(
        'INSERT INTO user_selected_roles (user_id, role_title, is_primary, match_score) VALUES (?, ?, ?, ?)',
        [userId, roleTitle, isPrimary ? 1 : 0, matchScore]
      );
      return result.lastInsertRowid;
    }
  }

  removeUserSelectedRole(userId, roleTitle) {
    db.run(
      'DELETE FROM user_selected_roles WHERE user_id = ? AND LOWER(role_title) = LOWER(?)',
      [userId, roleTitle]
    );
  }
}

module.exports = new RoleService();
