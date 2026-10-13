# Contributing to TrackHack

Thanks for your interest in contributing to TrackHack! Contributions of all sizes are welcome, whether you're fixing a bug, improving the UI, adding a feature, or updating documentation.

Please follow the guidelines below to keep contributions easy to review and maintain.

## Before You Start

- Check the existing issues and pull requests to avoid duplicate work.
- For larger changes, open an issue and discuss your proposed solution before starting.
- If an issue is assigned to someone else, check with the maintainers before working on it.
- Keep each pull request focused on one issue or a closely related set of changes.

## Development Setup

TrackHack uses React, Vite, Tailwind CSS, Bun, Express, and MongoDB.

### Prerequisites

- Bun (v1.2 or newer)
- MongoDB locally or through MongoDB Atlas
- Git

### 1. Fork and clone the repository

Fork the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-username>/TrackHack.git
cd TrackHack
```

### 2. Set up the backend

```bash
cd BACKEND
bun install
```

Create a `.env` file using the configuration documented in the root `README.md`. Add your MongoDB connection string and a secure JWT secret.

Start the backend using the development command configured in `BACKEND/package.json`:

```bash
bun run dev
```

### 3. Set up the frontend

Open another terminal:

```bash
cd FRONTEND
bun install
bun run dev
```

Configure the frontend API URL according to the root `README.md` and your local backend port.

## Branching Guidelines

Create a separate branch for each contribution. Use a descriptive name:

```bash
git checkout -b fix/login-validation
git checkout -b feat/hackathon-filtering
git checkout -b docs/setup-guide
```

Recommended prefixes:

- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — code improvements without intended behavior changes
- `test/` — tests

Avoid making unrelated changes on the same branch.

## Making Changes

- Follow the existing project structure and coding conventions.
- Reuse existing components, API utilities, and backend services where appropriate.
- Validate user input on the backend.
- Keep secrets and environment-specific settings out of source code.
- Preserve authentication and resource-ownership checks.
- Handle loading, empty, and error states in the UI.
- Avoid adding dependencies unless they are needed.
- Update documentation when changing configuration, endpoints, or application behavior.

## Testing Your Changes

Before opening a pull request:

- Run the frontend production build:

  ```bash
  bun run build
  ```

- Run the available frontend lint command:

  ```bash
  bun run lint
  ```

- Test the affected backend routes and frontend pages manually.
- Check browser console and server logs for errors.
- Verify that existing functionality still works.

Run commands from the appropriate `FRONTEND` or `BACKEND` directory. If a test script is not configured, mention that in your pull request rather than claiming the tests passed.

## Commit Messages

Use short, descriptive commit messages:

```text
feat: add hackathon filtering
fix: handle expired login tokens
docs: update installation instructions
refactor: reuse hackathon form component
test: cover tracker creation
```

## Pull Request Process

1. Commit your changes on your branch.
2. Push the branch to your fork.
3. Open a pull request against the repository's designated base branch.
4. Link the related issue using `Closes #<issue-number>` when appropriate.
5. Explain what changed and how you tested it.
6. Include screenshots for UI changes.
7. Respond to review feedback and update your branch if needed.

A pull request should not contain unrelated formatting changes, generated files, dependency directories, or secrets.

## Issue Guidelines

When reporting a bug, include:

- A clear title and description
- Steps to reproduce the problem
- Expected and actual behavior
- Relevant error messages or screenshots
- Environment details, when useful

When proposing a feature, explain the problem it solves and the intended behavior.

For contribution-event issues, claim or coordinate an issue according to the event rules. Points should be awarded only according to the maintainers' published policy, not simply because a pull request was opened.

## Security

Never commit `.env` files, database credentials, JWT secrets, or GitHub tokens. If you discover a security vulnerability, report it privately to the maintainers rather than publishing exploit details in a public issue.

## Questions

If you are unsure about an implementation, open an issue or ask the maintainers before making a large change.

Thanks for helping improve TrackHack!
