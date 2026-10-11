# TrackHack

TrackHack helps students keep track of hackathons and manage their progress from the initial idea to the final submission. Instead of maintaining deadlines, registration details, and project progress in separate places, users can keep everything organized in one application.

## Features

- User registration and login
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
```

Use a valid MongoDB connection string and a strong, randomly generated JWT secret. The GitHub token is used by the backend's GitHub integration; keep it private and grant only the permissions needed.

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

### Frontend

Run these commands from `FRONTEND/`.

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

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
| GET | `/api/trackers` | List trackers |
| POST | `/api/trackers` | Create a tracker |
| GET | `/api/github/profile/:username` | Fetch a GitHub profile |
| GET | `/api/github/repos/:username` | Fetch GitHub repositories |
| GET | `/api/github/stats/:username` | Fetch repository and contribution stats for the GitHub dashboard |

The hackathon, tracker, and GitHub routes require authentication where configured. Requests that require authentication should include the JWT in the `Authorization` header as a Bearer token.

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
