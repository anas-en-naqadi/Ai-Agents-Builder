# 🧠 System Architecture & Data Flow

This document explains **how the project works end‑to‑end**: frontend, backend, storage, and how everything is linked.

---

## 1. High‑Level Overview

- **Frontend**: Next.js + React app in `frontend/`
  - UI for creating, editing, testing, and deploying agents
  - Chat interface (ChatGPT‑style) with history, edit/regenerate, thinking state, code blocks, toasts, etc.
- **Backend**: FastAPI app in `backend/`
  - REST API for agents, chat sessions/messages, and deployment
  - Integrates with CrewAI + Groq (LLM) to execute agent tasks
  - Stores all data in JSON files under `backend/storage/`

Frontend and backend communicate **only via HTTP** using `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`).

---

## 2. Frontend – How It Works

### 2.1 Entry & Layout

- `frontend/app/page.tsx`
  - Main React component that manages:
    - Current view: **agents list**, **chat**, **deploy**, **edit**
    - Selected agent + current chat session
    - Global loading/error states and delete confirmation modals
  - Calls functions from `frontend/lib/store.ts` / `api-services.ts` to talk to the backend.
- `frontend/app/layout.tsx`
  - Wraps the app with theme provider, global styles, and toaster.

### 2.2 Core Components

- `Sidebar`
  - Lists agents and chat sessions
  - Supports collapse/expand (like ChatGPT)
  - Clicking an agent updates selected agent & view in `page.tsx`.

- `AgentList` + `AgentCard`
  - Fetch agents from backend (`GET /api/v1/agents`) via `store.ts`.
  - `AgentCard` actions:
    - **Test** → open chat view for that agent.
    - **Edit** → open edit form.
    - **Deploy** → auto‑deploy agent and open deploy view.

- `CreateAgentForm` / `EditAgent`
  - Use `react-hook-form` + `zod` for validation.
  - Support:
    - Built‑in tools + custom tools
    - Links
    - Document uploads (files)
  - Submit to backend:
    - `POST /api/v1/agents` (create, multipart/form-data)
    - `PUT /api/v1/agents/{id}` (update, multipart/form-data)

- `DeployAgent`
  - Shows token, expiry, and API endpoint.
  - Allows regenerate token via:
    - `POST /api/v1/agents/{id}/deployment?regenerate=true`
  - Generates correct localhost PowerShell cURL examples.

- `ChatInterface`
  - Shows messages for the current session.
  - Supports:
    - New chat creation
    - Chat history sidebar
    - Message sending, editing, regenerating
    - “Thinking…” state with animated loader
    - Code block rendering + copy to clipboard
    - Global confirmation modals for delete actions
  - Calls callbacks from `page.tsx`:
    - `onSendMessage`
    - `onEditMessage`
    - `onRegenerateResponse`
    - `onDeleteSession`

### 2.3 Frontend Data Layer

- `frontend/lib/api.ts`
  - Defines `API_BASE_URL` using `NEXT_PUBLIC_API_URL` or default `http://localhost:8000`.

- `frontend/lib/api-services.ts`
  - Low‑level HTTP functions that call the FastAPI endpoints:
    - Agents: list, get, create, update, delete
    - Chat: sessions, messages, regenerate
    - Deployment: status, deploy, Postman collection
  - Transforms backend message/session shapes into frontend types.

