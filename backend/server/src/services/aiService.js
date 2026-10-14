const config = require('../config');

// Question bank organized by role, type, and difficulty for robust local intelligence
const LOCAL_QUESTION_BANK = {
  'Full Stack Developer': {
    technical: [
      {
        question: "Explain the critical differences between optimistic updates and pessimistic updates in a modern web application with React and Node.js. When would you prefer each?",
        expectedPoints: ["Optimistic UI updates state immediately before server confirmation", "Pessimistic waits for API response before updating UI", "Rollback handling and error recovery on network failure", "High latency or financial transaction trade-offs"],
        category: "Frontend Architecture & API"
      },
      {
        question: "How does the Node.js event loop work, specifically with regards to the Microtask queue (Promises) vs Macrotask queue (setTimeout, setImmediate)?",
        expectedPoints: ["Call stack execution and event loop phases", "Microtasks (process.nextTick, Promise.then) drain after every macrotask", "Macrotask queue priority (Timers, Poll, Check)", "Avoiding starvation and long-running blocking CPU tasks"],
        category: "Backend Runtimes"
      },
      {
        question: "What strategies do you employ for database indexing in SQL when dealing with slow JOIN queries on large tables?",
        expectedPoints: ["B-Tree indexing on foreign key and filter columns", "Composite indexes and leftmost prefix rule", "EXPLAIN / EXPLAIN ANALYZE execution plan inspection", "Index selectivity, table scans vs index scans, write overhead"],
        category: "Databases & Performance"
      },
      {
        question: "How do you securely store and authenticate users using JWTs and refresh tokens? What are the vulnerability vectors with LocalStorage vs HttpOnly cookies?",
        expectedPoints: ["XSS risks of LocalStorage", "CSRF risks with cookies and SameSite / CSRF token mitigation", "Short-lived access tokens (15m) + long-lived rotating refresh tokens in HttpOnly Secure cookies", "Token revocation and blacklisting via Redis"],
        category: "Web Security"
      },
      {
        question: "Explain Server-Side Rendering (SSR), Client-Side Rendering (CSR), and Incremental Static Regeneration (ISR). How do you choose between them?",
        expectedPoints: ["SEO advantages and Time To First Byte (TTFB) vs Time to Interactive (TTI)", "Hydration overhead in SSR", "CDN caching and on-demand revalidation in ISR", "Use-case tradeoffs: dashboards vs e-commerce vs blogs"],
        category: "Rendering Patterns"
      }
    ],
    coding: [
      {
        question: "Write an efficient function to implement an LRU (Least Recently Used) Cache with O(1) get and put time complexity. What data structures do you combine?",
        expectedPoints: ["Hash map for O(1) lookup", "Doubly linked list for O(1) node insertion and removal", "Handling capacity limits by evicting tail/head", "Updating node positions upon access"],
        category: "Data Structures"
      },
      {
        question: "How would you implement a custom debounced function in JavaScript/TypeScript from scratch with immediate/leading execution support?",
        expectedPoints: ["Closure maintaining timer ID", "Clearing previous timeout on subsequent invocations", "Preserving this context and arguments", "Leading vs trailing edge execution flags"],
        category: "JavaScript Algorithms"
      }
    ],
    system_design: [
      {
        question: "Design a real-time collaborative document editing service (like Google Docs). How do you handle concurrent edits and conflict resolution?",
        expectedPoints: ["Operational Transformation (OT) vs CRDTs (Conflict-free Replicated Data Types)", "WebSockets / WebRTC for bidirectional real-time synchronization", "Centralized coordinator vs peer-to-peer gossip", "Persistence to document storage and snapshotting"],
        category: "System Design"
      },
      {
        question: "Design an API rate limiter to protect backend microservices from DDoS and abuse. How do you implement it across a distributed cluster?",
        expectedPoints: ["Token bucket, Leaky bucket, or Sliding window counter algorithms", "Redis distributed cache using atomic Lua scripts or Redis cell", "HTTP 429 status code with Retry-After and X-RateLimit headers", "Client identification: API key, IP address, user token"],
        category: "Scalability & Distributed Systems"
      }
    ],
    behavioral: [
      {
        question: "Tell me about a time you had a technical disagreement with a teammate or senior engineer. How did you resolve it and what was the outcome?",
        expectedPoints: ["Clear context using STAR method", "Focus on data, benchmarks, and objective trade-offs rather than ego", "Respectful active listening and consensus building", "Reflection and lasting relationship impact"],
        category: "Collaboration & Conflict"
      },
      {
        question: "Describe a production outage or critical bug you were responsible for or helped diagnose under high pressure. What steps did you take?",
        expectedPoints: ["Immediate triage, rollback, or mitigation before root-cause deep dive", "Transparent communication with stakeholders", "Post-mortem / blameless retrospective analysis", "Long-term monitoring and preventive regression tests implemented"],
        category: "Ownership & Crisis Management"
      }
    ]
  },
  'Frontend Engineer': {
    technical: [
      {
        question: "Explain the browser critical rendering path from HTML byte parsing to pixels painted on the screen. How do you optimize Core Web Vitals (LCP, FID/INP, CLS)?",
        expectedPoints: ["DOM + CSSOM construction -> Render Tree -> Layout (Reflow) -> Paint -> Composite", "LCP optimization (preload, modern image formats, server-timing)", "CLS prevention (dimensions on media, avoiding dynamic layout injection)", "INP (Interaction to Next Paint) by avoiding long main-thread tasks"],
        category: "Web Performance"
      },
      {
        question: "How does React's Reconciliation and Fiber architecture work? How does React 18 Concurrent Mode schedule render priorities?",
        expectedPoints: ["Fiber nodes as units of work that can be paused, resumed, or discarded", "Two passes: render/reconciliation (asynchronous) and commit (synchronous)", "useTransition and useDeferredValue for priority scheduling", "Synthetic event delegation"],
        category: "React Internals"
      },
      {
        question: "What are CSS Stacking Contexts and how does z-index resolve across nested transformed or opacity-altered elements?",
        expectedPoints: ["Creation of new stacking context (transform, opacity, filter, position + z-index)", "Parent isolation prevents child from breaking out of parent z-index order", "Debugging stacking issues with DevTools layers panel"],
        category: "CSS Architecture"
      }
    ],
    behavioral: [
      {
        question: "Tell me about a time you had to push back on a product manager or designer because a feature had severe performance or accessibility implications.",
        expectedPoints: ["Constructive dialogue proposing viable alternative designs", "Accessibility (WCAG 2.1) compliance as a non-negotiable standard", "Demonstrating performance metrics or lighthouse audits to justify stance", "Successful compromise achieving business goals"],
        category: "Cross-functional Collaboration"
      }
    ]
  },
  'Backend Engineer': {
    technical: [
      {
        question: "Explain the CAP theorem and PACELC theorem. In a distributed key-value store, give real-world examples of CP vs AP systems.",
        expectedPoints: ["Consistency, Availability, Partition tolerance trade-off", "PACELC: If partition (Availability vs Consistency) Else (Latency vs Consistency)", "Examples: ZooKeeper/HBase (CP) vs Cassandra/Dynamo (AP)", "Eventual consistency vs strong linearizable consistency"],
        category: "Distributed Systems"
      },
      {
        question: "What are the common concurrency pitfalls in multi-threaded or asynchronous database transactions (Dirty Read, Non-repeatable Read, Phantom Read)? How do isolation levels solve them?",
        expectedPoints: ["Read Uncommitted, Read Committed, Repeatable Read, Serializable", "Two-Phase Locking (2PL) vs Multi-Version Concurrency Control (MVCC)", "Deadlock detection and resolution", "Performance penalties of serializable isolation"],
        category: "Database Transactions"
      }
    ],
    system_design: [
      {
        question: "Design a notification service that sends millions of SMS, email, and push notifications reliably without duplicates.",
        expectedPoints: ["Message queues (Kafka / RabbitMQ) with consumer groups", "Idempotency keys and deduplication filters", "Third-party gateway rate limiting and fallback providers", "Dead letter queues (DLQ) and exponential backoff retry mechanisms"],
        category: "System Design"
      }
    ],
    behavioral: [
      {
        question: "Describe a complex refactor of a legacy service you championed. How did you ensure zero downtime and prevent data corruption?",
        expectedPoints: ["Strangler fig pattern or shadow traffic testing", "Comprehensive unit/integration regression suite", "Feature flags and phased canary rollouts", "Measurable performance or maintenance outcomes"],
        category: "Technical Leadership"
      }
    ]
  }
};

