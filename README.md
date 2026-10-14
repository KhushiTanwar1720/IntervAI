# IntervAI — AI-Powered Interview Preparation Platform

IntervAI is a web-based interview preparation platform designed to help candidates prepare for technical and behavioral interviews. It brings resume parsing, career-profile management, role recommendations, job-description analysis, personalized study roadmaps, learning resources, mock interviews, and performance feedback into one workspace.

**Live demo:** https://intervai-km0o.onrender.com  
**GitHub repository:** https://github.com/KhushiTanwar1720/IntervAI

> Note: The live deployment may take a short time to wake up on a free hosting instance. Some features, especially AI-provider integrations, depend on the configured environment variables.

## Features

- **Account authentication** — register, log in, JWT-based sessions, and protected pages.
- **Career profile** — manage skills, education, experience, projects, certifications, links, and career preferences.
- **Resume parsing** — upload PDF or DOCX resumes, extract relevant information, review it, and choose what to merge into the profile.
- **Role recommendations** — compare profile skills with target roles, review match scores and skill gaps, and select a target role.
- **Job-description analysis** — identify relevant skills and seniority signals, compare them with the profile, and view preparation recommendations.
- **Personalized roadmap** — generate week-by-week preparation tasks based on target role, available weeks, and daily study time; track task completion.
- **Learning resources** — search and filter learning links, bookmark resources, and track completion.
- **Mock interviews** — configure interview type, difficulty, duration, and question count; answer questions and receive follow-up questions where appropriate.
- **Interview feedback and reports** — review question-level feedback, model answers, strengths, improvement areas, category scores, and next steps.
- **Dashboard and analytics** — view profile completeness, roadmap progress, interview performance trends, skill gaps, and suggested next actions.
- **AI provider options** — use the built-in local question/evaluation engine, or configure Gemini or OpenAI API access.

## Tech stack

**Frontend**
- React
- Vite
- React Router
- Recharts
- Lucide React
- CSS

**Backend**
- Node.js
- Express
- SQLite using Node's built-in `node:sqlite` API
- JWT authentication and `bcryptjs` password hashing
- `multer` for uploads
- `pdf-parse` for PDF extraction
- `mammoth` for DOCX extraction

**Deployment**
- The backend is deployed on Render and serves the built frontend when the frontend build is present in `backend/client/dist`.

## Project structure

```text
IntervAI/
└── backend/
    ├── client/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── context/
    │   │   ├── pages/
    │   │   └── services/
    │   ├── index.html
    │   ├── package.json
    │   └── vite.config.js
    ├── server/
    │   ├── src/
    │   │   ├── db/
    │   │   ├── middleware/
    │   │   ├── routes/
    │   │   └── services/
    │   └── package.json
    └── IMPLEMENTATION.md
```

The repository also contains a separate top-level `client/` folder. The active full application described above is under `backend/client` and `backend/server`; use those paths when running or building this application.

## Requirements

- Node.js **22.12 or newer** recommended (the database uses `node:sqlite`, and the frontend uses a recent Vite version).
- npm
- Git (optional, for cloning the repository)

## Run locally

### 1. Clone the repository

```bash
git clone https://github.com/KhushiTanwar1720/IntervAI.git
cd IntervAI
```

### 2. Install backend dependencies

Open a terminal in the repository root and run:

```bash
cd backend/server
npm install
```

### 3. Install frontend dependencies

Open a **second terminal** in the repository root and run:

```bash
cd backend/client
npm install
```

### 4. Configure environment variables

Create a `.env` file at `backend/server/.env` if you need custom configuration. Example:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=replace-this-with-a-long-random-secret
DEFAULT_AI_PROVIDER=local
# Optional: set one or both if you want a hosted AI provider
# GEMINI_API_KEY=your_gemini_api_key
# OPENAI_API_KEY=your_openai_api_key
```

Keep `.env` out of GitHub. Never commit real API keys, passwords, or production secrets.

### 5. Start the backend

In the backend terminal:

```bash
node src/index.js
```

The API will normally run at `http://localhost:5000`. Health check:

