## 📁 Project Structure

The project is organized with a clear separation between **backend** (FastAPI) and **frontend** (Next.js):

```
Ai-Agents-Builder/
├── backend/              # All backend Python code
│   ├── api/              # FastAPI application
│   │   ├── routes/       # API route handlers
│   │   ├── models/       # API response models
│   │   └── server.py     # FastAPI app instance
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   ├── utils/            # Utility functions
│   ├── storage/          # Data storage (JSON files)
│   ├── config.py         # Configuration
│   ├── requirements.txt  # Python dependencies
│   └── run.py            # Server entry point
│
├── frontend/             # Next.js React frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities and API services
│   └── package.json      # Node dependencies
│
└── docs/                 # Documentation files
```

---

### Backend Structure (`/backend`)

- `api/server.py` – FastAPI application entrypoint
- `api/routes/` – API route handlers
  - `agents.py` – Agent CRUD operations
  - `chat.py` – Chat session and message management
  - `deployment.py` – Agent deployment management
- `api/models/responses.py` – Standardized API response models
- `services/` – Business logic
  - `agent_service.py` – Agent CRUD operations
  - `api_service.py` – Deployment and API management
  - `crewai_service.py` – CrewAI agent execution
  - `document_service.py` – Document handling
  - `tool_service.py` – Tool definitions
- `models/agent.py` – Agent data models (Pydantic)
- `utils/token_generator.py` – API token management
- `utils/validators.py` – Validation utilities
- `storage/` – File-based storage
  - `agents/{agent_id}/agent.json` – Agent configuration
  - `agents/{agent_id}/sessions.json` – Chat sessions metadata
  - `agents/{agent_id}/chats/{session_id}.json` – Chat messages
  - `agents/{agent_id}/deployment.json` – Deployment info
  - `tokens/*.json` – API tokens

**Environment variables**: Copy `backend/.env.example` to `backend/.env` and configure. See the [README](../README.md#-configuration) for details.

---

### Frontend Structure (`/frontend`)

- `app/page.tsx` – Main application page
- `app/layout.tsx` – Root layout
- `components/` – UI and feature components
  - `agent-list.tsx` – Agent list
  - `agent-card.tsx` – Agent card
  - `create-agent-form.tsx` – Agent creation form
  - `edit-agent.tsx` – Agent editing
  - `deploy-agent.tsx` – Deployment UI
  - `chat-interface.tsx` – Chat UI
  - `sidebar.tsx` – Sidebar navigation
  - `ui/*` – Shadcn UI primitives
- `lib/`
  - `api.ts` – API base URL/config
  - `api-services.ts` – API client functions
  - `store.ts` – State management backed by API
  - `types.ts` – Shared TypeScript types
  - `utils.ts` – Frontend utilities

**Environment variables**: Copy `frontend/.env.example` to `frontend/.env.local` and configure. See the [README](../README.md#-configuration) for details.

---

### Data Flow Overview

1. Frontend calls backend via HTTP (`NEXT_PUBLIC_API_URL`).
2. Backend routes (`/backend/api/routes`) call service layer for business logic.
3. Services read/write JSON files under `backend/storage`.
4. Backend returns standardized JSON responses.
5. Frontend updates UI and local state from these responses.


