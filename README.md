# NetraJyoti AI MVP

NetraJyoti is a Bengali-first, non-diagnostic eye-care guidance PWA for rural West Bengal. It helps people describe an eye-health concern, understand a safe next step, and identify an appropriate type of eye-care service without relying on text-heavy English applications. It routes users to one of three fixed outcomes: urgent care, routine care, or human support. It does not diagnose conditions or prescribe treatment.

## Structure

- `frontend/` — React, TypeScript, Vite, Tailwind CSS and PWA shell.
- `backend/` — Java 21, Spring Boot 3 REST API with deterministic safety routing, approved clinical-pathway retrieval, and a guarded Ollama integration.
- `docker-compose.yml` — local PostgreSQL plus a local Ollama service.

## Prerequisites

- Git
- Docker Desktop
  - Used to run the local PostgreSQL database and local Ollama service through Docker Compose.
  - A separate PostgreSQL or Ollama installation is not required.
- Java Development Kit (JDK) 21
- Node.js with npm

## Run locally

1. Set the local environment values below in PowerShell. Do not place real credentials in a tracked file.

   ```powershell
   $env:POSTGRES_DB = "netrajyoti"
   $env:POSTGRES_USER = "netrajyoti_local_user"
   $env:POSTGRES_PASSWORD = "ChooseYourOwnLocalPassword"
   $env:DATABASE_URL = "jdbc:postgresql://localhost:5432/netrajyoti"
   $env:DATABASE_USERNAME = "netrajyoti_local_user"
   $env:DATABASE_PASSWORD = "ChooseYourOwnLocalPassword"
   $env:AI_SUMMARY_ENABLED = "true"
   $env:DEMO_RAG_ENABLED = "true"
   $env:OLLAMA_BASE_URL = "http://localhost:11434"
   $env:OLLAMA_MODEL = "llama3.2:3b"
   ```

2. Start PostgreSQL and Ollama: `docker compose up -d db ollama`
3. Pull the local model once: `docker compose exec ollama ollama pull llama3.2:3b`
4. In `backend`, run `mvn spring-boot:run`. Startup creates and seeds the clinical-pathway tables.
5. In `frontend`, run `npm install` once after a fresh clone or dependency change, then `npm run dev`.

Open the frontend at `http://localhost:5173`. The frontend calls the backend at `http://localhost:8080` by default; set `VITE_API_BASE_URL` when deploying. If the frontend is hosted on another origin, set `CORS_ORIGIN` for the backend.

## Verify the build

```powershell
cd backend
mvn test

cd ..\frontend
npm run build
```

For more detailed Windows, IntelliJ, and WebStorm setup instructions, see [the installation and build guide](docs/installation-and-build-guide.md). The UI workflow wireframe is available at [docs/index.html](docs/index.html).

## Git and environment safety

- Commit source code, tests, `package-lock.json`, and `pnpm-lock.yaml` only when the team intentionally supports both package managers. This project is documented for npm, so use `npm install` and keep `package-lock.json` current.
- Do not commit `node_modules`, `frontend/dist`, `backend/target`, `.env` files, logs, or credentials. These are excluded by the root `.gitignore`.
- Keep all local configuration in your terminal, deployment secret store, or an untracked local file. No environment file is included in this repository.
- Before the first push, run `git status --ignored` and confirm that no API key, build output, or dependency directory is staged.

## PostgreSQL-backed routing and Ollama RAG explanation (optional demo)

PostgreSQL has two separate responsibilities in NetraJyoti:

1. **Deterministic routing repository:** Java retrieves criteria that match the user's selected symptom codes and then fixes one safe route: `URGENT`, `ROUTINE`, or `HUMAN_SUPPORT`.
2. **RAG knowledge store:** after Java has fixed the route, PostgreSQL retrieves the route-specific Bengali guidance and source information. This retrieved context grounds Ollama's Bengali explanation.

The optional AI endpoint uses **local Ollama**, not OpenAI, and is off by default. The same process applies to all three routes: PostgreSQL retrieves matching criteria; Java applies the fixed priority order `URGENT` → `HUMAN_SUPPORT` → `ROUTINE`; PostgreSQL retrieves guidance for the fixed route; Ollama explains that route in Bengali; and a final Java safety-and-audit gate validates the output. Ollama cannot select or override the route. If Ollama, retrieval, or validation is unavailable, the API returns fixed Bengali fallback copy.

It never receives voice, free text, location, patient name, age, address, phone number, records, photographs, or prescriptions. It is not a diagnosis, prescription, medicine, dosage, or appointment-booking feature. The seed pathways cite WHO VESIH, WHO PECI, WHO Eye Care in Health Systems — Guide for Action, and India DGHS/NPCBVI.

The seeded records are marked `DEMO_SIMULATED_NOT_FOR_CLINICAL_USE`. They are available to the capstone demo only when `DEMO_RAG_ENABLED=true`; in that mode, they deliberately support database-driven Java routing and RAG retrieval. They are not clinically approved or production eligible. A qualified ophthalmologist must review, approve, version, and activate content before any real use.

Install Ollama, download the local models, then enable the feature in the backend PowerShell window:

```powershell
# Start PostgreSQL and the local Ollama server.
docker compose up -d db ollama
docker compose exec ollama ollama pull llama3.2:3b

# Start the backend with AI enabled after credentials are configured.
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "llama3.2:3b"
$env:AI_SUMMARY_ENABLED = "true"
$env:DEMO_RAG_ENABLED = "true"
mvn spring-boot:run
```

Ollama does not need an API key for local use. Do not expose Ollama directly to the browser or to the public internet. The Java backend validates every model response and falls back to approved Bengali copy when Ollama, RAG retrieval, or validation is unavailable.

## Safety design

- The browser sends only selected fixed current-symptom and optional structured eye-care history codes to the routing API.
- Voice, free text, records, photographs, prescriptions, location, and personal details do not influence triage and are not sent to the AI endpoint.
- Routing is deterministic, versioned, and selected only by Java after PostgreSQL criteria retrieval. In the capstone demo, simulated PostgreSQL criteria are explicitly enabled with `DEMO_RAG_ENABLED=true`.
- Model output cannot change the route and is subjected to one final Java safety-and-audit gate.
- The PWA shows fixed Bengali-first fallback outcome copy when approved content or Ollama is unavailable.
- The optional voice control has a typed fallback because browser speech recognition is not universally available.