// Generic fallback questions for any role/type
const GENERIC_QUESTIONS = {
  technical: [
    {
      question: "What are the core architectural principles you follow when structuring an enterprise-grade application for maintainability and scale?",
      expectedPoints: ["Separation of concerns and modularity", "Clean dependency management and inversion of control", "Robust error boundaries and observability", "Automated testing and CI/CD pipelines"],
      category: "Architecture"
    },
    {
      question: "How do you identify, profile, and eliminate performance bottlenecks across the stack?",
      expectedPoints: ["Benchmarking with profiling tools", "Database query optimization and index analysis", "Network latency reduction, payload minimization, and caching", "Memory leak detection and garbage collection tuning"],
      category: "Performance"
    }
  ],
  behavioral: [
    {
      question: "Describe a project where you had to learn an unfamiliar technology or domain in a tight timeframe. What was your learning strategy?",
      expectedPoints: ["Deconstructing fundamentals and building proof-of-concept prototypes", "Studying official documentation and reputable source code", "Seeking domain guidance from experienced peers", "Delivering within deadline with high quality"],
      category: "Adaptability"
    },
    {
      question: "Give an example of a time a project was slipping behind schedule. How did you handle scope, stakeholders, and delivery?",
      expectedPoints: ["Proactive, early transparent stakeholder communication", "Ruthless prioritization of core MVP requirements (MoSCoW method)", "Shielding the team from thrash and renegotiating delivery milestones", "Lessons learned in sprint estimation"],
      category: "Execution & Prioritization"
    }
  ],
  system_design: [
    {
      question: "How would you design a scalable URL shortener service (like TinyURL) handling 100 million write requests per day?",
      expectedPoints: ["Base62 encoding or pre-generated unique ID hashing (Snowflake)", "Database schema choice (NoSQL / SQL) and replication", "Read vs write ratio caching using Redis", "High availability and geo-distributed load balancing"],
      category: "System Design"
    }
  ],
  coding: [
    {
      question: "Explain how you would detect a cycle in a singly linked list with O(1) space complexity. How do you find the node where the cycle begins?",
      expectedPoints: ["Floyd's Tortoise and Hare (slow & fast pointer) algorithm", "Fast moves 2 steps, slow moves 1 step; collision indicates cycle", "Resetting one pointer to head and moving both 1 step to find cycle origin", "Mathematical proof of the cycle starting point"],
      category: "Algorithms"
    }
  ],
  hr: [
    {
      question: "Why are you interested in this role and what unique strengths do you bring to our team?",
      expectedPoints: ["Alignment between company mission and personal career trajectory", "Specific technical competencies and proven track record", "Collaborative culture and continuous growth mindset"],
      category: "Motivation & Cultural Fit"
    },
    {
      question: "Where do you see yourself professionally in the next 2 to 3 years?",
      expectedPoints: ["Concrete technical mastery and domain specialization", "Taking on mentorship or architectural leadership responsibilities", "Continuous commitment to industry advancements"],
      category: "Career Vision"
    }
  ]
};

