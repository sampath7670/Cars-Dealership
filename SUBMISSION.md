# Cars Dealership assignment submission

Repository: **Cars-Dealership**

Project: **Cars Dealership — Full-Stack Capstone**

## Public code links

| Task | Public file URL |
| --- | --- |
| 1 | https://github.com/sampath7670/Cars-Dealership/blob/main/README.md |
| 3 | https://github.com/sampath7670/Cars-Dealership/blob/main/server/frontend/static/About.html |
| 4 | https://github.com/sampath7670/Cars-Dealership/blob/main/server/frontend/static/Contact.html |
| 7 | https://github.com/sampath7670/Cars-Dealership/blob/main/server/frontend/src/components/Register/Register.jsx |

## Local terminal evidence

Copy the contents of each named file from `evidence/` into the corresponding answer. These files contain commands/output captured from the running local application, not invented examples.

| Task | File |
| --- | --- |
| 2 | `django_server` |
| 5 | `loginuser` |
| 6 | `logoutuser` |
| 8 | `getdealerreviews` |
| 9 | `getalldealers` |
| 10 | `getdealerbyid` |
| 11 | `getdealersbyState` |
| 14 and 15 | `getallcarmakes` |
| 16 | `analyzereview` |

The login transcript uses a local-only demo account. Passwords, CSRF tokens, and CI service-token values are redacted from public transcripts; HTTP responses are unchanged. The original login/logout transcripts are delivered separately in the local private evidence package. The account database is excluded from GitHub. Obtain fresh CSRF tokens when reproducing requests.

## Screenshots

Local screenshots are saved as JPEG files in `evidence/`: `admin_login`, `admin_logout`, `get_dealers`, `get_dealers_loggedin`, `dealersbystate`, `dealer_id_reviews`, `dealership_review_submission`, and `added_review`.

**Tasks 18–20 need an additional full-browser capture with the address bar visible.** The page screenshot tool captures webpage content only, so the supplied page captures are not claimed to satisfy that particular requirement. Open these URLs and take an unedited browser-window screenshot:

- Task 18: `http://127.0.0.1:8000/` after login; include username and Review Dealer column.
- Task 19: `http://127.0.0.1:8000/?state=Kansas`.
- Task 20: `http://127.0.0.1:8000/dealer/1`.

## CI and deployment

- Task 23: `evidence/CICD` contains logs downloaded from an actual successful GitHub Actions run, including executed steps and the run URL. `CICD` is the filename used in the attached assignment; `CI/CD` cannot be a single portable filename because `/` separates directories.
- Task 24: `evidence/deploymentURL` contains https://cars-dealership-kfvx.onrender.com.
- Tasks 25–28: use `evidence/deployed_landingpage.jpeg`, `deployed_loggedin.jpeg`, `deployed_dealer_detail.jpeg`, and `deployed_add_review.jpeg`, respectively. These are actual screenshots of the verified Render deployment.

Tasks 18–20 still require the full browser-window captures described above. All other listed evidence has been captured. The free PostgreSQL database expires November 4, 2026.
