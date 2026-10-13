# TrackHack

TrackHack helps students keep track of hackathons and manage their progress from the initial idea to the final submission. Instead of maintaining deadlines, registration details, and project progress in separate places, users can keep everything organized in one application.

## Features

- User registration and login with `user` / `admin` roles
- Admins can manage any hackathon or tracker and administer users
- Create, view, update, and delete hackathon entries
- Store hackathon dates, registration deadlines, location, mode, and website
- Track progress through different stages of a hackathon
- Record team formation, idea submission, prototype progress, and final results
- Connect a GitHub username to a user profile
- View GitHub profile information and public repositories
- Keep separate trackers for different hackathons
- Personalized hackathon recommendations based on skills, interests, and preferred mode/location

## Tech Stack

**Frontend**
- React
- Vite
- React Router
- Tailwind CSS
- Axios

**Backend**
- Bun (runtime + package manager)
- Express
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

**Integration**
- GitHub API

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Bun (v1.2 or newer) — package manager and runtime
- A MongoDB database: local (`scoop install mongodb` or `winget install MongoDB.Server`, then run `mongod --dbpath C:\data\db`) or hosted on MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Geektoberfest/TrackHack.git
cd TrackHack
```

### 2. Set up the backend

```bash
cd BACKEND
bun install
```

Create a `.env` file inside the `BACKEND` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GITHUB_TOKEN=your_github_personal_access_token
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Use a valid MongoDB connection string and a strong, randomly generated JWT secret. The GitHub token is used by the backend's GitHub integration; keep it private and grant only the permissions needed. `ADMIN_EMAILS` is optional: accounts registering or logging in with a listed email are elevated to `admin` for bootstrapping. Removing an email from the list does not demote existing admins.

Start the backend:

```bash
bun run dev
```

The API should be available at `http://localhost:5000`.

### 3. Set up the frontend

Open another terminal from the repository root:

```bash
cd FRONTEND
bun install
```

Create a `.env` file inside `FRONTEND`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
bun run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Keep MongoDB, the backend, and the frontend running while using the application (three terminals).

> **Windows + Scoop note:** `scoop install mongodb` does not register a Windows service, so start the database manually with `mongod --dbpath C:\data\db` (create the folder first) and leave that window open. To register it as a service instead, run once from an admin terminal:
>
> ```powershell
> mongod --dbpath C:\data\db --logpath C:\data\log\mongod.log --install --serviceName MongoDB
> net start MongoDB
> ```

## Available Scripts

### Backend

Run these commands from `BACKEND/`.

| Command | Description |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start the development server |
| `bun start` | Start the server |
| `bun test` | Run backend integration tests (Bun test + Supertest + in-memory MongoDB) |
| `bun run lint` | Run Oxlint |
| `bun run promote-admin -- <email>` | Promote an existing user to admin |

### Frontend

Run these commands from `FRONTEND/`.

| Command | Description |
|---|---|
| `bun install` | Install dependencies |
| `bun run dev` | Start the Vite development server |
| `bun run build` | Build the production frontend |
| `bun run preview` | Preview the production build |
| `bun run lint` | Run Oxlint |
| `bun run test` | Run frontend component tests (Vitest + React Testing Library) |

## Testing and CI