class AIService {
  constructor() {
    this.geminiApiKey = config.GEMINI_API_KEY;
    this.openaiApiKey = config.OPENAI_API_KEY;
    this.defaultProvider = config.DEFAULT_AI_PROVIDER;
  }

  getEffectiveConfig(userSettings = {}) {
    const provider = userSettings.ai_provider || this.defaultProvider;
    const geminiKey = userSettings.gemini_api_key || this.geminiApiKey;
    const openaiKey = userSettings.openai_api_key || this.openaiApiKey;
    return { provider, geminiKey, openaiKey };
  }

  async callGemini(prompt, systemInstruction, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('No candidate content returned from Gemini');
    return candidate;
  }

  async callOpenAI(prompt, systemInstruction, apiKey) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  parseJSONSafe(text) {
    try {
      // Clean markdown code blocks if present
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      return null;
    }
  }

  // Generate a tailored list of questions for an interview session
  async generateInterviewQuestions({ roleTitle, interviewType, difficulty, count = 5, userProfile, userSettings }) {
    const { provider, geminiKey, openaiKey } = this.getEffectiveConfig(userSettings);

    const prompt = `Generate ${count} high-caliber interview questions for a ${difficulty} level ${roleTitle} candidate.
Interview Type: ${interviewType}.
Target candidate profile skills: ${userProfile?.skills ? JSON.stringify(userProfile.skills) : 'Standard industry profile'}.
Output must be a valid JSON array of objects with structure:
[
  {
    "question": "string",
    "category": "string",
    "expectedPoints": ["point 1", "point 2", "point 3"]
  }
]
Do not wrap in markdown or explanation.`;

    if (provider === 'gemini' && geminiKey) {
      try {
        const raw = await this.callGemini(prompt, 'You are an elite principal technical interviewer.', geminiKey);
        const parsed = this.parseJSONSafe(raw);
        if (Array.isArray(parsed) && parsed.length >= count) return parsed.slice(0, count);
      } catch (err) {
        console.warn('Gemini question generation failed, falling back to local engine:', err.message);
      }
    } else if (provider === 'openai' && openaiKey) {
      try {
        const raw = await this.callOpenAI(prompt, 'You are an elite principal technical interviewer.', openaiKey);
        const parsed = this.parseJSONSafe(raw);
        if (Array.isArray(parsed) && parsed.length >= count) return parsed.slice(0, count);
      } catch (err) {
        console.warn('OpenAI question generation failed, falling back to local engine:', err.message);
      }
    }

    // Local Intelligent Engine
    const roleBank = LOCAL_QUESTION_BANK[roleTitle] || LOCAL_QUESTION_BANK['Full Stack Developer'];
    const typeQuestions = roleBank[interviewType] || GENERIC_QUESTIONS[interviewType] || GENERIC_QUESTIONS['technical'];
    
    const questions = [...typeQuestions];
    // If not enough questions, complement from generic
    if (questions.length < count) {
      const complement = GENERIC_QUESTIONS[interviewType] || GENERIC_QUESTIONS['technical'];
      for (const q of complement) {
        if (!questions.some(existing => existing.question === q.question)) {
          questions.push(q);
        }
      }
    }

    return questions.slice(0, count).map((q, idx) => ({
      question: q.question,
      category: q.category || 'Core Competency',
      expectedPoints: q.expectedPoints || ['Clear logical explanation', 'Mention of real-world tradeoffs', 'Accurate technical terminology']
    }));
  }

