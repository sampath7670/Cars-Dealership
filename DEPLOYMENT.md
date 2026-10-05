# Deployment

No live deployment URL is claimed until an actual hosting account is selected and a successful deployment is verified. A GitHub repository URL, localhost URL, or static frontend preview does not satisfy Tasks 24–28.

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
