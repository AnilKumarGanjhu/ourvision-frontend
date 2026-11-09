# Member Information frontend integration notes

## Frontend changes in this package

- Fixed API base URL normalization. `VITE_API_BASE_URL` may be set to either `http://localhost:8080` or `http://localhost:8080/api`; requests no longer accidentally become `/api/api/...`.
- Fixed malformed expressions in the Member Information component that prevented a valid build/parse.
- Existing user profile data is fetched and displayed even if the additional-information endpoint is unavailable. An error message is shown for the unavailable additional endpoint instead of hiding the entire existing profile.
- Added red status styling for `INACTIVE`, `DISABLED`, `BLOCKED`, and `SUSPENDED` statuses.
- `.env` is intentionally not included. Copy `.env.example` to `.env` and set the backend URL for your environment.

## Backend contract required for full persistence

The frontend uses these endpoints:

- `GET /api/users`
- `GET /api/users/{id}`
- `GET /api/users/{id}/image` (for users with a profile image)
- `GET /api/users/{id}/information`
- `PATCH /api/users/{id}/information`

The additional-information endpoint must read/write these fields: `loanStatus`, `loanDuration`, `totalLoansTaken`, `joiningDate`, `fatherName`, `motherName`, `maritalStatus`, `nationality`, `languagesKnown`, and `emergencyContactPerson`.

The backend ZIP was not included with the uploaded frontend, so this package does not claim to add or verify the backend entity, repository, controller, security rules, or database migration. The additional-information API and its database columns must exist on the backend for the Save action to persist data. Existing user fields are intended to continue using the existing user API/database columns.


## Additional frontend updates

- Member Information select controls use a dark background and light text for member selection, marital status, and loan status.
- Added profile image selection, local preview, and upload action. The frontend sends `PUT /api/users/{id}/image` as multipart form data with field name `file`; the backend must implement/authorize this endpoint for upload to work.
- Forbidden (403) errors now explain which endpoint's backend security permission needs to be checked. Frontend code cannot override Spring Security authorization.
- If `GET /api/users/{id}/information` or `PATCH /api/users/{id}/information` returns 403, update backend security rules/role mapping for the logged-in user rather than removing authorization globally.