  // Dynamic follow-up question based on user answer
  async generateFollowUpQuestion({ question, userAnswer, roleTitle, difficulty, userSettings }) {
    const { provider, geminiKey, openaiKey } = this.getEffectiveConfig(userSettings);

    const prompt = `The candidate was asked: "${question}"
The candidate answered: "${userAnswer}"
For a ${difficulty} ${roleTitle} interview, formulate ONE sharp, insightful follow-up question that challenges a missed edge case, asks for deeper implementation nuance, or tests real-world trade-offs.
Output JSON:
{
  "followUpQuestion": "string",
  "reason": "string",
  "expectedPoints": ["point 1", "point 2"]
}`;

    if (provider === 'gemini' && geminiKey) {
      try {
        const raw = await this.callGemini(prompt, 'You are an expert AI interviewer generating adaptive follow-ups.', geminiKey);
        const parsed = this.parseJSONSafe(raw);
        if (parsed?.followUpQuestion) return parsed;
      } catch (err) {
        console.warn('Gemini follow-up failed, using local engine:', err.message);
      }
    } else if (provider === 'openai' && openaiKey) {
      try {
        const raw = await this.callOpenAI(prompt, 'You are an expert AI interviewer generating adaptive follow-ups.', openaiKey);
        const parsed = this.parseJSONSafe(raw);
        if (parsed?.followUpQuestion) return parsed;
      } catch (err) {
        console.warn('OpenAI follow-up failed, using local engine:', err.message);
      }
    }

    // Local follow-up heuristic
    const words = (userAnswer || '').trim().split(/\s+/).length;
    let followUp = '';
    let reason = '';

    if (words < 20) {
      followUp = `Could you elaborate more on the specific architectural trade-offs or underlying mechanisms involved in this scenario?`;
      reason = 'Candidate answer was brief; probing for deeper technical justification.';
    } else if (/cache|redis|memory/i.test(userAnswer) && !/eviction|ttl|invalidation/i.test(userAnswer)) {
      followUp = `You mentioned caching. How would you handle cache invalidation and race conditions if multiple concurrent workers update the data?`;
      reason = 'Probing for concurrency and cache invalidation strategies.';
    } else if (/database|sql|index/i.test(userAnswer) && !/transaction|acid|lock/i.test(userAnswer)) {
      followUp = `Under high-write throughput, how would your approach impact transaction locks and write contention?`;
      reason = 'Testing transaction isolation and lock contention awareness.';
    } else {
      followUp = `What is the biggest operational risk or failure mode you would anticipate with this approach, and how would you monitor it in production?`;
      reason = 'Testing operational readiness and reliability engineering mindset.';
    }

    return {
      followUpQuestion: followUp,
      reason,
      expectedPoints: ['Edge case identification', 'Concrete mitigation strategy', 'Production observability']
    };
  }

