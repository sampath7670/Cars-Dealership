# Cars Dealership

A full stack car dealership directory built with MongoDB, Express, React, and Node.js. Visitors can browse eight seeded, fictional dealerships, filter by state or name, read reviews, register, log in, and post reviews. The Express server stores dealers, car models, users, sessions, and reviews in MongoDB and serves the production React build.

## Run with Docker

Install Docker with Compose, then from the repository root run:

```bash
docker compose up --build
```

Open <http://localhost:3000>. The first start seeds demonstration dealerships, car models, and a sample review. MongoDB data persists in the `mongo-data` volume. To stop the app, use `docker compose down`; adding `-v` would remove the stored data.

## Run locally

Requirements: Node.js 22+, npm, and MongoDB 7+.

```bash
npm run setup
npm run dev
```

The root setup command installs the API and React dependencies. The development command starts Express at <http://localhost:3000> and Vite at <http://localhost:5173>; open the Vite URL for live frontend updates. It expects MongoDB at `mongodb://127.0.0.1:27017/cars_dealership` by default. You can start only the MongoDB container with `docker compose up -d mongo`, or set `MONGO_URL` to an existing MongoDB connection string.

To serve the production frontend with Express:

```bash
npm run build
npm start
```

Open <http://localhost:3000>. On Windows PowerShell, set an alternate database first with `$env:MONGO_URL='mongodb://127.0.0.1:27017/cars_dealership'`. On macOS or Linux, use `export MONGO_URL='mongodb://127.0.0.1:27017/cars_dealership'`.

## Commands

| Command | Action |
| --- | --- |
| `npm run setup` | Install API and frontend dependencies |
| `npm run dev` | Start Express and Vite for development |
| `npm run build` | Build the React frontend |
| `npm start` | Start Express and serve the built frontend |
| `npm test` | Run API tests |
| `docker compose up --build` | Run app and MongoDB in containers |

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGO_URL` | `mongodb://127.0.0.1:27017/cars_dealership` | MongoDB connection string |
| `MONGO_DB` | `cars_dealership` | Optional database name override |
| `PORT` | `3000` | Express listen port |
| `NODE_ENV` | `development` | Set to `production` for deployment |
| `TRUST_PROXY` | `false` | Set `true` behind one trusted HTTPS reverse proxy |
| `COOKIE_SECURE` | inferred from request scheme | Set `true` to require HTTPS for session cookies |

Accounts use hashed passwords. Login creates an opaque session token; MongoDB stores only its hash. The browser receives the token as an HTTP-only, SameSite=Lax cookie. Review authors are read from the active session.

## API

The browser calls the Express API on the same origin. JSON endpoints include:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/health` | Database-backed health check |
| GET | `/api/session` | Current session |
| POST | `/api/register` | Create an account |
| POST | `/api/login` | Sign in |
| POST | `/api/logout` | Sign out |
| GET | `/api/get_dealers` | Dealerships |
| GET | `/api/dealer/:id` | One dealership |
| GET | `/api/reviews/dealer/:id` | Reviews for a dealership |
| GET | `/api/get_cars` | Vehicle makes and models |
| GET | `/api/analyze/:text` | Simple sentiment classification |
| POST | `/api/add_review` | Post an authenticated review |

For example:

```bash
curl http://localhost:3000/api/get_dealers
curl http://localhost:3000/api/dealer/1
```

## Project structure

```text
services/dealers/       Express API, MongoDB data access, tests
server/seed/            Fictional dealer seed data
server/frontend/        React app built with Vite
Dockerfile              Production Node image with built React assets
compose.yaml            App and persistent MongoDB for local use
render.yaml             Optional web service blueprint
```

The dealer names, addresses, contacts, and team identities are fictional demonstration content. Photo credits are in [ASSETS.md](ASSETS.md). The `evidence/`, `SUBMISSION.md`, and `EVIDENCE-STATUS.md` files document an earlier architecture and deployment; they are historical and do not verify this MERN version. See [DEPLOYMENT.md](DEPLOYMENT.md) for current deployment steps.
