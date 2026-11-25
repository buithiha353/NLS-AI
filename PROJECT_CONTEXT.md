# PROJECT_CONTEXT

Last updated: 2026-11-25
Project root: `E:\AntiGravity\NLS-AI-import`

## Purpose And Scope

NLS-AI is a Vietnamese teacher tool for reviewing lesson plans, matching digital-competency and AI indicators, and generating structured integration suggestions with Gemini. This repository is the authoritative source for the standalone application deployed under the THCS Le Loi - Yet Kieu website.

## Current State

- Main branch: `main` in `https://github.com/buithiha353/NLS-AI`.
- Frontend: React 19 + Vite + Tailwind.
- Backend: Express with a Gemini-powered `/api/analyze-lesson` endpoint.
- Production target: `https://thcsleloi-yetkieu.edu.vn/nls-ai/` on the dedicated Tenten cPanel account.
- cPanel Setup Node.js App runs the application in production mode on Node.js 22.23.5 with root `nls-ai-app`, URL `/nls-ai`, and startup file `app.js`.
- Passenger forwards the public path prefix, so the production server accepts paths with and without `/nls-ai`. The GitHub Actions workflow checks the public health endpoint after redeploying.
- Runtime `GEMINI_API_KEY` must remain outside Git and be configured only in the hosting application environment.

## Architecture And Important Paths

- Main UI: `src/App.tsx`.
- Workflow UI: `src/components/WorkflowSteps.tsx`.
- Server: `server.ts`.
- Vite configuration: `vite.config.ts`.
- Production client build: `dist` (generated and ignored).
- Production server bundle: `app.cjs` (generated and ignored), loaded by Passenger's tracked `passenger-entry.js` wrapper deployed as `app.js`.
- Deployment helper: `deploy.js`.
- GitHub Actions workflow: `.github/workflows/deploy.yml`.

## Workflow Rules And Constraints

- Never commit real `.env` files, Gemini keys, FTP credentials, or generated dependency/build directories.
- A push to `main` builds the client and server, uploads them to the dedicated `nls-ai-app` hosting directory, and touches `tmp/restart.txt` so Passenger reloads the app.
- The Vite production base path is `/nls-ai/`; local development keeps `/`.
- Deployment credentials are stored as GitHub Actions secrets named `DEPLOY_FTP_HOST`, `DEPLOY_FTP_USER`, and `DEPLOY_FTP_PASSWORD`.

## Known Gaps And Risks

- The declared `esbuild ^0.25.0` conflicts with Vite 8.3's current optional peer range under npm, so CI uses legacy peer resolution while retaining the existing Bun lockfile.
- Gemini analysis cannot succeed until `GEMINI_API_KEY` is configured in the cPanel Passenger application environment.
- The main JavaScript bundle currently exceeds Vite's 500 kB warning threshold; code splitting can be improved later.

## Validation Status

- TypeScript validation, the Vite client build at base `/nls-ai/`, the bundled Node 20 server, and local production health/home checks passed on 2026-11-24.
- On 2026-11-25 GitHub Actions run `45642146483` uploaded the path-prefix fix and passed the live health check. The homepage and JavaScript asset returned HTTP 200, and the analysis API correctly returned HTTP 400 JSON for an empty submission. A Gemini analysis with valid inputs still requires the runtime key.

## Version Log

- 2026-11-24: Added authoritative project context and prepared GitHub-to-cPanel deployment for the `/nls-ai/` production route.
- 2026-11-25: Recorded the successful build and FTPS upload and identified the required cPanel Node.js registration.
- 2026-11-25: Registered the live app with cPanel Node.js 22, fixed public path handling, and added a post-deploy health check.
- 2026-11-25: Verified the automatic NLS-AI deployment, public homepage and assets, health endpoint, and analysis input validation.

