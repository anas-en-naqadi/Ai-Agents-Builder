"""
FastAPI server for Agent Builder - Full API for React frontend.
"""
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import sys
from pathlib import Path

# Add backend directory to path for imports
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.agent_service import get_agent
from services.crewai_service import execute_agent_task
from utils.token_generator import validate_token
from api.routes import agents, chat, deployment
import config

app = FastAPI(
    title="Agent Builder API",
    version="2.0.0",
    description="Full API for Agent Builder React frontend"
)

# CORS middleware - Configure for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(deployment.router)


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    prompt: str
    context: Optional[dict] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response: str
    agent_id: str
    timestamp: str


async def verify_token(authorization: str = Header(None)) -> dict:
    """
    Verify API token from Authorization header.
    
    Args:
        authorization: Authorization header value
    
    Returns:
        Token metadata if valid
    
    Raises:
        HTTPException: If token is invalid
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(status_code=401, detail="Invalid authorization format. Use 'Bearer <token>'")
    
    token_data = validate_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return token_data


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Agent Builder API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/v1/agents/{agent_id}/chat", response_model=ChatResponse)
async def chat_with_agent(
    agent_id: str,
    request: ChatRequest,
    token_data: dict = Depends(verify_token)
):
    """
    Chat with a deployed agent.
    
    Args:
        agent_id: Agent ID
        request: Chat request with prompt
        token_data: Validated token data
    
    Returns:
        Agent response
    """
    # Verify token belongs to this agent
    if token_data.get("agent_id") != agent_id:
        raise HTTPException(status_code=403, detail="Token does not match agent ID")
    
    # Get agent
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.is_deployed:
        raise HTTPException(status_code=400, detail="Agent is not deployed")
    
    # Execute agent task
    try:
        response_text = execute_agent_task(agent, request.prompt)
        
        from datetime import datetime
        return ChatResponse(
            response=response_text,
            agent_id=agent_id,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing agent: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT)


