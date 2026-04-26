# AI-Powered-Phishing-Email-Detection-System

PhishGuard is a React frontend plus a local Node backend for phishing email analysis. The frontend sends email content to `POST /api/analyze`, and the backend securely forwards that request to your deployed Hugging Face Gradio Space so your token stays off the client.

## Project structure

- `frontend/` - Vite + React user interface
- `backend/` - lightweight Node API bridge for the deployed Hugging Face Space

## Backend setup

1. Copy the values from `backend/.env.example` into your environment.
2. Set `HUGGING_FACE_SPACE_ID` if you want to override the default Space ID of `prajjwal1711/email-phishing-detector`.
3. Set `HUGGING_FACE_API_TOKEN` if your Space is private. For a public Space, you can leave it empty.
4. Run `npm install` inside `backend/`.
5. Start the backend from `backend/` with `npm run start` or `npm run dev`.

## Backend deployment on Render

Create a new `Web Service` in Render and point it at this repo.

Use these settings:

- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

Add these environment variables in Render:

- `HUGGING_FACE_SPACE_ID`
- `HUGGING_FACE_API_TOKEN`

Notes:

- Render will automatically inject `PORT`, and this backend already reads `process.env.PORT`.
- Use the health check path `/health` or `/api/health`.
- If your Hugging Face Space is public, `HUGGING_FACE_API_TOKEN` can stay empty.
- Your keep-alive cron job should ping the backend service URL, not the frontend URL.

Example backend URL:

```text
https://your-backend-service.onrender.com/health
```

## Frontend setup

1. Open `frontend/`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Set `VITE_API_BASE_URL`:
   - Use `http://localhost:8787` for local development
   - Use your deployed backend URL on Render for production builds, for example `https://your-backend-service.onrender.com`
4. Run `npm install` if dependencies are not already installed.
5. Start the frontend with `npm run dev`.

During development, Vite can still proxy `/api/*` requests to `http://localhost:8787`. If `VITE_API_BASE_URL` is set, the frontend will call that backend directly.

## Health check

For uptime monitoring or a Render keep-alive cron job, ping either of these backend routes:

- `GET /health`
- `GET /api/health`

Example response:

```json
{
  "ok": true,
  "service": "phishguard-backend",
  "status": "healthy",
  "timestamp": "2026-04-27T00:00:00.000Z",
  "uptime_seconds": 123
}
```

If you want Render to auto-detect the backend service from the repo, you can also use the included [render.yaml](render.yaml).

## Documentation

- [Testing and Validation Results](docs/testing-validation.md)
- [Test Cases](docs/test-cases.md)
- [Deployment Evidence Template](docs/deployment-evidence-template.md)
- [Risk and Threat Analysis](docs/risk-threat-analysis.md)
