# NetraJyoti AI MVP

NetraJyoti is a Bengali-first, non-diagnostic eye-care guidance PWA for rural West Bengal. It helps people describe an eye-health concern, understand a safe next step, and identify an appropriate type of eye-care service without relying on text-heavy English applications. It routes users to one of three fixed outcomes: urgent care, routine care, or human support. It does not diagnose conditions or prescribe treatment.

## Structure

- `frontend/` — React, TypeScript, Vite, Tailwind CSS and PWA shell.
- `backend/` — Java 21, Spring Boot 3 REST API with deterministic safety routing, approved clinical-pathway retrieval, and a guarded Ollama integration.
- `docker-compose.yml` — local PostgreSQL plus a local Ollama service.

## Run locally

1. Set the PostgreSQL and backend connection values in your terminal or secret manager. Do not place them in a tracked file.
2. Start PostgreSQL and Ollama: `docker compose up -d db ollama`
3. Pull the local model once: `docker compose exec ollama ollama pull llama3.2:3b`
4. In `backend`, set `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and (optionally) `AI_SUMMARY_ENABLED=true`; then run `mvn spring-boot:run`. Startup creates and seeds the clinical-pathway tables.
5. In `frontend`, run `npm install` once after a fresh clone or dependency change, then `npm run dev`.

The frontend uses `http://localhost:8080` by default. Set `VITE_API_BASE_URL` when deploying.

## Git and environment safety

- Commit source code, tests, `package-lock.json`, and `pnpm-lock.yaml` only when the team intentionally supports both package managers. This project is documented for npm, so use `npm install` and keep `package-lock.json` current.
- Do not commit `node_modules`, `frontend/dist`, `backend/target`, `.env` files, logs, or credentials. These are excluded by the root `.gitignore`.
- Keep all local configuration in your terminal, deployment secret store, or an untracked local file. No environment file is included in this repository.
- Before the first push, run `git status --ignored` and confirm that no API key, build output, or dependency directory is staged.

## Ollama RAG route explanation (optional pilot)

The optional AI endpoint uses **local Ollama**, not OpenAI. It is off by default. The same process applies to all three routes: structured current-symptom and optional structured history codes retrieve only approved clinical criteria and guidance from PostgreSQL; Java then determines `URGENT`, `ROUTINE`, or `HUMAN_SUPPORT`; Ollama explains that fixed route in Bengali; and one final Java safety-and-audit gate validates the output. If any step is unavailable, the API returns fixed Bengali fallback copy.

It never receives voice, free text, location, patient name, age, address, phone number, records, photographs, or prescriptions. It is not a diagnosis, prescription, medicine, dosage, or appointment-booking feature. The seed pathways cite WHO VESIH, WHO PECI, WHO Eye Care in Health Systems — Guide for Action, and India DGHS/NPCBVI. They are intentionally marked `DRAFT_DEMO_NOT_CLINICALLY_APPROVED`, so they are stored in PostgreSQL but cannot influence routing or Ollama output. A qualified ophthalmologist must review, approve, version, and activate content before any real use.

Install Ollama, download the local models, then enable the feature in the backend PowerShell window:

```powershell
# Start PostgreSQL and the local Ollama server.
docker compose up -d db ollama
docker compose exec ollama ollama pull llama3.2:3b

# Start the backend with AI enabled after credentials are configured.
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "llama3.2:3b"
$env:AI_SUMMARY_ENABLED = "true"
mvn spring-boot:run
```

Ollama does not need an API key for local use. Do not expose Ollama directly to the browser or to the public internet. The Java backend validates every model response and falls back to approved Bengali copy when Ollama, RAG retrieval, or validation is unavailable.

## Safety design

- The browser sends only selected fixed current-symptom and optional structured eye-care history codes to the routing API.
- Voice, free text, records, photographs, prescriptions, location, and personal details do not influence triage and are not sent to the AI endpoint.
- Routing is deterministic, versioned, and selected only by Java after approved clinical criteria retrieval.
- Model output cannot change the route and is subjected to one final Java safety-and-audit gate.
- The PWA shows fixed Bengali-first fallback outcome copy when approved content or Ollama is unavailable.
- The optional voice control has a typed fallback because browser speech recognition is not universally available.
