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
- GitHub Actions has built and uploaded the app over FTPS. Production still requires the cPanel Node.js application registration.
- Configure cPanel Setup Node.js App with application root `nls-ai-app`, base URI `/nls-ai`, startup file `app.js`, production mode, and a supported Node version of at least 20. The prior generic Passenger registration was removed after it attempted to use an unavailable `/usr/bin/node`.
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
- GitHub Actions run `45423846731` completed successfully. The hosted `/nls-ai/` and `/nls-ai/api/health` routes returned HTTP 404 on 2026-11-25, before Node.js registration.

## Version Log

- 2026-11-24: Added authoritative project context and prepared GitHub-to-cPanel deployment for the `/nls-ai/` production route.
- 2026-11-25: Recorded the successful build and FTPS upload and identified the required cPanel Node.js registration.