- Backend: `cd BACKEND && bun test` runs integration tests for auth, hackathons, trackers, GitHub routes, and the auth guard. Tests use `mongodb-memory-server`, so no local MongoDB is needed. `JWT_SECRET` defaults to a test value when unset.
- Frontend: `cd FRONTEND && bun run test` runs component tests for cards, badges, forms, filters, progress, route guards, and the API client.
- CI (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`: backend lint + integration tests, frontend lint + component tests + production build.

### Backend tests: MongoDB binary

The first backend test run downloads a `mongod` binary (~700MB) into the OS cache (`~/.cache/mongodb-binaries` on Windows: `C:\Users\<you>\.cache\mongodb-binaries`). It needs network access and a few minutes; later runs reuse the cached binary. To skip the download, point the runner at an already-installed `mongod` (same terminal, before `bun test`):

```powershell
$env:MONGOMS_SYSTEM_BINARY="C:\Users\<you>\scoop\apps\mongodb\current\bin\mongod.exe"
bun test
```

Run a single test file while debugging:

```bash
cd BACKEND
bun test --timeout 60000 --preload ./tests/bun-preload.js tests/auth.test.js
```

### Bun notes

- `BACKEND/src/bun-compat.js` is preloaded by every Bun entrypoint (`dev`, `start`, `test`). It works around Bun 1.3 not implementing the `node:v8` API that `bson` (via Mongoose) probes at import. Never run the backend with a bare `bun server.js`, or it crashes with `NotImplementedError: node:v8 isBuildingSnapshot`.
- Frontend component tests run under `happy-dom` (see `FRONTEND/vitest.config.js`) because `jsdom` worker startup is broken under the Bun runtime.
- Dependencies are pinned in `BACKEND/bun.lock` and `FRONTEND/bun.lock`. Install with `bun install --frozen-lockfile` in CI.

## Running for debugging

Start the stack in this order, one terminal each:

1. `mongod --dbpath C:\data\db` — wait for `Waiting for connections` in the log.
2. `cd BACKEND && bun run dev` — watch mode, restarts on file changes. Expect `Server running on port 5000`.
3. `cd FRONTEND && bun run dev` — restart it after any `.env` change; Vite only reads `.env` at startup.

Health checks:

- Backend: open `http://localhost:5000/` → `{"success":true,"message":"HackTrack API is running"}`.
- Frontend: open the Vite URL (usually `http://localhost:5173/`).
- Database: `mongosh --eval "db.runCommand({ping: 1})"` → `{ ok: 1 }`.

Where to look when something breaks:

- Backend terminal: request errors, `MongoDB connection failed`, startup crashes.
- Browser DevTools (F12): **Console** for frontend errors, **Network** tab for the failing request's status code and response body — far more informative than the UI's generic messages.

Common issues:

| Symptom | Cause | Fix |
|---|---|---|
| `NotImplementedError: node:v8 isBuildingSnapshot` on backend start | Ran without the compat preload | Use `bun run dev` / `bun start` (they include `--preload ./src/bun-compat.js`); never bare `bun server.js` |
| `http://localhost:5000/` won't connect, but `bun run dev` processes exist | Stale processes from Ctrl+C holding no listener (or an old pre-fix process) | Kill leftover `bun.exe` processes, then `bun run dev` once |
| `MongoDB connection failed` in backend log | `mongod` isn't running | Start `mongod --dbpath C:\data\db`, then restart the backend |
| UI shows "Something went wrong" on register/login | Backend unreachable (down, wrong port, or frontend using a stale `VITE_API_URL`) | Verify the health endpoint, restart frontend after `.env` changes |
| Backend tests hang downloading MongoDB | First-run binary download (~700MB) | Wait it out, or set `MONGOMS_SYSTEM_BINARY` to a local `mongod.exe` (see above) |

## API Overview

All application API routes are mounted under `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the authenticated user's details |
| PUT | `/api/auth/me` | Update profile: name, GitHub username, skills, interests, preferred modes/location |
| GET | `/api/hackathons` | List hackathons |
| GET | `/api/hackathons/recommended?limit=10` | Ranked suggestions based on skills, interests, and preferences |
| POST | `/api/hackathons` | Create a hackathon |
| GET | `/api/hackathons/:id` | Get a hackathon |
| PUT | `/api/hackathons/:id` | Update a hackathon |
| DELETE | `/api/hackathons/:id` | Delete a hackathon |
| GET | `/api/trackers` | List trackers (own; admins can pass `?all=true`) |
| POST | `/api/trackers` | Create a tracker |
| GET | `/api/admin/users` | List users (admin only) |
| PATCH | `/api/admin/users/:id/role` | Change a user's role (admin only) |
| DELETE | `/api/admin/users/:id` | Delete a user and their trackers (admin only) |
| GET | `/api/github/profile/:username` | Fetch a GitHub profile |
| GET | `/api/github/repos/:username` | Fetch GitHub repositories |

### Searching hackathons

`GET /api/hackathons` accepts these optional query parameters, which can be combined:

| Parameter | Example | Description |
|---|---|---|
| `search` | `search=ai` | Case-insensitive keyword match on title, organizer, description, or location |
| `status` | `status=Upcoming,Completed` | One or more statuses, comma-separated |
| `mode` | `mode=Online` | One or more modes, comma-separated |
| `startFrom` | `startFrom=2026-10-01` | Hackathons starting on or after this date |
| `startTo` | `startTo=2026-10-31` | Hackathons starting on or before this date |
| `mine` | `mine=true` | Only hackathons created by the logged-in user |
| `sort` | `sort=startDate` | `newest` (default), `oldest`, `startDate`, `-startDate`, `deadline`, or `title` |
| `page` | `page=2` | Page number, starting at 1 |
| `limit` | `limit=10` | Results per page (default 10, max 50) |

Results are only paginated when `page` or `limit` is sent. The response includes `total` (all matching hackathons), `count` (results on this page), `page`, and `totalPages`. Invalid values return `400`.

### Recommendations

`GET /api/hackathons/recommended?limit=10` ranks joinable hackathons (`Upcoming`, `Registered`, `In Progress`) for the logged-in user:

- Skill overlap with hackathon tags/title/description scores highest, then interests, then preferred mode, then preferred location.
- Each entry returns `{ hackathon, score, matchedSkills, matchedInterests, reasons }` so the UI can explain why it was suggested.
- `profileIncomplete: true` signals the user has no skills, interests, or preferences saved yet.
- Users set these via `PUT /api/auth/me` (or the Profile page); hackathon `tags` are set on create/update and filterable via `GET /api/hackathons?tags=React,AI`.

The hackathon, tracker, and GitHub routes require authentication where configured. Requests that require authentication should include the JWT in the `Authorization` header as a Bearer token.

Users have a `user` or `admin` role, returned on register/login and in tokens. Registration never accepts a client-sent role. Owners can edit or delete their own hackathons and trackers; admins can manage any hackathon or tracker. The admin UI lives at `/admin` and is visible only to admins. Deleting a user removes their trackers but keeps hackathons they created.

## Project Structure

```text
TrackHack/
├── BACKEND/
│   ├── server.js
│   ├── bun.lock
│   ├── tests/               # bun-preload.js (compat shim + in-memory Mongo setup)
│   └── src/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/        # recommendationService (skills/interests scoring)
│       └── bun-compat.js    # Bun runtime workaround, preloaded by dev/start/test
└── FRONTEND/
    ├── public/
    ├── bun.lock
    └── src/
        ├── components/
        ├── pages/           # Profile, Recommended, Dashboard, ...
        ├── App.jsx
        └── api.js
```

## Contributing

Contributions are welcome. If you want to improve TrackHack or fix a bug:

1. Check the existing issues and open pull requests.
2. Create a branch for your change.
3. Keep your changes focused on one issue.
4. Test the affected functionality.
5. Open a pull request with a clear description and testing steps.

For larger changes, open an issue first so the proposed approach can be discussed before implementation.

## Security

- Never commit `.env` files, database credentials, JWT secrets, or GitHub tokens.
- Validate input on the backend rather than relying only on frontend validation.
- Keep authentication and resource-ownership checks in place.
- Report security vulnerabilities privately to the maintainers rather than publishing exploit details in an issue.

## License

See the `LICENSE` file in the repository for licensing information.
