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

## Frontend setup

1. Open `frontend/`.
2. Run `npm install` if dependencies are not already installed.
3. Start the frontend with `npm run dev`.

During development, Vite proxies `/api/*` requests to `http://localhost:8787`, so the React app can call the backend without changing the fetch path in the UI code.
