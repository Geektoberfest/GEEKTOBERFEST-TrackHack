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

## Tech Stack

**Frontend**
- React
- Vite
- React Router
- Tailwind CSS
- Axios

**Backend**
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

**Integration**
- GitHub API

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js and npm
- A MongoDB database, either local or hosted on MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Geektoberfest/TrackHack.git
cd TrackHack
```

### 2. Set up the backend

```bash
cd BACKEND
npm install
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
npm run dev
```

The API should be available at `http://localhost:5000`.

### 3. Set up the frontend

Open another terminal from the repository root:

```bash
cd FRONTEND
npm install
```

Create a `.env` file inside `FRONTEND`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Keep both the frontend and backend running while using the application.

## Available Scripts

### Backend

Run these commands from `BACKEND/`.

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the development server |
| `npm start` | Start the server |
| `npm test` | Run backend integration tests (Jest + Supertest + in-memory MongoDB) |
| `npm run lint` | Run Oxlint |
| `npm run promote-admin -- <email>` | Promote an existing user to admin |

### Frontend

Run these commands from `FRONTEND/`.

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |
| `npm run test` | Run frontend component tests (Vitest + React Testing Library) |

## Testing and CI

- Backend: `cd BACKEND && npm test` runs integration tests for auth, hackathons, trackers, GitHub routes, and the auth guard. Tests use `mongodb-memory-server`, so no local MongoDB is needed. `JWT_SECRET` defaults to a test value when unset.
- Frontend: `cd FRONTEND && npm run test` runs component tests for cards, badges, forms, filters, progress, route guards, and the API client.
- CI (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`: backend lint + integration tests, frontend lint + component tests + production build.

## API Overview

All application API routes are mounted under `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the authenticated user's details |
| GET | `/api/hackathons` | List hackathons |
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

The hackathon, tracker, and GitHub routes require authentication where configured. Requests that require authentication should include the JWT in the `Authorization` header as a Bearer token.

Users have a `user` or `admin` role, returned on register/login and in tokens. Registration never accepts a client-sent role. Owners can edit or delete their own hackathons and trackers; admins can manage any hackathon or tracker. The admin UI lives at `/admin` and is visible only to admins. Deleting a user removes their trackers but keeps hackathons they created.

## Project Structure

```text
TrackHack/
├── BACKEND/
│   ├── server.js
│   └── src/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── services/
└── FRONTEND/
    ├── public/
    └── src/
        ├── components/
        ├── pages/
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
