# Deployment

Live application: https://cars-dealership-kfvx.onrender.com

Verified on October 5, 2026: Render deployment live; health endpoint HTTP 200; dealer directory and registration working; authenticated review submitted and displayed with positive sentiment. Deployment screenshots and URL are in `evidence/`.

Resources use the Free plans in Sampath's workspace, Oregon. The free PostgreSQL database expires November 4, 2026. Deployment is managed by the repository Blueprint and automatically updates from `main`.

## Selected demonstration host: Render

`render.yaml` defines a free Docker web service and free PostgreSQL database. Install/connect Render or sign in at https://dashboard.render.com, create a Blueprint from this repository, and review the two Free plans before deploying. The root Dockerfile builds React and serves it through Django/Gunicorn/WhiteNoise. `DATABASE_URL` selects PostgreSQL, and `RENDER_EXTERNAL_HOSTNAME` configures Django's allowed host and trusted HTTPS origin automatically.

This economical deployment runs sentiment analysis inside Django and uses PostgreSQL for dealers/reviews. The separately containerized Node/MongoDB and Flask architecture remains available and is tested by GitHub Actions via Docker Compose. The Render demonstration does not claim to run those separate services.

Render Free web instances sleep after 15 minutes of inactivity; wake-up can take about a minute. Free PostgreSQL expires after 30 days and is unsuitable for permanent storage. See https://render.com/docs/free. No paid upgrade is authorized or configured.

## Required configuration

Use the root Dockerfile for Django/React, `services/sentiment/Dockerfile` for Flask, and `services/dealers/Dockerfile` for Node/MongoDB. Configure the web service with:

- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY`: a private, random secret (never commit it).
- `DJANGO_ALLOWED_HOSTS`: the deployment hostname, without scheme.
- `CSRF_TRUSTED_ORIGINS`: the complete HTTPS origin.
- `SENTIMENT_URL`: the deployed Flask service URL.
- `DEALER_SERVICE_URL`: the deployed Node service URL.
- `SERVICE_TOKEN`: the same private random token configured on the Node service.
- `DATABASE_PATH`: a SQLite path on persistent storage.
- Node service `MONGO_URL`: a private MongoDB connection string; keep it out of source control.

The web image uses Gunicorn and WhiteNoise, runs migrations, and idempotently seeds demonstration data. Set the platform port to 8000 (or set `PORT`). A health probe can request `/health`.

## Persistence matters

Container filesystems are commonly ephemeral. Do not deploy SQLite to ephemeral storage and claim durable accounts or car data. Use a persistent volume and one web replica, or replace the database configuration with a managed relational database before scaling. MongoDB also needs persistent storage. Keep MongoDB and internal service endpoints private wherever the platform supports it.

## IBM Cloud Code Engine

Use your course lab or IBM Cloud account to build/deploy the three service images and provision MongoDB. Configure service URLs and secrets through the platform. Confirm the account's storage options for Django; if persistent SQLite storage is unavailable, use a managed PostgreSQL database with the appropriate Django driver/settings. These account-specific resources must be provisioned before a working deployment can be verified.

## Capture the deployed evidence

After the real HTTPS application is reachable:

1. Save its actual URL to `evidence/deploymentURL`.
2. Capture `deployed_landingpage.jpeg` while logged out.
3. Register or log in using a demonstration account, then capture `deployed_loggedin.jpeg` with the username visible.
4. Open a dealer and capture `deployed_dealer_detail.jpeg`.
5. Post a genuine test review and capture `deployed_add_review.jpeg`.

Never substitute local screenshots for deployed screenshots. Keep real credentials out of screenshots and GitHub.
