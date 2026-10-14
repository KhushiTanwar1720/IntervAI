import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, Send, X, CheckCircle2,
  ArrowRight, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [listening, setListening] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const questionStartRef = useRef(Date.now());
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const textareaRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    loadSession();
    return () => {
      stopCamera();
      clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (!lastFeedback) {
      tickRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - questionStartRef.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [lastFeedback, renderKey]);

  useEffect(() => {
    autoResize();
  }, [answer]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 520)}px`;
  }

  async function loadSession() {
    try {
      const data = await api.interview.getById(id);
      setSession(data);
      questionStartRef.current = Date.now();
      setElapsed(0);
      setLastFeedback(null);
      setAnswer('');
      setRenderKey(k => k + 1);
    } catch (err) {
      setLoadError(err.message || 'Failed to load interview session.');
    }
  }

  useEffect(() => {
    function handleKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (lastFeedback) {
          handleNext();
        } else {
          document.getElementById('submit-answer-btn')?.click();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastFeedback, answer]);

  function toggleListening() {
    if (!SpeechRecognitionAPI) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(prev => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function toggleCamera() {
    if (camOn) {
      stopCamera();
      setCamOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamOn(true);
    } catch {
      toast.error('Camera access was denied or is unavailable.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim()) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); }

    const currentQuestion = session.questions[session.current_question_index];
    const durationSeconds = Math.round((Date.now() - questionStartRef.current) / 1000);

    setSubmitting(true);
    try {
      const updated = await api.interview.submitAnswer(id, {
        questionId: currentQuestion.id,
        userAnswer: answer,
        answerDurationSeconds: durationSeconds
      });

      const answeredQ = updated.questions.find(q => q.id === currentQuestion.id);
      setLastFeedback(answeredQ?.feedback || null);
      setSession(updated);
      setAnswer('');

      if (updated.status === 'completed') {
        toast.success('Interview complete — generating your report.');
        setTimeout(() => navigate(`/interviews/${id}/report`), 1600);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setLastFeedback(null);
    questionStartRef.current = Date.now();
    setElapsed(0);
    setRenderKey(k => k + 1);
  }

  function confirmExit() {
    stopCamera();
    navigate('/interviews/history');
  }

  if (loadError && !session) {
    return (
      <div className="focus-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="empty-state"><p>{loadError}</p></div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="focus-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="section-subtitle">Preparing your interview...</div>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="focus-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card empty-state">
          <CheckCircle2 size={36} color="var(--accent-emerald)" />
          <p>Interview completed! Redirecting to your report...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[session.current_question_index];
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="focus-shell">
      <div className="focus-bar">
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExitConfirm(true)}>
          <X size={15} /> Exit
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-primary">{session.role_title}</span>
          <span className="badge badge-cyan" style={{ textTransform: 'capitalize' }}>{session.interview_type.replace('_', ' ')}</span>
          <span className="badge badge-amber">{session.difficulty}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {!lastFeedback && <span className="pulse-dot" />}
          <span className="focus-timer section-subtitle">{formatClock(elapsed)}</span>
        </div>
      </div>

      <div className="focus-body">
        <div style={{ width: '100%', maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {session.questions.map((q, i) => (
              <div key={q.id} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i < session.current_question_index ? 'var(--gradient-brand)'
                  : i === session.current_question_index ? 'var(--primary-glow)' : 'rgba(255,255,255,0.08)'
              }} />
            ))}
          </div>
          <p className="section-subtitle" style={{ marginBottom: '1.75rem', fontSize: '0.85rem' }}>
            Question {session.current_question_index + 1} of {session.questions.length}
          </p>

          {lastFeedback ? (
            <div key={renderKey} className="glass-card question-transition-enter">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="section-eyebrow" style={{ marginBottom: 0 }}>Feedback</span>
                <span className={`badge ${lastFeedback.score >= 70 ? 'badge-emerald' : lastFeedback.score >= 45 ? 'badge-amber' : 'badge-rose'}`}>
                  {lastFeedback.score}/100
                </span>
              </div>
              <p style={{ marginBottom: '1.1rem', fontSize: '1.02rem', color: 'var(--text-primary)' }}>{lastFeedback.correctness}</p>

              {lastFeedback.missingConcepts?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="section-subtitle" style={{ marginBottom: '0.4rem' }}>Missing Concepts</div>
                  <div className="tags-container">
                    {lastFeedback.missingConcepts.map((c, i) => <span key={i} className="badge badge-rose">{c}</span>)}
                  </div>
                </div>
              )}

              {lastFeedback.improvements?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="section-subtitle" style={{ marginBottom: '0.4rem' }}>Improvements</div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.88rem' }}>
                    {lastFeedback.improvements.map((imp, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{imp}</li>)}
                  </ul>
                </div>
              )}

              <div className="glass-card" style={{ background: 'rgba(99,102,241,0.08)', padding: '1rem' }}>
                <div className="section-subtitle" style={{ marginBottom: '0.4rem' }}>Model Answer</div>
                <p style={{ fontSize: '0.88rem' }}>{lastFeedback.modelAnswer}</p>
              </div>

              <button type="button" id="next-question-btn" className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleNext}>
                Continue <ArrowRight size={16} />
                <span className="kbd" style={{ marginLeft: '0.5rem' }}>Ctrl</span><span className="kbd">Enter</span>
              </button>
            </div>
          ) : (
            <>
              <div key={renderKey} className="glass-card question-transition-enter" style={{ marginBottom: '1.5rem' }}>
                {currentQuestion?.is_follow_up === 1 && (
                  <span className="badge badge-amber" style={{ marginBottom: '0.85rem' }}><Sparkles size={12} /> Follow-up Question</span>
                )}
                <p className="question-card">{currentQuestion?.question_text}</p>
                <div style={{ marginTop: '1rem' }}>
                  <span className="badge badge-primary">{currentQuestion?.question_category}</span>
                </div>

                {camOn && (
                  <video ref={videoRef} autoPlay muted style={{ width: 160, borderRadius: 'var(--radius-md)', marginTop: '1.25rem', border: '1px solid var(--border-subtle)' }} />
                )}
              </div>

              <form className="glass-card" onSubmit={handleSubmit}>
                <textarea
                  ref={textareaRef}
                  className="input-field answer-textarea"
                  style={{ minHeight: 140 }}
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer, or use the microphone..."
                  required
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.6rem 0 1.1rem' }}>
                  <span className="section-subtitle" style={{ fontSize: '0.78rem' }}>{wordCount} words</span>
                  <span className="section-subtitle" style={{ fontSize: '0.78rem' }}>
                    <span className="kbd">Ctrl</span> + <span className="kbd">Enter</span> to submit
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {SpeechRecognitionAPI && (
                      <button type="button" className={`btn ${listening ? 'btn-danger' : 'btn-secondary'} btn-sm`} onClick={toggleListening}>
                        {listening ? <MicOff size={15} /> : <Mic size={15} />} {listening ? 'Stop' : 'Voice Input'}
                      </button>
                    )}
                    <button type="button" className={`btn ${camOn ? 'btn-danger' : 'btn-secondary'} btn-sm`} onClick={toggleCamera}>
                      {camOn ? <VideoOff size={15} /> : <Video size={15} />} {camOn ? 'Stop Camera' : 'Camera Preview'}
                    </button>
                  </div>
                  <button type="submit" id="submit-answer-btn" className="btn btn-primary" disabled={submitting}>
                    <Send size={16} /> {submitting ? 'Evaluating...' : 'Submit Answer'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {showExitConfirm && (
        <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="modal-dialog" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Leave this interview?</h3>
            </div>
            <div className="modal-body">
              <p>Your answers so far are already saved. You can resume this session later from Interview History.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowExitConfirm(false)}>Stay</button>
              <button type="button" className="btn btn-danger" onClick={confirmExit}>Leave Interview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