  // Evaluate candidate answer with rubric and actionable feedback
  async evaluateAnswer({ question, userAnswer, expectedPoints = [], roleTitle, difficulty, userSettings }) {
    const { provider, geminiKey, openaiKey } = this.getEffectiveConfig(userSettings);

    const prompt = `Evaluate the candidate's interview answer.
Role: ${roleTitle} (${difficulty} level)
Question: "${question}"
Expected Key Points: ${JSON.stringify(expectedPoints)}
Candidate Answer: "${userAnswer}"

Output ONLY valid JSON:
{
  "score": number (0-100),
  "correctness": "string (1-2 sentences)",
  "missingConcepts": ["string", "string"],
  "mistakes": ["string"],
  "improvements": ["actionable advice 1", "actionable advice 2"],
  "modelAnswer": "A concise, elite response exemplifying a senior engineer answer."
}`;

    if (provider === 'gemini' && geminiKey) {
      try {
        const raw = await this.callGemini(prompt, 'You are an objective, encouraging, and rigorous technical evaluator.', geminiKey);
        const parsed = this.parseJSONSafe(raw);
        if (parsed && typeof parsed.score === 'number') return parsed;
      } catch (err) {
        console.warn('Gemini evaluation failed, falling back to local evaluator:', err.message);
      }
    } else if (provider === 'openai' && openaiKey) {
      try {
        const raw = await this.callOpenAI(prompt, 'You are an objective, encouraging, and rigorous technical evaluator.', openaiKey);
        const parsed = this.parseJSONSafe(raw);
        if (parsed && typeof parsed.score === 'number') return parsed;
      } catch (err) {
        console.warn('OpenAI evaluation failed, falling back to local evaluator:', err.message);
      }
    }

    // Local evaluation engine
    const text = (userAnswer || '').toLowerCase();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    let matchedCount = 0;
    const missing = [];

    for (const point of expectedPoints) {
      const keywords = point.toLowerCase().split(/[\s,()\/]+/).filter(w => w.length > 3);
      const hasMatch = keywords.some(k => text.includes(k));
      if (hasMatch) {
        matchedCount++;
      } else {
        missing.push(point);
      }
    }

    // Scoring rubric
    let score = 30; // base score for attempting
    if (wordCount >= 30) score += 20;
    else if (wordCount >= 15) score += 10;

    if (expectedPoints.length > 0) {
      const ratio = matchedCount / expectedPoints.length;
      score += Math.round(ratio * 50);
    } else {
      score += Math.min(40, wordCount);
    }

    score = Math.min(100, Math.max(10, score));

    const improvements = [];
    if (wordCount < 25) {
      improvements.push('Expand your answer with specific architectural examples and implementation mechanics.');
    }
    if (missing.length > 0) {
      improvements.push(`Discuss related concepts such as: ${missing.slice(0, 2).join(', ')}.`);
    }
    improvements.push('Structure your answer with explicit trade-offs and edge-case mitigations.');

    return {
      score,
      correctness: score >= 75 
        ? 'Strong answer covering key technical fundamentals with solid precision.' 
        : score >= 50 
        ? 'Competent response with good initial thoughts, but missing critical system nuances.'
        : 'Incomplete response with notable gaps in key technical concepts.',
      missingConcepts: missing.length > 0 ? missing : ['Deep dive into failover scenarios'],
      mistakes: score < 60 ? ['Did not fully address operational constraints and edge cases'] : [],
      improvements,
      modelAnswer: `A comprehensive answer clearly establishes the underlying architecture, addresses specific edge cases (such as failure recovery and network partitions), outlines trade-offs between competing approaches, and demonstrates measurable production impact.`
    };
  }

