# 📡 API Endpoints

Base URL:

```text
http://localhost:8000
```

Most internal endpoints do **not** require authentication. The external chat endpoint for deployed agents **does** require a Bearer token.

---

## 🎯 Agent Management

### List All Agents

```http
GET /api/v1/agents
```

### Get Agent by ID

```http
GET /api/v1/agents/{agent_id}
```

### Create Agent

```http
POST /api/v1/agents
Content-Type: multipart/form-data
```

Form fields:

- `name` (string, required)
- `role` (string, required)
- `backstory` (string, required)
- `goal` (string, required)
- `resources` (string, optional) – JSON string of resources array
- `documents` (file[], optional) – Uploaded documents

### Update Agent

```http
PUT /api/v1/agents/{agent_id}
Content-Type: multipart/form-data
```

All fields are optional; only provided fields are updated.

### Delete Agent

```http
DELETE /api/v1/agents/{agent_id}
```

---

## 💬 Chat Management

### List Chat Sessions

```http
GET /api/v1/agents/{agent_id}/chat/sessions
```

### Create Chat Session

```http
POST /api/v1/agents/{agent_id}/chat/sessions
Content-Type: application/json
```

Body (optional):

```json
{
  "title": "New Chat"
}
```

### Get Chat Messages

```http
GET /api/v1/agents/{agent_id}/chat/sessions/{session_id}/messages
```

### Send Chat Message

```http
POST /api/v1/agents/{agent_id}/chat/sessions/{session_id}/messages
Content-Type: application/json
```

Body:

```json
{
  "prompt": "Your message here"
}
```

### Update Chat Message (Edit)

```http
PUT /api/v1/agents/{agent_id}/chat/sessions/{session_id}/messages/{message_index}
Content-Type: application/json
```

Body:

```json
{
  "new_content": "Updated message content"
}
```

This truncates chat history after the edited message and regenerates the assistant response.

### Regenerate Response

```http
POST /api/v1/agents/{agent_id}/chat/sessions/{session_id}/regenerate
```

Regenerates the last assistant response based on the last user message.

### Delete Chat Session

```http
DELETE /api/v1/agents/{agent_id}/chat/sessions/{session_id}
```

### Clear Messages in a Session

```http
DELETE /api/v1/agents/{agent_id}/chat/sessions/{session_id}/messages
```

---

## 🚀 Deployment

### Get Deployment Status

```http
GET /api/v1/agents/{agent_id}/deployment
```

### Deploy Agent / Regenerate Token

```http
POST /api/v1/agents/{agent_id}/deployment?regenerate=false
```

Query params:

- `regenerate` (boolean, optional) – Regenerate token if already deployed

### Get Postman Collection

```http
GET /api/v1/agents/{agent_id}/deployment/postman
```

---

## 🔐 External Chat API (Deployed Agents)

This is the endpoint you call from external apps using the deployment token.

```http
POST /api/v1/agents/{agent_id}/chat
Authorization: Bearer {token}
Content-Type: application/json
```

Body:

```json
{
  "prompt": "Your message"
}
```

---

## 🧪 Examples

### cURL – External Chat

```bash
curl -X POST "http://localhost:8000/api/v1/agents/{agent_id}/chat" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, agent!"}'
```

For more detailed examples and live testing, open `http://localhost:8000/docs`.


