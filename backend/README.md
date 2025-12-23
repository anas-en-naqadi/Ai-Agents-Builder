# Backend - Agent Builder API

FastAPI backend for the Agent Builder application.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   Create a `.env` file in the project root (not in backend folder):
   ```env
   GROQ_API_KEY=your_key
   SECRET_KEY=your_secret
   API_HOST=localhost
   API_PORT=8000
   ```

3. **Run the server:**
   ```bash
   python run.py
   ```

   Or with uvicorn:
   ```bash
   python -m uvicorn api.server:app --reload
   ```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── api/              # FastAPI application
│   ├── routes/       # Route handlers
│   ├── models/       # Response models
│   └── server.py     # App instance
├── services/         # Business logic
├── models/           # Data models
├── utils/            # Utilities
├── storage/          # Data storage
├── config.py         # Configuration
└── run.py           # Entry point
```

## Endpoints

- `GET /api/v1/agents` - List agents
- `POST /api/v1/agents` - Create agent
- `GET /api/v1/agents/{id}` - Get agent
- `PUT /api/v1/agents/{id}` - Update agent
- `DELETE /api/v1/agents/{id}` - Delete agent

See `API_ENDPOINTS.md` in project root for full documentation.


