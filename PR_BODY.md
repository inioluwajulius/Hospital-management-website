Title: fix(password): avoid recursion in password validation

Summary:
This change fixes a recursion bug in the frontend password validation utilities that caused a "Maximum call stack size exceeded" runtime error when interacting with the password input (clicking/toggling visibility). The patch also adjusts how password strength is calculated.

Changes:
- hospital-frontend/src/utils/validation/password.js
  - Avoid recursive call when computing `isStrong` in `getPasswordChecks`
  - Count explicit checks for strength calculation in `getPasswordStrength`

- hospital-backend/controllers/authController.js
  - Align staff/patient registration responses with existing tests by returning the expected messages/status (patients set to pending).

- hospital-backend/server.js
  - Mount legacy `/api/patients` route so older clients/tests continue to work.

Why:
- Reproduced a runtime crash when clicking the password field; Playwright captured a "Maximum call stack size exceeded" page error.
- Root cause: `getPasswordChecks` used `isPasswordStrong` which called `validatePassword` -> `getPasswordChecks` (indirect recursion).

Verification steps:
1. Backend tests pass locally:
   - Run from repo root: `cd hospital-backend && npm test`
   - Expected: all backend tests pass (8/8 suites).

2. Frontend build succeeds:
   - Run from repo root: `cd hospital-frontend && npm run build`
   - Expected: `dist/` produced, build warnings about chunk size may appear.

3. Reproduce locally (optional):
   - Start frontend dev server: `cd hospital-frontend && npm run dev`
   - Visit `http://localhost:5173/auth/register/doctor` and click the password input to verify no blank screen occurs.

Notes:
- I pushed branch `fix/password-recursion` to origin. Create the PR at:
  https://github.com/inioluwajulius/Hospital-management-website/pull/new/fix/password-recursion

If you want, I can open the PR for you (requires GitHub CLI or API token). Otherwise copy the above link into your browser to create the PR with this content.
