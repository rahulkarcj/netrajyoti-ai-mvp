# NetraJyoti AI MVP

NetraJyoti is a Bengali-first, non-diagnostic eye-care guidance PWA for rural West Bengal. It helps people describe an eye-health concern, understand a safe next step, and identify an appropriate type of eye-care service without relying on text-heavy English applications. It routes users to one of three fixed outcomes: urgent care, routine care, or human support. It does not diagnose conditions or prescribe treatment.

## Structure

- `frontend/` — React, TypeScript, Vite, Tailwind CSS and PWA shell.
- `backend/` — Java 21, Spring Boot 3 REST API with deterministic routing rules.
- `docker-compose.yml` — local PostgreSQL for the service directory and aggregate events.

## Run locally

1. Set the PostgreSQL and backend connection values in your terminal or secret manager. Do not place them in a tracked file.
2. Start PostgreSQL: `docker compose up -d db`
3. In `backend`, run `mvn spring-boot:run`.
4. In `frontend`, run `npm install` then `npm run dev`.

The frontend uses `http://localhost:8080` by default. Set `VITE_API_BASE_URL` when deploying.

## Git and environment safety

- Commit source code, tests, `package-lock.json`, and `pnpm-lock.yaml` only when the team intentionally supports both package managers. This project is documented for npm, so use `npm install` and keep `package-lock.json` current.
- Do not commit `node_modules`, `frontend/dist`, `backend/target`, `.env` files, logs, or credentials. These are excluded by the root `.gitignore`.
- Keep all local configuration in your terminal, deployment secret store, or an untracked local file. No environment file is included in this repository.
- Before the first push, run `git status --ignored` and confirm that no API key, build output, or dependency directory is staged.

## Controlled AI caregiver summary (optional pilot)

The AI endpoint is off by default and always returns the approved Bengali fallback unless it is explicitly enabled. It accepts only a fixed `ROUTINE` outcome; it never receives voice, free text, location, identity, or urgent-routing data.

In the backend PowerShell window, set the key for that session and start the pilot:

```powershell
$env:OPENAI_API_KEY = "your_api_key_here"
$env:AI_SUMMARY_ENABLED = "true"
mvn spring-boot:run
```

Do not commit the key or place it in the React frontend. The backend validates every AI response and falls back to approved Bengali copy when AI is disabled, unavailable, or unsafe.

## Safety design

- The browser sends only selected, fixed red-flag answers to the routing API.
- Free-text and voice transcripts stay in the browser and are not used for triage or stored.
- Routing is deterministic and versioned in `SafetyRoutingService`.
- The PWA shows fixed clinician-approved Bengali-first outcome copy.
- The optional voice control has a typed fallback because browser speech recognition is not universally available.
