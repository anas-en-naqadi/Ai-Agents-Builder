# 🤖 Agent Builder

> A modern full-stack platform for creating, testing, and deploying AI agents powered by CrewAI. Build custom agents with roles, backstories, and resources, then deploy them as secure REST APIs.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)
[![CrewAI](https://img.shields.io/badge/CrewAI-0.1+-blue)](https://github.com/joaomdmoura/crewAI)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ Features

- **🎨 Modern UI**: Beautiful, responsive Next.js frontend with dark mode support
- **🤖 Agent Creation**: Create custom AI agents with role, backstory, goal, and resources
- **💬 Interactive Chat**: Test agents in real-time with a ChatGPT-like interface
- **🔧 Resource Management**: Add built-in tools, custom tools, links, and document uploads
- **🚀 API Deployment**: Deploy agents as secure REST APIs with Bearer token authentication
- **📝 Chat History**: Persistent chat sessions with auto-generated titles
- **🔄 Message Editing**: Edit and regenerate responses with full conversation context
- **📦 Postman Integration**: Auto-generate Postman collections for API testing
- **🌙 Dark Mode**: Full dark mode support with smooth theme transitions

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Beautiful component library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **FastAPI** - Modern Python web framework
- **CrewAI** - Multi-agent AI framework
- **Groq** - High-performance LLM inference
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** or **pnpm**
- **Python** 3.8+
- **Groq API Key** ([Get one here](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anas-en-naqadi/Ai-Agents-Builder.git
   cd Ai-Agents-Builder
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install  # or pnpm install
   ```

4. **Configure environment variables**

   **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your GROQ_API_KEY
   ```

   **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local if your backend runs on a different port
   ```

   See the `.env.example` files for all available configuration options.

5. **Run the development servers**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   python run.py
   # or
   uvicorn api.server:app --reload --host 0.0.0.0 --port 8000
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev  # or pnpm dev
   ```

6. **Open your browser**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📁 Project Structure

```
Ai-Agents-Builder/
├── backend/                 # Python FastAPI backend
│   ├── api/                # FastAPI application
│   │   ├── routes/         # API route handlers
│   │   │   ├── agents.py   # Agent CRUD operations
│   │   │   ├── chat.py     # Chat session management
│   │   │   └── deployment.py # API deployment
│   │   ├── models/         # API response models
│   │   └── server.py       # FastAPI app instance
│   ├── services/           # Business logic
│   │   ├── agent_service.py
│   │   ├── crewai_service.py
│   │   ├── api_service.py
│   │   ├── document_service.py
│   │   └── tool_service.py
│   ├── models/             # Data models (Pydantic)
│   ├── utils/              # Utilities
│   ├── storage/            # JSON file storage
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Server entry point
│
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app directory
│   │   ├── page.tsx       # Main page
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── components/        # React components
│   │   ├── agent-card.tsx
│   │   ├── chat-interface.tsx
│   │   ├── create-agent-form.tsx
│   │   ├── edit-agent.tsx
│   │   ├── deploy-agent.tsx
│   │   └── ui/            # Shadcn UI components
│   ├── lib/               # Utilities
│   │   ├── api.ts         # API client
│   │   ├── api-services.ts
│   │   ├── store.ts       # State management
│   │   └── types.ts       # TypeScript types
│   └── package.json       # Node dependencies
│
└── docs/                  # Documentation
    ├── API_ENDPOINTS.md   # Complete API reference
    ├── ARCHITECTURE.md    # System architecture overview
    ├── PROJECT_STRUCTURE.md # Detailed project structure
    └── QUICK_START.md    # Quick start guide
```

## 🎯 Usage

### Creating an Agent

1. Click "Create Agent" in the sidebar
2. Fill in the agent details:
   - **Name**: Unique identifier for your agent
   - **Role**: The agent's role (e.g., "Senior Software Engineer")
   - **Backstory**: Background context for the agent
   - **Goal**: Primary objective of the agent
   - **Resources**: Add tools, links, or upload documents
3. Click "Create Agent" to save

### Testing an Agent

1. Select an agent from the sidebar
2. Start a new chat or continue an existing conversation
3. Type your message and press Enter
4. The agent will respond using CrewAI and Groq LLM

### Deploying an Agent API

1. Click "Deploy" on any agent card
2. Copy the generated API token
3. Use the token in API requests:

   ```bash
   curl -X POST "http://localhost:8000/api/v1/agents/{agent_id}/chat" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, agent!"}'
   ```

4. Download the Postman collection for easy testing

## 🔧 Configuration

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GROQ_API_KEY` | Your Groq API key ([Get one here](https://console.groq.com/)) | - | ✅ Yes |
| `SECRET_KEY` | Secret key for token generation (change in production!) | `your-secret-key-change-in-production` | ⚠️ Recommended |
| `API_HOST` | Server host | `localhost` | No |
| `API_PORT` | Server port | `8000` | No |
| `LLM_MODEL` | Groq LLM model to use | `groq/llama-3.3-70b-versatile` | No |
| `LLM_TEMPERATURE` | LLM temperature (0.0-1.0) | `0.1` | No |
| `TOKEN_EXPIRATION_HOURS` | API token expiration time (hours) | `24` | No |

**Generate a secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Frontend Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` and configure:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` | ✅ Yes |

## 📚 API Documentation

Once the backend server is running:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

See [API_ENDPOINTS.md](API_ENDPOINTS.md) for detailed API documentation.

## 🛠️ Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
uvicorn api.server:app --host 0.0.0.0 --port 8000
```

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 Features in Detail

### Chat Interface
- Real-time messaging with thinking indicators
- Message editing and regeneration
- Code block rendering with syntax highlighting
- Copy to clipboard functionality
- Chat history with auto-generated titles
- Responsive design for mobile and desktop

### Agent Management
- Create, edit, and delete agents
- Built-in tool selection (web search, file operations, etc.)
- Custom tool creation
- Document upload and processing
- Resource link management

### API Deployment
- Secure token-based authentication
- Auto-generated Postman collections
- Token expiration management
- Deployment status tracking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CrewAI](https://github.com/joaomdmoura/crewAI) - Multi-agent AI framework
- [Groq](https://groq.com) - High-performance LLM inference
- [Next.js](https://nextjs.org) - React framework
- [FastAPI](https://fastapi.tiangolo.com) - Modern Python web framework
- [Shadcn UI](https://ui.shadcn.com) - Beautiful component library

## 📞 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/) in the `docs/` folder
2. Review [GITHUB_SETUP.md](GITHUB_SETUP.md) for setup instructions
3. Search existing [Issues](https://github.com/anas-en-naqadi/Ai-Agents-Builder/issues)
4. Create a new issue with detailed information

## 📖 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running quickly
- **[API Endpoints](docs/API_ENDPOINTS.md)** - Complete API reference
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and data flow
- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Detailed project organization
- **[Contributing](CONTRIBUTING.md)** - Guidelines for contributing

---

Made with ❤️ using Next.js, FastAPI, and CrewAI
