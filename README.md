# Cars Dealership

- **Repository name:** `Cars-Dealership`
- **Project name:** `Cars Dealership — Full-Stack Capstone`
- **Repository:** https://github.com/sampath7670/Cars-Dealership
- **Live application:** https://cars-dealership-kfvx.onrender.com

A responsive dealership directory and customer-review application built with React, Django, SQLite, a Flask/VADER sentiment service, and an optional Node.js/MongoDB dealer service. Visitors can browse eight demonstration dealerships, filter by state, inspect dealer details and reviews, and register or log in to post their own reviews.

## Features

- Five-field registration: Username, First Name, Last Name, Email, Password.
- Django authentication with hashed passwords, session cookies, and CSRF-protected registration, login, logout, and review posting.
- Dealer directory, Kansas filtering, detail pages, and customer reviews.
- Authenticated users see their username and a Review Dealer option.
- Review form includes rating, review text, purchase status, make/model/year, and purchase date.
- Review author is derived from the server session, never trusted from client input.
- VADER sentiment analysis labels positive, negative, and neutral reviews. Django can call the separate Flask service or use the same analyzer in-process.
- Django admin with car makes, car models, dealers, reviews, and users.
- About Us and Contact Us static pages with realistic stock photos and complete fictional team/contact details.
- GitHub Actions tests, React build, and Docker Compose integration checks.

## Local setup (Python 3.12+, Node.js 22+)

From the repository root:

```bash
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cd server/frontend
npm ci
npm run build
cd ../..
python server/manage.py migrate
python server/manage.py seed_data
python server/manage.py createsuperuser --username root
python server/manage.py runserver 127.0.0.1:8000
```

Open http://127.0.0.1:8000/. Sign up through the website to create a normal user. The admin is at http://127.0.0.1:8000/admin/. No admin password or account database is committed.

For a separate sentiment service, open another terminal using the same virtual environment:

```bash
python services/sentiment/app.py
```

Then set `SENTIMENT_URL=http://127.0.0.1:5000` before starting Django (PowerShell: `$env:SENTIMENT_URL='http://127.0.0.1:5000'`). Without that variable Django performs VADER analysis in-process. The captured local cURL evidence uses the running Flask service.

## Data modes

The default local mode stores users, makes, models, dealers, and reviews in SQLite. Setting `DEALER_SERVICE_URL` switches dealer/review reads and writes to the Node/MongoDB service; users and car data remain in Django's database. Do not switch data modes expecting previously posted reviews to migrate automatically.

For the selected Render demonstration deployment, `render.yaml` provisions PostgreSQL through `DATABASE_URL` and runs VADER within Django. This avoids ephemeral SQLite data loss. The Free database expires after 30 days; see `DEPLOYMENT.md` before deploying.

For the complete microservices stack, create an ignored `.env` file containing a randomly generated `SERVICE_TOKEN`, then run:

```bash
docker compose up --build
docker compose exec web python server/manage.py createsuperuser --username root
```

The web application is at http://localhost:8000. MongoDB, the Node service, and Flask are internal to the Compose network. Named volumes preserve the SQLite and MongoDB data. Compose is a local development configuration, not a public production configuration.

## Verification

```bash
python server/manage.py check
python server/manage.py test djangoapp --verbosity 2
cd server/frontend
npm ci
npm run build
```

Seven tests cover dealer lookup/filtering, models, sentiment, login/logout, registration, CSRF, review identity, purchase validation, and service failures. The CI workflow also builds all containers and checks Django against MongoDB and Flask. Check the actual workflow run for its current outcome; a workflow file alone is not evidence of a successful run.

## API routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/djangoapp/csrf` | Obtain CSRF token and cookie |
| GET | `/djangoapp/session` | Current logged-in username |
| POST | `/djangoapp/register` | Create user with all five fields |
| POST | `/djangoapp/login` | Login with username and password |
| POST | `/djangoapp/logout` | Logout current session |
| GET | `/djangoapp/get_dealers` | All dealerships |
| GET | `/djangoapp/get_dealers/Kansas` | Kansas dealerships |
| GET | `/djangoapp/dealer/1` | Dealer details |
| GET | `/djangoapp/reviews/dealer/1` | Dealer reviews |
| GET | `/djangoapp/get_cars` | All makes and models |
| GET | `/djangoapp/analyze/Fantastic%20services` | Sentiment result |
| POST | `/djangoapp/add_review` | Submit authenticated review |

For POST requests, obtain a token from `/djangoapp/csrf`, preserve the cookie jar, and send the token as `X-CSRFToken`. Login rotates the CSRF token; fetch it again before logout or another POST. See `scripts/capture_evidence.py` and the real command transcripts in `evidence/`.

## Structure and assignment

```text
server/
  cars/                         Django settings, URLs, WSGI
  djangoapp/                    Models, views, admin, tests, migrations
  seed/dealers.json              Fictional dealer fixtures
  frontend/
    static/About.html           Required About Us file
    static/Contact.html         Required Contact Us file
    static/site.css             Shared responsive styling
    static/images/              Locally bundled stock photographs
    src/components/Register/Register.jsx
    src/main.jsx                Directory, login, detail, review pages
services/
  dealers/                      Node.js / MongoDB microservice
  sentiment/                    Flask / VADER microservice
evidence/                       Actual local outputs and screenshots
scripts/                        Reproducible evidence capture
.github/workflows/ci.yml         Automated checks and container tests
Dockerfile, compose.yaml         Container packaging
DEPLOYMENT.md                    Hosting and persistence requirements
SUBMISSION.md                    Task-by-task evidence and outstanding items
```

## Demonstration content and assets

All dealership addresses, phone numbers, team identities, and `.example` email addresses are fictional capstone data. They must not be used for real inquiries. Stock photos represent the fictional team rather than actual employees. Image sources are documented in `ASSETS.md`.

Sentiment uses VADER (Hutto & Gilbert, 2014), a rule-based model; it can misread sarcasm and context. References: [Django CSRF documentation](https://docs.djangoproject.com/en/5.2/howto/csrf/), [Django deployment checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/), [VADER repository](https://github.com/cjhutto/vaderSentiment), and the [IBM capstone starter](https://github.com/ibm-developer-skills-network/xrwvm-fullstack_developer_capstone) for endpoint conventions. This implementation was written for this repository.
