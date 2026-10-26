# Deployment

The current app is a single Node.js and Express service that serves the built React frontend and stores its data in MongoDB. No Python service or relational database is needed.

## Local containers

```bash
docker compose up --build
```

Open <http://localhost:3000>. Compose builds the frontend and API into one image, starts MongoDB 7, waits for its health check, and stores database files in the `mongo-data` volume. Port 27017 is published only on the local loopback interface so a locally run development server can connect to the same database. Use `docker compose down` to stop the containers while keeping data.

## Production configuration

Set `MONGO_URL` to a reachable MongoDB connection string. Keep credentials in your hosting provider's secret settings, not in Git. The connection must allow the deployed service's network access. Set `NODE_ENV=production`. The app listens on `PORT` (default 3000) and exposes `/health` for readiness checks. Use HTTPS and set `COOKIE_SECURE=true` so session cookies require it. Set `TRUST_PROXY=true` when Express runs behind one trusted reverse proxy.

The image builds React with Vite and runs `node services/dealers/index.js`. On startup, the API connects to MongoDB, creates its indexes, and inserts demonstration data only where it is absent. Existing users and reviews remain in MongoDB across app restarts.

## Render blueprint

`render.yaml` defines one Docker web service. It prompts for `MONGO_URL` when you create the Blueprint. Provide an external MongoDB database before deploying; the Blueprint does not create a database. Configure the database to accept the Render service's connections, then deploy and check `/health` and the dealership list. The Blueprint sets `NODE_ENV=production`; Render supplies `PORT`.

The URL and screenshots under `evidence/` belong to the previous Django and PostgreSQL deployment. They do not demonstrate a running deployment of this MERN code. Verify a new deployment and record its URL separately before presenting it as live.

## Verification

```bash
npm run setup
npm test
npm run build
docker compose up --build -d --wait
curl http://localhost:3000/health
curl http://localhost:3000/api/get_dealers
docker compose down
```

The GitHub Actions workflow runs the Node tests, builds React, starts Compose, and checks the live API.