  // Generate final interview evaluation report
  async generateFinalReport({ session, questions, userSettings }) {
    const answered = questions.filter(q => q.user_answer);
    const avgScore = answered.length > 0 
      ? Math.round(answered.reduce((acc, q) => acc + (q.score || 0), 0) / answered.length)
      : 0;

    const technicalDepthScore = Math.min(100, Math.max(20, avgScore + Math.floor(Math.random() * 6 - 3)));
    const communicationScore = Math.min(100, Math.max(20, avgScore + 5));
    const problemSolvingScore = Math.min(100, Math.max(20, avgScore - 2));
    const systemStructureScore = Math.min(100, Math.max(20, avgScore + 2));

    const strengths = [];
    const weaknesses = [];

    if (avgScore >= 75) {
      strengths.push('Demonstrates solid conceptual grasp of architectural fundamentals.');
      strengths.push('Articulates technical decisions with clarity and confidence.');
      strengths.push('Effectively anticipates production scale trade-offs.');
    } else if (avgScore >= 55) {
      strengths.push('Shows good foundational knowledge of core frameworks and tools.');
      strengths.push('Attempts thorough answers with relevant terminology.');
      weaknesses.push('Could provide deeper technical specifics and exact mechanics.');
      weaknesses.push('Needs greater familiarity with failure modes and recovery procedures.');
    } else {
      strengths.push('Demonstrates enthusiasm and genuine effort to solve questions.');
      weaknesses.push('Requires comprehensive revision of core role competencies and data flow.');
      weaknesses.push('Answers were brief; aim to structure responses with clear examples.');
    }

    const nextSteps = [
      `Review recommended learning resources for ${session.role_title}.`,
      'Practice mock interview questions with timed verbal responses.',
      'Refine answers using the STAR (Situation, Task, Action, Result) methodology.'
    ];

    return {
      overallScore: avgScore,
      categoryScores: {
        technicalDepth: technicalDepthScore,
        communication: communicationScore,
        problemSolving: problemSolvingScore,
        structure: systemStructureScore
      },
      summary: `Candidate completed ${answered.length} questions for the ${session.role_title} role at ${session.difficulty} difficulty with an overall performance rating of ${avgScore}%.`,
      strengths,
      weaknesses,
      nextSteps
    };
  }