```text
http://localhost:5000/api/health
```

### 6. Start the frontend

In the frontend terminal:

```bash
npm run dev
```

Vite is configured to run at `http://localhost:3000` and proxy `/api` requests to the local backend at `http://localhost:5000`.

## Environment variables

| Variable | Required? | Description |
|---|---|---|
| `PORT` | No | Port for the Express server; defaults to `5000`. The hosting platform may supply this value. |
| `NODE_ENV` | No | Runtime environment, such as `development` or `production`. |
| `JWT_SECRET` | **Yes for production security** | Secret used to sign JWTs. Set a strong, unique value in production. |
| `DEFAULT_AI_PROVIDER` | No | AI mode: `local`, `gemini`, or `openai`; defaults to `local`. |
| `GEMINI_API_KEY` | No | Enables Gemini-backed generation/evaluation when configured. `GOOGLE_API_KEY` is also accepted by the server config. |
| `GOOGLE_API_KEY` | No | Alternative environment variable for a Gemini API key. |
| `OPENAI_API_KEY` | No | Enables OpenAI-backed generation/evaluation when configured. |
| `DB_PATH` | No | Optional path for the SQLite database file. Defaults to `backend/server/data/interview_prep.db`. |

The built-in `local` provider is intended to let the platform run without a hosted AI API key. The exact capabilities can differ from Gemini/OpenAI-backed results.

## API overview

The Express API is grouped under `/api`:

| Base path | Purpose |
|---|---|
| `/api/health` | Health check |
| `/api/auth` | Registration, login, and current-user authentication |
| `/api/profile` | Career profile and profile completeness |
| `/api/resume` | Resume upload, history, and profile merge |
| `/api/roles` | Role catalogue, recommendations, and selected roles |
| `/api/jd` | Job-description analysis and history |
| `/api/roadmap` | Preparation roadmap and task progress |
| `/api/resources` | Learning resources, bookmarks, and completion tracking |
| `/api/interview` | Interview creation, answers, history, and reports |
| `/api/analytics` | Dashboard analytics |
| `/api/settings` | User settings |

## Deployment notes

### Render

The current live service is:

- **URL:** https://intervai-km0o.onrender.com
- **Root Directory:** `backend/server`
- **Build Command:** install backend dependencies and build the frontend from `backend/client`.
- **Start Command:** `node src/index.js`

If you change deployment settings, ensure the build creates `backend/client/dist` because the Express server serves that directory in production. Keep `JWT_SECRET` in Render's environment settings, not in source code.

### SQLite persistence on hosting

The application stores data in a local SQLite file by default. On hosting platforms, local filesystem data may not persist across restarts or redeploys unless persistent storage is configured. For production use with important user data, configure persistent storage or migrate to a managed database and back up the data.

### Optional Vercel frontend deployment

Vercel is **not required** if the Render deployment is already serving both the frontend and API successfully. If you decide to host the frontend separately, configure the frontend's API base URL and CORS for the Render API, and deploy the actual frontend at `backend/client`. The repository currently contains more than one detected client directory, so do not assume the top-level `client/` is the active app.

## Security

- Use a unique, randomly generated `JWT_SECRET` in production.
- If a secret has been shared publicly or in a chat, rotate it before relying on the deployment.
- Never commit `.env` files or API keys.
- Configure CORS to allow only trusted frontend origins before using the application with real users.
- Review file-upload limits and validation before accepting untrusted files at scale.

## Known limitations

- Gemini and OpenAI features require the corresponding API key and provider configuration; local mode does not require one.
- Browser microphone input depends on browser support for the Web Speech API. Camera and microphone access require a real browser and user permission.
- Free hosting instances may sleep when idle and may have ephemeral local storage.
- This README describes the repository layout and implementation notes; test each feature in your deployed environment before relying on it for real interviews or important data.

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -m "Add your feature"`.
4. Push the branch and open a pull request.

## License

See the [`LICENSE`](LICENSE) file for the project's license terms.

---

**Built with React, Node.js, Express, SQLite, and AI-assisted interview preparation workflows.**
