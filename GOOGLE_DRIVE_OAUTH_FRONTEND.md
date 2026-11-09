# OurVision Google Drive – frontend integration notes

## Status
This archive is prepared with the integration contract, but no Google OAuth secret or token is used in React. The backend Drive endpoints are not wired yet; the existing photo upload/display screens continue to use their current `/api/users/...` routes and should remain operational.

## Existing photo endpoints used by the UI
- Profile: `PUT /api/users/{id}/image` and `GET /api/users/{id}/image`.
- Member photo: `PUT /api/users/{id}/information/photo` and `GET /api/users/{id}/information/photo`.
- API helper: `src/api.js` adds the existing Bearer JWT.

## Planned admin screen contract
After the backend OAuth endpoints are implemented, add an Admin-only Settings page with:
- `GET /api/google-drive/status` – connected state and account email (never return tokens).
- `GET /api/google-drive/oauth/start` – browser redirect to Google authorization.
- `POST /api/google-drive/disconnect` – disconnect after confirmation.
- `POST /api/google-drive/migration/start` – start a resumable migration.
- `GET /api/google-drive/migration/status` – counts for pending/uploaded/verified/failed.

The frontend should only display status/progress. Google OAuth client secret and refresh token must remain exclusively on the backend. Keep photo URLs as same-origin/backend API routes so the backend can authorize and stream private Drive files.

## Build
Run `npm ci` then `npm run build`. Configure `VITE_API_BASE_URL` to the backend origin (without `/api` or with `/api`; `src/api.js` normalizes either).