  // Job Description Analysis
  async analyzeJobDescription({ jdText, candidateSkills = [], userSettings }) {
    const { extractSkills } = require('./resumeParserService');
    const extractedSkills = extractSkills(jdText);
    
    const candidateSkillSet = new Set(candidateSkills.map(s => s.toLowerCase()));
    const matchingSkills = [];
    const missingSkills = [];

    for (const skill of extractedSkills) {
      if (candidateSkillSet.has(skill.toLowerCase())) {
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    const totalExtracted = extractedSkills.length || 1;
    const matchPercentage = Math.round((matchingSkills.length / totalExtracted) * 100);

    // Identify seniority level
    let detectedLevel = 'Mid-Level';
    if (/senior|lead|principal|staff|architect/i.test(jdText)) {
      detectedLevel = 'Senior / Lead';
    } else if (/junior|entry|intern|associate/i.test(jdText)) {
      detectedLevel = 'Junior / Entry-Level';
    }

    const recommendations = [];
    if (missingSkills.length > 0) {
      recommendations.push(`Prioritize mastering top missing skills: ${missingSkills.slice(0, 4).join(', ')}.`);
    }
    recommendations.push('Align resume project bullet points with key keywords mentioned in the JD.');
    recommendations.push('Prepare specific case studies demonstrating measurable impact in matching areas.');

    return {
      detectedLevel,
      extractedSkills,
      matchingSkills,
      missingSkills,
      matchPercentage,
      recommendations
    };
  }

  // Generate Personalized Learning Roadmap
  generateRoadmap({ targetRole, skillGaps = [], targetDeadlineWeeks = 4, dailyHours = 2 }) {
    const weeks = Math.max(2, Math.min(12, Number(targetDeadlineWeeks) || 4));
    const milestones = [];

    const coreTopicsByRole = {
      'Full Stack Developer': [
        { title: 'Core Fundamentals & Deep Dives', desc: 'JavaScript engine, TypeScript strict mode, modern React hooks and async data patterns.', skills: ['JavaScript', 'TypeScript', 'React'] },
        { title: 'Backend APIs & Database Architecture', desc: 'Node.js event loop, Express middleware, SQL schema design, indexing, and Redis caching.', skills: ['Node.js', 'Express', 'SQL', 'Redis'] },
        { title: 'System Design & Scalability', desc: 'Distributed caching, load balancers, rate limiting, and database replication.', skills: ['System Design', 'Microservices', 'Docker'] },
        { title: 'Interview Simulation & Revision', desc: 'Full-length timed mock interviews, STAR behavioral stories, and coding drills.', skills: ['Mock Interviews', 'Behavioral'] }
      ],
      'Frontend Engineer': [
        { title: 'Modern JavaScript & TypeScript Mastery', desc: 'Closures, Event Loop, prototype chain, generics, and web standards.', skills: ['JavaScript', 'TypeScript'] },
        { title: 'React Ecosystem & State Architecture', desc: 'Component lifecycles, custom hooks, reconciliation, and Zustand/Redux.', skills: ['React', 'Zustand', 'HTML5/CSS3'] },
        { title: 'Web Vitals & Performance Engineering', desc: 'Critical rendering path, LCP/INP/CLS optimization, bundle chunking, and a11y.', skills: ['Web Performance', 'Next.js'] },
        { title: 'Mock Technical & Behavioral Prep', desc: 'Machine coding rounds, UI system design, and behavioral storytelling.', skills: ['Mock Interviews', 'Behavioral'] }
      ],
      'Backend Engineer': [
        { title: 'Language & Concurrency Foundations', desc: 'Thread pooling, non-blocking I/O, memory management, and asynchronous patterns.', skills: ['Node.js', 'Python', 'Go'] },
        { title: 'Databases & Transaction Management', desc: 'ACID vs BASE, B-Tree indexes, query execution plans, and connection pooling.', skills: ['PostgreSQL', 'SQL', 'Redis'] },
        { title: 'Distributed Systems & Architecture', desc: 'Message queues (Kafka), idempotency, gRPC, circuit breakers, and containerization.', skills: ['Kafka', 'Docker', 'System Design'] },
        { title: 'High-Scale Mock Interviews', desc: 'System design interviews, live API coding, and post-mortem deep dives.', skills: ['System Design', 'Mock Interviews'] }
      ]
    };

    const template = coreTopicsByRole[targetRole] || coreTopicsByRole['Full Stack Developer'];

    for (let i = 0; i < weeks; i++) {
      const templateItem = template[i % template.length];
      const weekNum = i + 1;
      
      const milestoneId = `week-${weekNum}`;
      const tasks = [
        {
          id: `${milestoneId}-task-1`,
          milestoneId,
          title: `Master ${templateItem.skills[0] || 'Core Concepts'} - Deep Conceptual Study`,
          description: `Study official documentation and architectural patterns for ${templateItem.skills[0] || 'primary topics'}.`,
          category: 'Theory',
          priority: 'High',
          dueWeek: weekNum,
          isCompleted: false
        },
        {
          id: `${milestoneId}-task-2`,
          milestoneId,
          title: `Hands-on Practice: ${templateItem.title}`,
          description: `Implement 2 practical exercises or production-ready snippets focusing on ${templateItem.skills.join(', ')}.`,
          category: 'Coding',
          priority: 'High',
          dueWeek: weekNum,
          isCompleted: false
        },
        {
          id: `${milestoneId}-task-3`,
          milestoneId,
          title: `Solve 5 Targeted Practice Problems`,
          description: `Complete curated coding challenges or system design questions related to this milestone.`,
          category: 'Practice',
          priority: 'Medium',
          dueWeek: weekNum,
          isCompleted: false
        },
        {
          id: `${milestoneId}-task-4`,
          milestoneId,
          title: `Complete 1 AI Mock Interview Session`,
          description: `Simulate a full ${targetRole} technical interview session to benchmark retention.`,
          category: 'Mock Interview',
          priority: 'Medium',
          dueWeek: weekNum,
          isCompleted: false
        }
      ];

      milestones.push({
        id: milestoneId,
        weekNumber: weekNum,
        title: `Week ${weekNum}: ${templateItem.title}`,
        description: templateItem.desc,
        estimatedHours: Math.round(dailyHours * 6),
        skillsCovered: templateItem.skills,
        tasks
      });
    }

    return {
      targetRole,
      targetDeadlineWeeks: weeks,
      dailyHours,
      totalEstimatedHours: Math.round(weeks * dailyHours * 6),
      milestones
    };
  }
}

module.exports = new AIService();
