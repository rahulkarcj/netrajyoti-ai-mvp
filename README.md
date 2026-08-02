# NetraJyoti AI MVP

NetraJyoti is a Bengali-first, non-diagnostic eye-care guidance PWA. It routes a user to one of three fixed outcomes: urgent care, routine care, or human support. It does not diagnose conditions or prescribe treatment.

## Structure

- `frontend/` — React, TypeScript, Vite, Tailwind CSS and PWA shell.
- `backend/` — Java 21, Spring Boot 3 REST API with deterministic routing rules.
- `docker-compose.yml` — local PostgreSQL for the service directory and aggregate events.

## Run locally

1. Start PostgreSQL: `docker compose up -d db`
2. In `backend`, run `mvn spring-boot:run`.
3. In `frontend`, run `npm install` then `npm run dev`.

The frontend uses `http://localhost:8080` by default. Set `VITE_API_BASE_URL` when deploying.

## Git and environment safety

- Commit source code, tests, `package-lock.json`, and `pnpm-lock.yaml` only when the team intentionally supports both package managers. This project is documented for npm, so use `npm install` and keep `package-lock.json` current.
- Do not commit `node_modules`, `frontend/dist`, `backend/target`, `.env` files, logs, or credentials. These are excluded by the root `.gitignore`.
- Use `frontend/.env.example` and `backend/.env.example` as non-secret references. Copy values into your local shell or an untracked `.env` file only if your local tooling supports it.
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