- `frontend/lib/store.ts`
  - Higher‑level async functions used by `page.tsx`:
    - `getAgents`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`
    - `getChatSessions`, `createChatSession`, `addMessage`, `updateMessage`, `deleteChatSession`
    - `deployAgent`, `regenerateToken`
  - Implements caching for sessions, with **cache invalidation** after:
    - Adding messages
    - Updating messages
    - Deleting chat sessions

---

## 3. Backend – How It Works

### 3.1 FastAPI App

- `backend/api/server.py`
  - Creates the FastAPI app
  - Includes routers:
    - `api.routes.agents`
    - `api.routes.chat`
    - `api.routes.deployment`
  - Configures CORS so the frontend can call the API.

### 3.2 Routes

- `backend/api/routes/agents.py`
  - `GET /api/v1/agents` – list agents
  - `GET /api/v1/agents/{agent_id}` – get agent
  - `POST /api/v1/agents` – create agent (multipart with `documents`)
  - `PUT /api/v1/agents/{agent_id}` – update agent (multipart)
  - `DELETE /api/v1/agents/{agent_id}` – delete agent (removes entire agent directory)
  - Uses `AgentCreate` / `AgentUpdate` Pydantic models and `agent_service` functions.
  - Handles:
    - Document uploads via `document_service.save_uploaded_document`
    - Validation of name/role/backstory/goal lengths.

- `backend/api/routes/chat.py`
  - `GET /api/v1/agents/{id}/chat/sessions` – list sessions
  - `POST /api/v1/agents/{id}/chat/sessions` – create session
  - `GET /api/v1/agents/{id}/chat/sessions/{session_id}/messages` – get messages
  - `POST /api/v1/agents/{id}/chat/sessions/{session_id}/messages` – send message
    - Uses CrewAI/Groq to generate assistant reply.
    - Updates chat file + session metadata.
    - Auto‑generates a **title** for the chat from the first user message.
  - `PUT /api/v1/agents/{id}/chat/sessions/{session_id}/messages/{index}` – edit message
    - Truncates history after the edited user message.
    - Automatically regenerates the assistant’s response (no duplicate user message).
  - `POST /api/v1/agents/{id}/chat/sessions/{session_id}/regenerate` – regenerate last assistant response.
  - `DELETE /api/v1/agents/{id}/chat/sessions/{session_id}` – delete session.

- `backend/api/routes/deployment.py`
  - `GET /api/v1/agents/{id}/deployment` – get deployment status.
  - `POST /api/v1/agents/{id}/deployment` – deploy or regenerate token.
  - `GET /api/v1/agents/{id}/deployment/postman` – Postman collection.
  - External endpoint:
    - `POST /api/v1/agents/{id}/chat` – token‑protected external chat API (used by cURL/Postman).

### 3.3 Services & Storage

- `backend/services/agent_service.py`
  - Creates/reads/updates/deletes agents.
  - Manages chat history + sessions:
    - `save_chat_message`
    - `truncate_chat_history` (used for edit/regenerate)
    - `delete_chat_session`
  - Manages deployment metadata in `deployment.json`.

- `backend/services/crewai_service.py`
  - Builds and runs CrewAI agents with Groq as the LLM.
  - Converts chat history + resources into prompts for the model.

- `backend/services/document_service.py`
  - Saves uploaded files to per‑agent `documents/` directories.
  - Extracts text for `.txt`, `.md`, `.pdf`, `.docx`, etc.
  - Handles both Streamlit‑style uploads and FastAPI `UploadFile`.

- `backend/services/tool_service.py`
  - Defines built‑in tools (web search, calculator, etc.) and how they’re described to the LLM.

- `backend/storage/`
  - File layout per agent:

    ```text
    backend/storage/agents/{agent_id}/
      agent.json          # Agent config (name, role, backstory, goal, resources, deployment info)
      sessions.json       # List of chat sessions (id, title, timestamps, message_count)
      chats/
        default.json
        {session_id}.json # Per‑session message history
      deployment.json     # Deployment status + token + endpoint
      documents/          # Uploaded files
    backend/storage/tokens/
      {token_id}.json     # Token metadata
    ```

---

## 4. How Frontend & Backend Are Linked

### 4.1 Configuration

- **Backend**:
  - Runs on `http://localhost:8000` by default.
  - Exposes routes under `/api/v1/...`.

- **Frontend**:

  ```env
  # frontend/.env.local
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

  All API calls use this base URL.

### 4.2 Typical Flows

#### 4.2.1 Create Agent

1. User fills **Create Agent** form in the frontend.
2. Frontend builds a `FormData` with fields + documents.
3. Sends `POST /api/v1/agents` (multipart).
4. Backend validates, saves agent to `agent.json`, saves documents, returns agent data.
5. Frontend refreshes agent list from `getAgents()`.

#### 4.2.2 Chat with Agent

1. User selects an agent and (optionally) starts a new chat session.
2. Frontend:
   - Calls `createChatSession` if needed.
   - Calls `getChatSessions` to load existing sessions and messages.
3. When user sends a message:
   - `ChatInterface`:
     - Adds a temporary user message to local state.
     - Sets `isThinking = true` and shows the thinking bubble.
   - `page.tsx` handler calls `addMessage` → backend `POST /.../messages`.
4. Backend:
   - Saves the user message.
   - Calls CrewAI/Groq to get assistant response.
   - Saves the assistant response.
5. Frontend:
   - Refreshes sessions/messages and clears any `temp-msg-*`.
   - Sets `isThinking = false`.

#### 4.2.3 Edit Message & Regenerate

1. User edits a previous **user** message.
2. Frontend:
   - Updates local message content.
   - Removes all later messages from UI.
   - Sets `isThinking = true`.
   - Calls `updateMessage` → backend `PUT /.../messages/{index}`.
3. Backend:
   - Updates the message in chat history.
   - Truncates messages after it.
   - Regenerates assistant response and saves it.
4. Frontend:
   - Reloads session messages; no duplicate user messages.
   - `isThinking = false`.

Regenerate button follows a similar flow but without changing the user content—only the assistant reply is regenerated.

#### 4.2.4 Deploy & External API

1. User clicks **Deploy** on an agent.
2. Frontend calls `deployAgent` → backend `POST /api/v1/agents/{id}/deployment`.
3. Backend:
   - Generates a token.
   - Stores deployment data in `deployment.json`.
4. Frontend:
   - Shows token, expiry, and endpoint.
   - Renders cURL + PowerShell examples that hit:

     ```text
     POST /api/v1/agents/{agent_id}/chat
     Authorization: Bearer {token}
     Content-Type: application/json
     ```

---

## 5. Where to Read More

- `docs/QUICK_START.md` – How to run backend + frontend.
- `docs/PROJECT_STRUCTURE.md` – Files and directories.
- `docs/API_ENDPOINTS.md` – All API routes with examples.


