# Evidence status

The implementation and local evidence are published at https://github.com/sampath7670/Cars-Dealership.

## Completed and verified

- Tasks 1, 3, 4, 7: required public source files and exact paths, with repository/project names, styled company/contact pages, images, and five-field registration.
- Tasks 2, 5, 6, 8–11, 14–16: actual running-server and cURL evidence. Login/logout public copies redact local credentials and CSRF tokens; original command transcripts are included separately in the private local evidence package.
- Tasks 12–13: actual root administrator login/logout screenshots.
- Task 17: dealer directory before login.
- Tasks 21–22: completed review form before submission and the posted review afterward.
- Task 23: actual successful GitHub Actions logs in `evidence/CICD`, with run URL and executed steps. CI token values are redacted.
- Tasks 24–28: verified Render deployment at https://cars-dealership-kfvx.onrender.com. Actual deployed screenshots include the landing page, logged-in username, dealer details, and successfully posted review. URL saved in `evidence/deploymentURL`.

## Needs final capture

- Tasks 18–20: page screenshots exist and show the correct content, but must be recaptured as full browser-window screenshots with the address bar. The native capture tool could not initialize in this session. No address bar has been fabricated or composited into the images.

## Deployment mode

The Docker Compose stack includes Django/React, Flask sentiment, Node.js, MongoDB, and SQLite. GitHub Actions builds and checks that stack. The selected free Render demonstration uses Django/React with PostgreSQL and in-process VADER to avoid ephemeral SQLite storage; it does not claim separately deployed MongoDB/Flask services. Render Free PostgreSQL expires after 30 days.
