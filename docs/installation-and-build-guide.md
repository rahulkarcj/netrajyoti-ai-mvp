# NetraJyoti AI MVP — Installation and Build Guide

This guide runs the complete local demo: PostgreSQL, Ollama, the Spring Boot API, and the React frontend.

> The clinical-pathway records included with this MVP are **demo-simulated and not for clinical use**.

## Prerequisites

Install and start the following before continuing:

- Git
- Docker Desktop
- Java 21
- Maven 3.9 or later
- Node.js 20 or later (includes npm)

Check the installations in PowerShell:

```powershell
git --version
docker --version
java -version
mvn -version
node --version
npm --version
```

## Get the project

If the project was cloned from GitHub:

```powershell
cd C:\Capstone_Project
git clone https://github.com/rahulkarcj/netrajyoti-ai-mvp.git
cd netrajyoti-ai-mvp
```

If it was downloaded as a ZIP, extract it and open PowerShell in the extracted `netrajyoti-ai-mvp` folder instead.

## Start PostgreSQL and Ollama

Open a first PowerShell window:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp

$env:POSTGRES_DB = "netrajyoti"
$env:POSTGRES_USER = "netrajyoti_local_user"
$env:POSTGRES_PASSWORD = "ChooseYourOwnLocalPassword"

docker compose up -d db ollama
docker compose ps
```

Download the local language model once:

```powershell
docker compose exec ollama ollama pull llama3.2:3b
```

Expected ports:

- PostgreSQL: `5432`
- Ollama: `11434`

## Start the backend

Open a second PowerShell window:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp\backend

$env:DATABASE_URL = "jdbc:postgresql://localhost:5432/netrajyoti"
$env:DATABASE_USERNAME = "netrajyoti_local_user"
$env:DATABASE_PASSWORD = "ChooseYourOwnLocalPassword"

$env:AI_SUMMARY_ENABLED = "true"
$env:DEMO_RAG_ENABLED = "true"
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "llama3.2:3b"

mvn spring-boot:run
```

The backend runs at `http://localhost:8080`. On first start, it creates and seeds the local demo database.

## Start the frontend

Open a third PowerShell window:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp\frontend
npm install
npm run dev
```

Open the application in a browser:

```text
http://localhost:5173
```

## Verify the RAG and Ollama demo

Complete a new urgent, routine, or Human-support journey in the UI. The backend terminal should show either:

```text
Validated Ollama route explanation: route=ROUTINE
```

or a clear fallback reason:

```text
Ollama response not generated; displaying fixed Java safety fallback: route=ROUTINE, reason=...
```

Java always fixes the Urgent, Routine, or Human-support route. Ollama only creates a Bengali explanation after route guidance is retrieved.

## Build and test commands

Backend tests:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp\backend
mvn test
```

Backend package:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp\backend
mvn package
```

Frontend production build:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp\frontend
npm run build
```

## Stop the project

Press `Ctrl + C` in the backend and frontend terminals. Then run:

```powershell
cd C:\Capstone_Project\netrajyoti-ai-mvp

$env:POSTGRES_DB = "netrajyoti"
$env:POSTGRES_USER = "netrajyoti_local_user"
$env:POSTGRES_PASSWORD = "ChooseYourOwnLocalPassword"

docker compose down
```

`docker compose down` stops containers but retains local Docker volumes. It does not delete the database or downloaded Ollama model.

## Common issues

| Issue | What to do |
| --- | --- |
| Docker cannot connect | Start Docker Desktop and wait until it is ready. |
| Database authentication fails | Use the exact same database user and password in the Docker and backend windows. |
| Port 8080 is already in use | Stop the earlier Java backend process, then run `mvn spring-boot:run` again. |
| Port 5173 is already in use | Stop the earlier Vite process, or use the alternate URL printed by `npm run dev`. |
| Ollama guidance uses fallback | Confirm `AI_SUMMARY_ENABLED` and `DEMO_RAG_ENABLED` are both `true`; then check that `llama3.2:3b` is available. |
