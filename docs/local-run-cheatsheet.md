# NetraJyoti AI MVP — Local Run Cheat Sheet

Run each service in its own PowerShell window. The database credentials below are for local demonstration only; do not use them in a deployed environment.

## 1. Start PostgreSQL and Ollama

```powershell
cd C:\Capstone_Project\netrajyoti-app

$env:POSTGRES_DB = "netrajyoti"
$env:POSTGRES_USER = "netrajyoti_local_user"
$env:POSTGRES_PASSWORD = "ChooseYourOwnLocalPassword"

docker compose up -d db ollama
```

Verify the containers:

```powershell
docker compose ps
```

Expected services:

- `db` on port `5432`
- `ollama` on port `11434`

Verify the local model is available:

```powershell
docker exec netrajyoti-app-ollama-1 ollama list
```

If `llama3.2:3b` is absent, download it once:

```powershell
docker exec netrajyoti-app-ollama-1 ollama pull llama3.2:3b
```

## 2. Start the Java backend

```powershell
cd C:\Capstone_Project\netrajyoti-app\backend

$env:DATABASE_URL = "jdbc:postgresql://localhost:5432/netrajyoti"
$env:DATABASE_USERNAME = "netrajyoti_local_user"
$env:DATABASE_PASSWORD = "ChooseYourOwnLocalPassword"

$env:AI_SUMMARY_ENABLED = "true"
$env:DEMO_RAG_ENABLED = "true"
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "llama3.2:3b"

mvn spring-boot:run
```

Backend URL: `http://localhost:8080`

Stop it: press `Ctrl + C` in this terminal.

## 3. Start the React frontend

```powershell
cd C:\Capstone_Project\netrajyoti-app\frontend
npm run dev
```

Open: `http://localhost:5173`

Stop it: press `Ctrl + C` in this terminal.

Run this only after a fresh clone, after deleting `node_modules`, or when dependencies change:

```powershell
npm install
```

## 4. Validate the application

Backend tests:

```powershell
cd C:\Capstone_Project\netrajyoti-app\backend
mvn test
```

Frontend production build:

```powershell
cd C:\Capstone_Project\netrajyoti-app\frontend
npm run build
```

## 5. Stop Docker services

```powershell
cd C:\Capstone_Project\netrajyoti-app

$env:POSTGRES_DB = "netrajyoti"
$env:POSTGRES_USER = "netrajyoti_local_user"
$env:POSTGRES_PASSWORD = "ChooseYourOwnLocalPassword"

docker compose down
```

`docker compose down` stops containers but retains the local PostgreSQL and Ollama volumes. It does not delete the database or downloaded Ollama model.

## Quick troubleshooting

| Problem | Command / action |
| --- | --- |
| Docker is not running | Open Docker Desktop, wait until it is running, then run `docker compose up -d db ollama`. |
| Database password error | Ensure the same database name, user, and password are set in both the Docker and backend terminals. |
| Port 5432, 8080, 5173, or 11434 already in use | Stop the process using that port, or stop the earlier NetraJyoti terminal/service before starting again. |
| AI output shows fallback guidance | Set both `AI_SUMMARY_ENABLED=true` and `DEMO_RAG_ENABLED=true`, then confirm Ollama is running and the backend log reports a validated response. Demo records are for demonstration only and not for clinical use. |
| Ollama model unavailable | Run `docker exec netrajyoti-app-ollama-1 ollama pull llama3.2:3b`. |
