# 🚀 Quick Start

This guide shows how to run the **Agent Builder** full-stack app (FastAPI backend + Next.js frontend).

## 1. Prerequisites

- Python 3.8+
- Node.js 18+ (with npm or pnpm)
- Groq API key

## 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Copy the example environment file and configure it:

```bash
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

See `backend/.env.example` for all available configuration options.

Start the backend API server:

```bash
cd backend
python run.py
# or
uvicorn api.server:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at `http://localhost:8000`.

## 3. Frontend Setup

```bash
cd frontend
npm install  # or pnpm install
```

Copy the example environment file:

```bash
cp .env.example .env.local
# Edit .env.local if your backend runs on a different port
```

See `frontend/.env.example` for configuration options.

Start the frontend dev server:

```bash
cd frontend
npm run dev  # or pnpm dev
```

Frontend will be available at `http://localhost:3000`.

## 4. Verify Everything Works

1. Open `http://localhost:3000`
2. Create an agent (name, role, backstory, goal, resources)
3. Open the chat and send a message
4. Click **Deploy** on an agent to generate a token
5. Call the external API:

```bash
curl -X POST "http://localhost:8000/api/v1/agents/{agent_id}/chat" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, agent!"}'
```

## 5. Troubleshooting

- **Backend API docs**: `http://localhost:8000/docs`
- **If frontend cannot reach backend**:
  - Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
  - Ensure backend is running on port 8000
  - Check browser dev tools for CORS or network errors
- **If agent execution fails**:
  - Verify `GROQ_API_KEY` is set correctly in `backend/.env`
  - Check backend logs for error messages
  - Ensure you have a valid Groq API key from [console.groq.com](https://console.groq.com/)

## Next Steps

- Read the [API Documentation](API_ENDPOINTS.md) for detailed endpoint information
- Check [Architecture](ARCHITECTURE.md) to understand the system design
- Review [Project Structure](PROJECT_STRUCTURE.md) for code organization