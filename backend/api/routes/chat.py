"""
Chat management API routes.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import sys
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.agent_service import (
    get_chat_sessions, create_chat_session,
    get_chat_history, save_chat_message,
    clear_chat_history, delete_chat_session as delete_chat_session_service,
    update_chat_message, truncate_chat_history
)
from services.crewai_service import execute_agent_task, format_resources_for_context
from api.models.responses import StandardResponse

router = APIRouter(prefix="/api/v1/agents/{agent_id}/chat", tags=["chat"])


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str
    content: str
    timestamp: str


class ChatSession(BaseModel):
    """Chat session model."""
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


class SendMessageRequest(BaseModel):
    """Request to send a chat message."""
    prompt: str
    chat_session_id: Optional[str] = "default"


class CreateSessionRequest(BaseModel):
    """Request to create a chat session."""
    title: Optional[str] = None


class UpdateMessageRequest(BaseModel):
    """Request to update a chat message."""
    new_content: str


class SendMessageResponse(BaseModel):
    """Response from chat message."""
    response: str
    chat_session_id: str
    timestamp: str


class UpdateMessageRequest(BaseModel):
    """Request to update a chat message."""
    new_content: str


@router.get("/sessions", response_model=StandardResponse)
async def list_chat_sessions(agent_id: str):
    """Get all chat sessions for an agent."""
    try:
        sessions = get_chat_sessions(agent_id)
        return StandardResponse(
            success=True,
            data=[dict(s) for s in sessions],
            message=f"Found {len(sessions)} chat sessions"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions", response_model=StandardResponse)
async def create_new_chat_session(agent_id: str, title: Optional[str] = None):
    """Create a new chat session."""
    try:
        session_id = create_chat_session(agent_id, title)
        sessions = get_chat_sessions(agent_id)
        new_session = next((s for s in sessions if s.get("id") == session_id), None)
        
        return StandardResponse(
            success=True,
            data=dict(new_session) if new_session else {"id": session_id},
            message="Chat session created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/messages", response_model=StandardResponse)
async def get_chat_messages(agent_id: str, session_id: str):
    """Get chat messages for a session."""
    try:
        messages = get_chat_history(agent_id, session_id)
        return StandardResponse(
            success=True,
            data=messages,
            message=f"Found {len(messages)} messages"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/messages", response_model=StandardResponse)
async def send_chat_message(
    agent_id: str,
    session_id: str,
    request: SendMessageRequest
):
    """Send a message and get agent response."""
    from services.agent_service import get_agent
    
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # Save user message
        save_chat_message(agent_id, "user", request.prompt, session_id)
        
        # Update session title from first user message if it's still default
        from services.agent_service import get_chat_sessions, update_chat_session_title
        sessions = get_chat_sessions(agent_id)
        current_session = next((s for s in sessions if s.get("id") == session_id), None)
        if current_session:
            # Generate title from first message if title is default
            title = current_session.get("title", "")
            if title.startswith("Chat ") or title == "Default Chat":
                # Generate smart title from first user message
                first_words = request.prompt[:50].strip()
                # Clean up the title
                title = first_words.replace("\n", " ").strip()
                if len(title) > 50:
                    title = title[:47] + "..."
                if not title:
                    title = "New Chat"
                update_chat_session_title(agent_id, session_id, title)
        
        # Format resources for context
        context = ""
        if agent.resources:
            context = format_resources_for_context([r.model_dump() for r in agent.resources], agent.id)
            full_prompt = f"{context}\n\n=== User Request ===\n{request.prompt}"
        else:
            full_prompt = request.prompt
        
        # Execute agent task
        response_text = execute_agent_task(agent, full_prompt)
        
        # Save assistant message
        save_chat_message(agent_id, "assistant", response_text, session_id)
        
        from datetime import datetime
        return StandardResponse(
            success=True,
            data={
                "response": response_text,
                "chat_session_id": session_id,
                "timestamp": datetime.now().isoformat()
            },
            message="Message sent successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/sessions/{session_id}/messages/{message_index}", response_model=StandardResponse)
async def update_chat_message_endpoint(
    agent_id: str,
    session_id: str,
    message_index: int,
    request: UpdateMessageRequest
):
    """Update a chat message and regenerate response."""
    from services.agent_service import get_agent
    
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        if update_chat_message(agent_id, message_index, request.new_content, session_id):
            # Truncate history after edited message
            truncate_chat_history(agent_id, message_index, session_id)
            
            # Get the updated user message (it's now at message_index)
            messages = get_chat_history(agent_id, session_id)
            if message_index < len(messages) and messages[message_index].get("role") == "user":
                user_message = messages[message_index]["content"]
                
                # Format resources for context
                context = ""
                if agent.resources:
                    context = format_resources_for_context([r.model_dump() for r in agent.resources], agent.id)
                    full_prompt = f"{context}\n\n=== User Request ===\n{user_message}"
                else:
                    full_prompt = user_message
                
                # Execute agent task to generate new response
                response_text = execute_agent_task(agent, full_prompt)
                
                # Save assistant message (user message is already saved from update)
                save_chat_message(agent_id, "assistant", response_text, session_id)
                
                from datetime import datetime
                return StandardResponse(
                    success=True,
                    data={
                        "response": response_text,
                        "chat_session_id": session_id,
                        "timestamp": datetime.now().isoformat()
                    },
                    message="Message updated and response regenerated successfully"
                )
            else:
                return StandardResponse(
                    success=True,
                    message="Message updated successfully"
                )
        else:
            raise HTTPException(status_code=500, detail="Failed to update message")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/regenerate", response_model=StandardResponse)
async def regenerate_response(
    agent_id: str,
    session_id: str
):
    """Regenerate the last assistant response."""
    from services.agent_service import get_agent
    
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # Get chat history
        messages = get_chat_history(agent_id, session_id)
        
        # Find last user message
        last_user_idx = None
        for i in range(len(messages) - 1, -1, -1):
            if messages[i].get("role") == "user":
                last_user_idx = i
                break
        
        if last_user_idx is None:
            raise HTTPException(status_code=400, detail="No user message found to regenerate from")
        
        # Truncate to last user message
        truncate_chat_history(agent_id, last_user_idx, session_id)
        
        # Get user message
        user_message = messages[last_user_idx]["content"]
        
        # Format resources for context
        context = ""
        if agent.resources:
            context = format_resources_for_context([r.model_dump() for r in agent.resources], agent.id)
            full_prompt = f"{context}\n\n=== User Request ===\n{user_message}"
        else:
            full_prompt = user_message
        
        # Execute agent task
        response_text = execute_agent_task(agent, full_prompt)
        
        # Save assistant message
        save_chat_message(agent_id, "assistant", response_text, session_id)
        
        from datetime import datetime
        return StandardResponse(
            success=True,
            data={
                "response": response_text,
                "chat_session_id": session_id,
                "timestamp": datetime.now().isoformat()
            },
            message="Response regenerated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}", response_model=StandardResponse)
async def delete_chat_session(agent_id: str, session_id: str):
    """Delete a chat session."""
    try:
        result = delete_chat_session_service(agent_id, session_id)
        if result:
            # Verify deletion by checking if session still exists
            sessions = get_chat_sessions(agent_id)
            session_exists = any(s.get("id") == session_id for s in sessions)
            if session_exists:
                raise HTTPException(status_code=500, detail="Session deletion failed - session still exists")
            
            return StandardResponse(
                success=True,
                message="Chat session deleted successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete chat session")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sessions/{session_id}/messages", response_model=StandardResponse)
async def clear_chat_messages(agent_id: str, session_id: str):
    """Clear all messages in a chat session."""
    try:
        if clear_chat_history(agent_id, session_id):
            return StandardResponse(
                success=True,
                message="Chat history cleared successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to clear chat history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

