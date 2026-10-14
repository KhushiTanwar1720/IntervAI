# AI Interview Preparation Platform - Implementation Plan

## Phase 1: Foundation, Architecture & Database
- [x] Workspace setup: Node.js + Express backend + Vite React frontend + SQLite database.
- [x] Database schema with SQLite (`node:sqlite`): Users, Profiles, Resumes, Roles, JDs, Roadmaps, RoadmapTasks, Resources, Bookmarks, Interviews, Questions, Evaluations, Settings.
- [x] Authentication system: Password hashing (`bcryptjs`), JWT tokens, auth middleware, protected API endpoints, React AuthContext + ProtectedRoute.
- [x] Configurable AI Engine: Gemini API, OpenAI API, and intelligent local semantic reasoning engine with structured schema validation (automatic fallback when no key is set).

## Phase 2: User Profile & Resume Parsing
- [x] Superset-style Career Profile API & UI:
  - Education, Skills, Experience, Projects, Certifications, Links, Career preferences.
  - Profile completeness metric & real-time calculation (server-computed, shown with progress bar).
- [x] Multi-format Resume Parser:
  - File upload (`multer`) for PDF (`pdf-parse`) and DOCX (`mammoth`).
  - Skill dictionary & regex pattern extraction for education, experience, projects, certifications.
  - Review & Merge modal: user reviews, selects/deselects skills, and explicitly merges into profile without silent overwriting.

## Phase 3: Role Recommendation & Job Description Analysis
- [x] Role Recommendation Engine:
  - Match user profile against target roles with weighted scoring (75% required / 25% preferred skills).
  - Match percentage, skill gaps, preparation priorities surfaced in UI.
  - Custom role entry, shortlist, and "set as primary" target role selection.
- [x] Job Description (JD) Analyzer:
  - Text extraction for required skills & seniority level detection.
  - Profile vs JD gap analysis with match percentage, recommendations, and history.

## Phase 4: Personalized Learning Roadmap & Verified Resources
- [x] Adaptive Roadmap Generator:
  - Considers target role, preparation timeline (weeks), and daily study hours.
  - Week-by-week milestones with Theory/Coding/Practice/Mock Interview tasks.
  - Task toggle completion with persistent progress tracking and regenerate option.
- [x] Genuine Learning Resource Hub:
  - Verified official documentation, real YouTube tutorials, and coding practice links (seeded, real URLs — no fabricated links).
  - Search & filter by category/type, bookmarking, and completion tracking.

## Phase 5: AI Mock Interviews & Real-time Session Runner
- [x] Interview Configuration & Session Creator:
  - Types: Technical, Coding, HR, Behavioral, System Design.
  - Difficulty: Junior, Mid, Senior, Staff/Lead. Configurable duration & question count.
- [x] Dynamic Question & Follow-up Engine:
  - Questions served one at a time; contextual follow-ups auto-injected based on score/answer heuristics.
  - Answer capture via text and Web Speech API voice input; optional webcam preview.
  - Session state persisted in DB after every answer (no lost progress on refresh/API failure).

## Phase 6: In-Depth Evaluation & Scoring Engine
- [x] Question-level structured feedback: correctness, missing concepts, mistakes, improvements, model answer.
- [x] Comprehensive Final Evaluation Report: overall score, category breakdown (technical depth, communication, problem solving, structure), strengths, weaknesses, next steps, full Q&A transcript.

## Phase 7: Dashboard, Analytics & Polish
- [x] Executive Dashboard: real profile completeness, roadmap progress, interview performance trend (recharts), skill gap heatmap, data-driven next actions.
- [x] Design & Aesthetics: existing Obsidian glassmorphism dark theme, consistent components, responsive grid layouts.
- [x] Verified end-to-end in a live browser session: register → profile save → resume parser merge flow wired → role recommendations → JD analysis → roadmap generation/toggle → resources → full mock interview (6 questions incl. 2 auto follow-ups) → final report → dashboard reflecting real stats.
- [x] Production build (`vite build`) passes; `oxlint` passes with warnings only (no errors).

## Environment Variables (server/.env, optional)
- `PORT` (default 5000 — pinned explicitly in `npm run dev`/`start` to avoid conflicting with the client's port 3000)
- `JWT_SECRET`
- `GEMINI_API_KEY` / `GOOGLE_API_KEY` (optional — enables Gemini-backed questions/evaluation)
- `OPENAI_API_KEY` (optional — enables OpenAI-backed questions/evaluation)
- `DEFAULT_AI_PROVIDER` (`local` | `gemini` | `openai`, default `local`)

Without any AI provider key, the platform runs fully functional on its built-in local question bank and rubric-based evaluator — no mock/fake data, no TODOs.

## Known limitations
- Camera/mic device capture only works in a real browser (not in the sandboxed preview pane used for automated testing); Web Speech API voice input requires a Chromium-based browser.
