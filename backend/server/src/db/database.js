const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure data folder exists
const dataDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(config.DB_PATH);

// Helper wrapper for convenience
const dbHelper = {
  db,
  exec(sql) {
    return db.exec(sql);
  },
  prepare(sql) {
    return db.prepare(sql);
  },
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  }
};

function initSchema() {
  // Foreign keys enabled
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      headline TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      phone TEXT DEFAULT '',
      location TEXT DEFAULT '',
      linkedin_url TEXT DEFAULT '',
      github_url TEXT DEFAULT '',
      portfolio_url TEXT DEFAULT '',
      target_role TEXT DEFAULT 'Full Stack Developer',
      target_level TEXT DEFAULT 'Mid',
      skills TEXT DEFAULT '[]',
      experience_years REAL DEFAULT 0,
      work_experience TEXT DEFAULT '[]',
      education TEXT DEFAULT '[]',
      projects TEXT DEFAULT '[]',
      certifications TEXT DEFAULT '[]',
      career_preferences TEXT DEFAULT '{}',
      completeness_score INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      raw_text TEXT DEFAULT '',
      parsed_data TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      required_skills TEXT DEFAULT '[]',
      preferred_skills TEXT DEFAULT '[]',
      interview_focus TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS user_selected_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_title TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      match_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_descriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      company TEXT DEFAULT '',
      raw_text TEXT NOT NULL,
      extracted_skills TEXT DEFAULT '[]',
      extracted_requirements TEXT DEFAULT '[]',
      experience_level TEXT DEFAULT '',
      match_analysis TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roadmaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_role TEXT NOT NULL,
      target_deadline_weeks INTEGER DEFAULT 4,
      daily_hours REAL DEFAULT 2.0,
      overall_progress INTEGER DEFAULT 0,
      milestones TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roadmap_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roadmap_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      milestone_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'Theory',
      priority TEXT DEFAULT 'High',
      is_completed INTEGER DEFAULT 0,
      due_week INTEGER DEFAULT 1,
      resource_links TEXT DEFAULT '[]',
      completed_at DATETIME,
      FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      difficulty TEXT DEFAULT 'Intermediate',
      tags TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      is_verified INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      is_bookmarked INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      UNIQUE(user_id, resource_id)
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_title TEXT NOT NULL,
      interview_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      status TEXT DEFAULT 'in_progress',
      total_questions INTEGER DEFAULT 5,
      current_question_index INTEGER DEFAULT 0,
      overall_score INTEGER DEFAULT 0,
      evaluation_summary TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_category TEXT DEFAULT 'Technical',
      expected_points TEXT DEFAULT '[]',
      user_answer TEXT DEFAULT '',
      answer_duration_seconds INTEGER DEFAULT 0,
      is_follow_up INTEGER DEFAULT 0,
      follow_up_reason TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      feedback TEXT DEFAULT '{}',
      answered_at DATETIME,
      FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      ai_provider TEXT DEFAULT 'local',
      gemini_api_key TEXT DEFAULT '',
      openai_api_key TEXT DEFAULT '',
      voice_enabled INTEGER DEFAULT 1,
      speech_rate REAL DEFAULT 1.0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function seedData() {
  // Check if roles are populated
  const roleCount = dbHelper.get('SELECT COUNT(*) as count FROM roles').count;
  if (roleCount === 0) {
    const roles = [
      {
        title: 'Full Stack Developer',
        category: 'Software Engineering',
        description: 'Designs, implements, and maintains end-to-end web applications with modern frontend and backend frameworks.',
        required_skills: JSON.stringify(['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'SQL', 'Git', 'REST APIs']),
        preferred_skills: JSON.stringify(['Docker', 'GraphQL', 'Next.js', 'Redis', 'AWS', 'Tailwind CSS', 'CI/CD']),
        interview_focus: JSON.stringify(['Web architecture', 'Database indexing', 'State management', 'RESTful API design', 'Authentication & JWT', 'Async JavaScript'])
      },
      {
        title: 'Frontend Engineer',
        category: 'Web Development',
        description: 'Focuses on building responsive, performant, and accessible user interfaces and interactive experiences.',
        required_skills: JSON.stringify(['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Responsive Design', 'Git']),
        preferred_skills: JSON.stringify(['Next.js', 'Vue.js', 'Redux / Zustand', 'Web Performance', 'Accessibility (a11y)', 'Jest / Testing Library']),
        interview_focus: JSON.stringify(['DOM rendering & Virtual DOM', 'CSS Box model & Flexbox/Grid', 'React Hooks lifecycle', 'Web vitals & bundle optimization', 'Cross-browser compatibility'])
      },
      {
        title: 'Backend Engineer',
        category: 'Software Engineering',
        description: 'Architects robust server-side systems, microservices, databases, and high-throughput APIs.',
        required_skills: JSON.stringify(['Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL', 'REST APIs', 'System Architecture']),
        preferred_skills: JSON.stringify(['Kafka', 'Redis', 'Docker', 'Kubernetes', 'gRPC', 'Distributed Systems', 'Microservices']),
        interview_focus: JSON.stringify(['Concurrency & thread safety', 'Database normalization & transactions', 'Caching strategies', 'Scalability & load balancing', 'API rate limiting'])
      },
      {
        title: 'DevOps & Cloud Engineer',
        category: 'Infrastructure',
        description: 'Automates deployment pipelines, cloud infrastructure orchestration, monitoring, and security.',
        required_skills: JSON.stringify(['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD pipelines', 'Bash / Shell', 'Git']),
        preferred_skills: JSON.stringify(['Terraform', 'Prometheus', 'Grafana', 'Ansible', 'GCP / Azure', 'Security Best Practices']),
        interview_focus: JSON.stringify(['Container lifecycle', 'Kubernetes pod scheduling & ingress', 'Zero-downtime deployments', 'Infrastructure as Code', 'Observability & alerting'])
      },
      {
        title: 'AI / Machine Learning Engineer',
        category: 'Data Science & AI',
        description: 'Builds, fine-tunes, and deploys intelligent models, LLM systems, and predictive algorithms at scale.',
        required_skills: JSON.stringify(['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Linear Algebra', 'NumPy', 'Pandas']),
        preferred_skills: JSON.stringify(['Hugging Face', 'LangChain / LlamaIndex', 'RAG architectures', 'Vector Databases', 'MLOps', 'FastAPI']),
        interview_focus: JSON.stringify(['Bias-variance tradeoff', 'Transformer architecture & attention mechanism', 'Vector embeddings & search', 'Fine-tuning vs RAG', 'Model evaluation metrics'])
      },
      {
        title: 'Data Engineer',
        category: 'Data Engineering',
        description: 'Develops reliable ETL pipelines, data warehouses, streaming platforms, and data modeling architectures.',
        required_skills: JSON.stringify(['Python', 'SQL', 'Data Warehousing', 'Apache Spark', 'ETL Pipelines', 'PostgreSQL']),
        preferred_skills: JSON.stringify(['Airflow', 'Snowflake', 'dbt', 'Kafka', 'BigQuery', 'Data Modeling']),
        interview_focus: JSON.stringify(['Data partitioning & sharding', 'Streaming vs batch processing', 'Star vs Snowflake schemas', 'ACID vs BASE', 'Data quality & lineage'])
      },
      {
        title: 'Product Manager (Technical)',
        category: 'Product',
        description: 'Leads cross-functional product roadmap execution, user requirement distillation, and metric-driven strategy.',
        required_skills: JSON.stringify(['Product Strategy', 'Agile / Scrum', 'User Stories', 'Roadmapping', 'Data Analytics', 'A/B Testing']),
        preferred_skills: JSON.stringify(['System Architecture comprehension', 'SQL queries', 'Figma', 'Market Research', 'KPI Metrics']),
        interview_focus: JSON.stringify(['Product design & prioritization frameworks (RICE)', 'Trade-off analysis', 'Metric degradation debugging', 'Stakeholder alignment', 'Go-to-market strategy'])
      }
    ];

    const insertRole = db.prepare(`
      INSERT INTO roles (title, category, description, required_skills, preferred_skills, interview_focus)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const r of roles) {
      insertRole.run(r.title, r.category, r.description, r.required_skills, r.preferred_skills, r.interview_focus);
    }
  }

  // Seed verified resources if empty
  const resourceCount = dbHelper.get('SELECT COUNT(*) as count FROM resources').count;
  if (resourceCount === 0) {
    const resources = [
      {
        title: 'MDN Web Docs - JavaScript Guide',
        type: 'documentation',
        category: 'Frontend',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        platform: 'MDN',
        difficulty: 'Beginner',
        tags: JSON.stringify(['JavaScript', 'Web', 'ES6', 'Closures', 'Promises']),
        description: 'The definitive official documentation and comprehensive reference guide for modern JavaScript syntax and runtime features.'
      },
      {
        title: 'React Official Documentation (react.dev)',
        type: 'documentation',
        category: 'Frontend',
        url: 'https://react.dev/learn',
        platform: 'Official Docs',
        difficulty: 'Intermediate',
        tags: JSON.stringify(['React', 'Hooks', 'Components', 'Virtual DOM', 'State']),
        description: 'Interactive guides and best practices for modern React with hooks, server components, and component lifecycle.'
      },
      {
        title: 'Node.js Official Documentation & Guides',
        type: 'documentation',
        category: 'Backend',
        url: 'https://nodejs.org/en/learn',
        platform: 'Official Docs',
        difficulty: 'Intermediate',
        tags: JSON.stringify(['Node.js', 'Event Loop', 'Streams', 'Asynchronous', 'APIs']),
        description: 'Essential fundamentals covering the Node.js event loop, libuv, buffer manipulation, streams, and async patterns.'
      },
      {
        title: 'System Design Primer by Donne Martin',
        type: 'article',
        category: 'System Design',
        url: 'https://github.com/donnemartin/system-design-primer',
        platform: 'GitHub',
        difficulty: 'Advanced',
        tags: JSON.stringify(['System Design', 'Scalability', 'Microservices', 'Caching', 'Load Balancing']),
        description: 'The industry-standard open source guide to learning large-scale distributed system design and trade-offs.'
      },
      {
        title: 'NeetCode 150 - Curated Coding Interview Roadmap',
        type: 'practice',
        category: 'Algorithms',
        url: 'https://neetcode.io/practice',
        platform: 'Neetcode',
        difficulty: 'Intermediate',
        tags: JSON.stringify(['Data Structures', 'Algorithms', 'LeetCode', 'Dynamic Programming', 'Graphs']),
        description: 'Structured pattern-based practice problems with video solutions covering all major technical interview topics.'
      },
      {
        title: 'freeCodeCamp: Backend Web Development with Node.js & Express',
        type: 'video',
        category: 'Backend',
        url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
        platform: 'YouTube',
        difficulty: 'Beginner',
        tags: JSON.stringify(['Node.js', 'Express', 'APIs', 'MongoDB', 'Authentication']),
        description: 'Comprehensive 8-hour hands-on video course covering RESTful APIs, middleware architecture, routing, and deployment.'
      },
      {
        title: 'Traversy Media: Git & GitHub Crash Course for Beginners',
        type: 'video',
        category: 'DevOps',
        url: 'https://www.youtube.com/watch?v=RGOj5yH7evk',
        platform: 'YouTube',
        difficulty: 'Beginner',
        tags: JSON.stringify(['Git', 'GitHub', 'Version Control', 'Branching', 'Merging']),
        description: 'Master version control, branches, rebasing, pull requests, and collaborative Git workflows.'
      },
      {
        title: 'Hussein Nasser: Database Indexing Explained',
        type: 'video',
        category: 'Backend',
        url: 'https://www.youtube.com/watch?v=-qNSXK7s7_w',
        platform: 'YouTube',
        difficulty: 'Advanced',
        tags: JSON.stringify(['Databases', 'B-Trees', 'SQL', 'Performance', 'Indexing']),
        description: 'Deep architectural exploration of how B-Tree database indexing, clustered indexes, and execution plans work under the hood.'
      },
      {
        title: 'LeetCode Top Interview 150 Questions',
        type: 'practice',
        category: 'Algorithms',
        url: 'https://leetcode.com/studyplan/top-interview-150/',
        platform: 'LeetCode',
        difficulty: 'Intermediate',
        tags: JSON.stringify(['LeetCode', 'Two Pointers', 'Sliding Window', 'Binary Tree', 'Sorting']),
        description: 'The official collection of the 150 most frequently tested coding interview problems by tier-1 tech companies.'
      },
      {
        title: 'Docker Documentation - Containerization Get Started',
        type: 'documentation',
        category: 'DevOps',
        url: 'https://docs.docker.com/get-started/',
        platform: 'Official Docs',
        difficulty: 'Beginner',
        tags: JSON.stringify(['Docker', 'Containers', 'Dockerfiles', 'Images', 'Networking']),
        description: 'Official step-by-step documentation for building, running, and managing containerized applications.'
      },
      {
        title: 'Harvard CS50: Understanding Web Architecture & Protocols',
        type: 'video',
        category: 'Full Stack',
        url: 'https://www.youtube.com/watch?v=kMZZp3-K_00',
        platform: 'YouTube',
        difficulty: 'Beginner',
        tags: JSON.stringify(['HTTP', 'DNS', 'TCP/IP', 'Web Architecture', 'Security']),
        description: 'In-depth introduction to internet fundamentals, protocol handshakes, and client-server interactions.'
      },
      {
        title: 'Behavioral Interviews: STAR Method Guide (Coursera)',
        type: 'article',
        category: 'Behavioral',
        url: 'https://www.coursera.org/articles/star-method',
        platform: 'Article',
        difficulty: 'Beginner',
        tags: JSON.stringify(['STAR Method', 'HR Interview', 'Behavioral', 'Leadership', 'Communication']),
        description: 'Practical guide to structuring behavioral answers using Situation, Task, Action, and Result with real-life examples.'
      }
    ];

    const insertRes = db.prepare(`
      INSERT INTO resources (title, type, category, url, platform, difficulty, tags, description, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of resources) {
      insertRes.run(
        r.title,
        r.type,
        r.category,
        r.url,
        r.platform,
        r.difficulty || 'Intermediate',
        r.tags || '[]',
        r.description || '',
        r.is_verified !== undefined ? r.is_verified : 1
      );
    }
  }
}

// Initialize tables on startup
initSchema();

module.exports = dbHelper;
