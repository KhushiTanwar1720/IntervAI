const db = require('../db/database');
const aiService = require('./aiService');

class InterviewService {
  async createSession({ userId, roleTitle, interviewType = 'technical', difficulty = 'Mid', durationMinutes = 30, totalQuestions = 5 }) {
    // Fetch user profile for context
    const profile = db.get('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    const userProfile = profile ? {
      ...profile,
      skills: JSON.parse(profile.skills || '[]')
    } : null;

    // Fetch user settings
    const userSettings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]) || {};

    // Generate initial questions via AI
    const questions = await aiService.generateInterviewQuestions({
      roleTitle,
      interviewType,
      difficulty,
      count: totalQuestions,
      userProfile,
      userSettings
    });

    // Create session in DB
    const sessionRes = db.run(`
      INSERT INTO interview_sessions (
        user_id, role_title, interview_type, difficulty, duration_minutes, status, total_questions, current_question_index
      ) VALUES (?, ?, ?, ?, ?, 'in_progress', ?, 0)
    `, [userId, roleTitle, interviewType, difficulty, durationMinutes, questions.length]);

    const sessionId = sessionRes.lastInsertRowid;

    // Insert questions
    const insertQ = db.prepare(`
      INSERT INTO interview_questions (
        session_id, question_index, question_text, question_category, expected_points
      ) VALUES (?, ?, ?, ?, ?)
    `);

    questions.forEach((q, idx) => {
      insertQ.run(
        sessionId,
        idx,
        q.question,
        q.category || 'General',
        JSON.stringify(q.expectedPoints || [])
      );
    });

    return this.getSessionById(sessionId, userId);
  }

  getSessionById(sessionId, userId) {
    const session = db.get(
      'SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );
    if (!session) return null;

    const questions = db.all(
      'SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_index ASC',
      [sessionId]
    );

    return {
      ...session,
      evaluation_summary: JSON.parse(session.evaluation_summary || '{}'),
      questions: questions.map(q => ({
        ...q,
        expected_points: JSON.parse(q.expected_points || '[]'),
        feedback: JSON.parse(q.feedback || '{}')
      }))
    };
  }

  async submitAnswer({ sessionId, questionId, userAnswer, answerDurationSeconds = 0, userId }) {
    const session = db.get('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
    if (!session) throw new Error('Interview session not found');

    const question = db.get('SELECT * FROM interview_questions WHERE id = ? AND session_id = ?', [questionId, sessionId]);
    if (!question) throw new Error('Question not found');

    const userSettings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]) || {};
    const expectedPoints = JSON.parse(question.expected_points || '[]');

    // Evaluate the answer
    const evalResult = await aiService.evaluateAnswer({
      question: question.question_text,
      userAnswer,
      expectedPoints,
      roleTitle: session.role_title,
      difficulty: session.difficulty,
      userSettings
    });

    // Update question in DB
    db.run(`
      UPDATE interview_questions
      SET user_answer = ?, answer_duration_seconds = ?, score = ?, feedback = ?, answered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userAnswer, answerDurationSeconds, evalResult.score, JSON.stringify(evalResult), questionId]);

    // Check if dynamic follow-up should be injected (for technical/system design if not already a follow-up and answer was substantive)
    let followUpCreated = false;
    const currentQuestions = db.all('SELECT * FROM interview_questions WHERE session_id = ?', [sessionId]);

    if (!question.is_follow_up && currentQuestions.length < session.total_questions + 2 && (evalResult.score < 70 || evalResult.score > 85)) {
      try {
        const followUp = await aiService.generateFollowUpQuestion({
          question: question.question_text,
          userAnswer,
          roleTitle: session.role_title,
          difficulty: session.difficulty,
          userSettings
        });

        if (followUp?.followUpQuestion) {
          const nextIndex = question.question_index + 1;
          // Shift indices of subsequent questions
          db.run(`
            UPDATE interview_questions
            SET question_index = question_index + 1
            WHERE session_id = ? AND question_index >= ?
          `, [sessionId, nextIndex]);

          // Insert follow-up question
          db.run(`
            INSERT INTO interview_questions (
              session_id, question_index, question_text, question_category, expected_points, is_follow_up, follow_up_reason
            ) VALUES (?, ?, ?, ?, ?, 1, ?)
          `, [
            sessionId,
            nextIndex,
            followUp.followUpQuestion,
            'Follow-up / Deep Dive',
            JSON.stringify(followUp.expectedPoints || []),
            followUp.reason || 'Probing nuance'
          ]);

          db.run('UPDATE interview_sessions SET total_questions = total_questions + 1 WHERE id = ?', [sessionId]);
          followUpCreated = true;
        }
      } catch (err) {
        console.warn('Follow up question injection skipped:', err.message);
      }
    }

    // Advance session current question index
    const updatedQuestions = db.all('SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_index ASC', [sessionId]);
    const nextUnansweredIndex = updatedQuestions.findIndex(q => !q.user_answer);

    if (nextUnansweredIndex === -1) {
      // All questions answered, finish session!
      await this.finishSession(sessionId, userId);
    } else {
      db.run('UPDATE interview_sessions SET current_question_index = ? WHERE id = ?', [nextUnansweredIndex, sessionId]);
    }

    return this.getSessionById(sessionId, userId);
  }

  async finishSession(sessionId, userId) {
    const session = db.get('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
    if (!session) throw new Error('Session not found');

    const questions = db.all('SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_index ASC', [sessionId]);
    const userSettings = db.get('SELECT * FROM user_settings WHERE user_id = ?', [userId]) || {};

    const finalReport = await aiService.generateFinalReport({
      session,
      questions,
      userSettings
    });

    db.run(`
      UPDATE interview_sessions
      SET status = 'completed', overall_score = ?, evaluation_summary = ?, completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [finalReport.overallScore, JSON.stringify(finalReport), sessionId]);

    return this.getSessionById(sessionId, userId);
  }

  getUserInterviewHistory(userId) {
    const sessions = db.all(`
      SELECT s.*, COUNT(q.id) as question_count, AVG(q.score) as calculated_avg
      FROM interview_sessions s
      LEFT JOIN interview_questions q ON s.id = q.session_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [userId]);

    return sessions.map(s => ({
      ...s,
      evaluation_summary: JSON.parse(s.evaluation_summary || '{}')
    }));
  }
}

module.exports = new InterviewService();
