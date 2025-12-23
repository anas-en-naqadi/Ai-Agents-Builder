"""
Service for managing agents (CRUD operations).
"""
import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import config
from models.agent import Agent, AgentCreate, AgentUpdate


def _get_agent_file(agent_id: str) -> Path:
    """Get the file path for an agent."""
    return config.get_agent_file_path(agent_id)


def create_agent(agent_data: AgentCreate) -> Agent:
    """
    Create a new agent.
    
    Args:
        agent_data: Agent creation data
    
    Returns:
        Created Agent object
    """
    agent = Agent(
        name=agent_data.name,
        role=agent_data.role,
        backstory=agent_data.backstory,
        goal=agent_data.goal,
        resources=agent_data.resources
    )
    
    agent_file = _get_agent_file(agent.id)
    with open(agent_file, 'w', encoding='utf-8') as f:
        json.dump(agent.model_dump(), f, indent=2, default=str)
    
    return agent


def get_agent(agent_id: str) -> Optional[Agent]:
    """
    Get an agent by ID.
    
    Args:
        agent_id: Agent ID
    
    Returns:
        Agent object or None if not found
    """
    agent_file = _get_agent_file(agent_id)
    
    if not agent_file.exists():
        return None
    
    try:
        with open(agent_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return Agent(**data)
    except Exception:
        return None


def get_all_agents() -> List[Agent]:
    """
    Get all agents.
    
    Returns:
        List of all Agent objects
    """
    agents = []
    
    # Look in agent directories (new structure)
    for agent_dir in config.AGENTS_DIR.iterdir():
        if not agent_dir.is_dir():
            continue
        
        agent_file = agent_dir / "agent.json"
        if agent_file.exists():
            try:
                with open(agent_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                agents.append(Agent(**data))
            except Exception:
                continue
    
    # Also check for old flat structure files (for migration)
    for agent_file in config.AGENTS_DIR.glob("*.json"):
        # Skip chat and sessions files
        if "_chat" in agent_file.name or "_sessions" in agent_file.name:
            continue
        
        agent_id = agent_file.stem
        # Check if already loaded from new structure
        if any(a.id == agent_id for a in agents):
            continue
        
        try:
            with open(agent_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            agents.append(Agent(**data))
        except Exception:
            continue
    
    # Sort by created_at (newest first)
    agents.sort(key=lambda x: x.created_at, reverse=True)
    return agents


def update_agent(agent_id: str, agent_data: AgentUpdate) -> Optional[Agent]:
    """
    Update an existing agent.
    
    Args:
        agent_id: Agent ID
        agent_data: Update data
    
    Returns:
        Updated Agent object or None if not found
    """
    agent = get_agent(agent_id)
    if not agent:
        return None
    
    # Handle resource deletion - delete document files if resources are being updated
    if agent_data.resources is not None:
        # Get old resources
        old_resources = agent.resources
        new_resources = agent_data.resources
        
        # Find deleted document resources
        old_documents = {r.value for r in old_resources if r.type == "document"}
        new_documents = {r.value for r in new_resources if r.type == "document"}
        deleted_documents = old_documents - new_documents
        
        # Delete document files
        if deleted_documents:
            from services.document_service import delete_document
            for doc_filename in deleted_documents:
                try:
                    delete_document(agent_id, doc_filename)
                except Exception:
                    pass  # Continue even if deletion fails
    
    # Update fields
    update_dict = agent_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(agent, key, value)
    
    agent.updated_at = datetime.now()
    
    # Save updated agent
    agent_file = _get_agent_file(agent_id)
    with open(agent_file, 'w', encoding='utf-8') as f:
        json.dump(agent.model_dump(), f, indent=2, default=str)
    
    return agent


def delete_agent(agent_id: str) -> bool:
    """
    Delete an agent and all its associated data (entire agent directory).
    
    Args:
        agent_id: Agent ID
    
    Returns:
        True if deleted, False if not found
    """
    agent_dir = config.get_agent_dir(agent_id)
    
    if not agent_dir.exists():
        return False
    
    # Delete entire agent directory (includes all chats, sessions, deployment info)
    try:
        import shutil
        shutil.rmtree(agent_dir)
        return True
    except Exception:
        return False


def update_agent_deployment(agent_id: str, api_token: str, api_endpoint: str) -> Optional[Agent]:
    """
    Update agent with deployment information.
    
    Args:
        agent_id: Agent ID
        api_token: Generated API token
        api_endpoint: API endpoint URL
    
    Returns:
        Updated Agent object or None if not found
    """
    agent = get_agent(agent_id)
    if not agent:
        return None
    
    agent.api_token = api_token
    agent.api_endpoint = api_endpoint
    agent.is_deployed = True
    agent.updated_at = datetime.now()
    
    agent_file = _get_agent_file(agent_id)
    with open(agent_file, 'w', encoding='utf-8') as f:
        json.dump(agent.model_dump(), f, indent=2, default=str)
    
    return agent


def _get_chat_history_file(agent_id: str, chat_session_id: str = "default") -> Path:
    """Get the file path for chat history."""
    chats_dir = config.get_agent_chats_dir(agent_id)
    if chat_session_id == "default":
        return chats_dir / "default.json"
    return chats_dir / f"{chat_session_id}.json"


def _get_chat_sessions_file(agent_id: str) -> Path:
    """Get the file path for chat sessions metadata."""
    return config.get_agent_sessions_file(agent_id)


def save_chat_message(agent_id: str, role: str, content: str, chat_session_id: str = "default") -> bool:
    """
    Save a chat message to persistent storage.
    
    Args:
        agent_id: Agent ID
        role: Message role ('user' or 'assistant')
        content: Message content
        chat_session_id: Chat session ID (default: "default")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        chat_file = _get_chat_history_file(agent_id, chat_session_id)
        
        # Load existing chat history
        chat_history = []
        if chat_file.exists():
            with open(chat_file, 'r', encoding='utf-8') as f:
                chat_history = json.load(f)
        
        # Add new message
        chat_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
        # Save updated history
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(chat_history, f, indent=2, ensure_ascii=False)
        
        # Update chat session metadata (update last message time)
        update_chat_session_metadata(agent_id, chat_session_id)
        
        return True
    except Exception:
        return False


def get_chat_history(agent_id: str, chat_session_id: str = "default") -> list:
    """
    Get chat history for an agent and chat session.
    
    Args:
        agent_id: Agent ID
        chat_session_id: Chat session ID (default: "default")
    
    Returns:
        List of chat messages
    """
    chat_file = _get_chat_history_file(agent_id, chat_session_id)
    
    if not chat_file.exists():
        return []
    
    try:
        with open(chat_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


def clear_chat_history(agent_id: str, chat_session_id: str = "default") -> bool:
    """
    Clear chat history for an agent and chat session.
    
    Args:
        agent_id: Agent ID
        chat_session_id: Chat session ID (default: "default")
    
    Returns:
        True if successful, False otherwise
    """
    chat_file = _get_chat_history_file(agent_id, chat_session_id)
    
    if chat_file.exists():
        try:
            chat_file.unlink()
            return True
        except Exception:
            return False
    
    return True


def create_chat_session(agent_id: str, title: Optional[str] = None) -> str:
    """
    Create a new chat session for an agent.
    
    Args:
        agent_id: Agent ID
        title: Optional title for the chat session
    
    Returns:
        Chat session ID
    """
    from uuid import uuid4
    
    chat_session_id = str(uuid4())
    sessions_file = _get_chat_sessions_file(agent_id)
    
    # Load existing sessions
    sessions = []
    if sessions_file.exists():
        try:
            with open(sessions_file, 'r', encoding='utf-8') as f:
                sessions = json.load(f)
        except Exception:
            sessions = []
    
    # Generate title from first user message if not provided
    if not title:
        title = f"Chat {len(sessions) + 1}"
    
    # Add new session
    session_data = {
        "id": chat_session_id,
        "title": title,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "message_count": 0
    }
    
    sessions.append(session_data)
    
    # Save sessions
    with open(sessions_file, 'w', encoding='utf-8') as f:
        json.dump(sessions, f, indent=2, ensure_ascii=False)
    
    return chat_session_id


def get_chat_sessions(agent_id: str) -> list:
    """
    Get all chat sessions for an agent.
    
    Args:
        agent_id: Agent ID
    
    Returns:
        List of chat session dictionaries
    """
    sessions_file = _get_chat_sessions_file(agent_id)
    
    if not sessions_file.exists():
        # Create default session if no sessions exist
        default_id = create_chat_session(agent_id, "Default Chat")
        # Also create the default chat file for backward compatibility
        default_chat_file = _get_chat_history_file(agent_id, "default")
        if not default_chat_file.exists():
            with open(default_chat_file, 'w', encoding='utf-8') as f:
                json.dump([], f, indent=2)
        return get_chat_sessions(agent_id)
    
    try:
        with open(sessions_file, 'r', encoding='utf-8') as f:
            sessions = json.load(f)
        
        # Update message counts for all sessions
        for session in sessions:
            session_id = session.get("id")
            if session_id:
                chat_history = get_chat_history(agent_id, session_id)
                session["message_count"] = len(chat_history)
        
        # Sort by updated_at (most recent first)
        sessions.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return sessions
    except Exception:
        return []


def update_chat_session_title(agent_id: str, chat_session_id: str, new_title: str) -> bool:
    """
    Update the title of a chat session.
    
    Args:
        agent_id: Agent ID
        chat_session_id: Chat session ID
        new_title: New title for the session
    
    Returns:
        True if successful, False otherwise
    """
    try:
        sessions_file = _get_chat_sessions_file(agent_id)
        
        if not sessions_file.exists():
            return False
        
        # Load existing sessions
        with open(sessions_file, 'r', encoding='utf-8') as f:
            sessions = json.load(f)
        
        # Find and update the session
        for session in sessions:
            if session.get("id") == chat_session_id:
                session["title"] = new_title
                session["updated_at"] = datetime.now().isoformat()
                break
        else:
            return False
        
        # Save updated sessions
        with open(sessions_file, 'w', encoding='utf-8') as f:
            json.dump(sessions, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception:
        return False


def update_chat_session_metadata(agent_id: str, chat_session_id: str) -> bool:
    """
    Update chat session metadata (last updated time, message count).
    
    Args:
        agent_id: Agent ID
        chat_session_id: Chat session ID
    
    Returns:
        True if successful, False otherwise
    """
    try:
        sessions_file = _get_chat_sessions_file(agent_id)
        
        if not sessions_file.exists():
            return False
        
        with open(sessions_file, 'r', encoding='utf-8') as f:
            sessions = json.load(f)
        
        # Find and update session
        for session in sessions:
            if session.get("id") == chat_session_id:
                session["updated_at"] = datetime.now().isoformat()
                # Update message count
                chat_history = get_chat_history(agent_id, chat_session_id)
                session["message_count"] = len(chat_history)
                break
        
        # Save updated sessions
        with open(sessions_file, 'w', encoding='utf-8') as f:
            json.dump(sessions, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception:
        return False


def delete_chat_session(agent_id: str, chat_session_id: str) -> bool:
    """
    Delete a chat session and its history.
    
    Args:
        agent_id: Agent ID
        chat_session_id: Chat session ID
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Delete chat history file
        chat_file = _get_chat_history_file(agent_id, chat_session_id)
        if chat_file.exists():
            chat_file.unlink()
        
        # Remove from sessions list
        sessions_file = _get_chat_sessions_file(agent_id)
        if not sessions_file.exists():
            # If sessions file doesn't exist, nothing to delete
            return True
        
        # Read current sessions
        with open(sessions_file, 'r', encoding='utf-8') as f:
            sessions = json.load(f)
        
        # Filter out the session to delete
        original_count = len(sessions)
        sessions = [s for s in sessions if s.get("id") != chat_session_id]
        
        # Only save if something was actually removed
        if len(sessions) < original_count:
            # Write updated sessions back to file with explicit flushing
            with open(sessions_file, 'w', encoding='utf-8') as f:
                json.dump(sessions, f, indent=2, ensure_ascii=False)
                f.flush()  # Ensure data is written to disk
                import os
                os.fsync(f.fileno())  # Force write to disk
            return True
        else:
            # Session not found in list, but that's okay - might have been deleted already
            return True
        
    except Exception as e:
        # Log the error for debugging
        import sys
        print(f"Error deleting chat session {chat_session_id} for agent {agent_id}: {e}", file=sys.stderr)
        return False


def update_chat_message(agent_id: str, message_index: int, new_content: str, chat_session_id: str = "default") -> bool:
    """
    Update a chat message at a specific index.
    
    Args:
        agent_id: Agent ID
        message_index: Index of the message to update
        new_content: New content for the message
        chat_session_id: Chat session ID (default: "default")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        chat_file = _get_chat_history_file(agent_id, chat_session_id)
        
        if not chat_file.exists():
            return False
        
        # Load existing chat history
        with open(chat_file, 'r', encoding='utf-8') as f:
            chat_history = json.load(f)
        
        # Check if index is valid
        if message_index < 0 or message_index >= len(chat_history):
            return False
        
        # Update message
        chat_history[message_index]["content"] = new_content
        chat_history[message_index]["timestamp"] = datetime.now().isoformat()
        
        # Save updated history
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(chat_history, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception:
        return False


def truncate_chat_history(agent_id: str, keep_until_index: int, chat_session_id: str = "default") -> bool:
    """
    Truncate chat history, keeping messages up to and including the specified index.
    Removes all messages after the index.
    
    Args:
        agent_id: Agent ID
        keep_until_index: Index of the last message to keep (inclusive)
        chat_session_id: Chat session ID (default: "default")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        chat_file = _get_chat_history_file(agent_id, chat_session_id)
        
        if not chat_file.exists():
            return False
        
        # Load existing chat history
        with open(chat_file, 'r', encoding='utf-8') as f:
            chat_history = json.load(f)
        
        # Truncate history
        if keep_until_index >= 0 and keep_until_index < len(chat_history):
            chat_history = chat_history[:keep_until_index + 1]
        elif keep_until_index < 0:
            chat_history = []
        
        # Save truncated history
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(chat_history, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception:
        return False


def delete_chat_message(agent_id: str, message_index: int, chat_session_id: str = "default") -> bool:
    """
    Delete a chat message at a specific index.
    
    Args:
        agent_id: Agent ID
        message_index: Index of the message to delete
        chat_session_id: Chat session ID (default: "default")
    
    Returns:
        True if successful, False otherwise
    """
    try:
        chat_file = _get_chat_history_file(agent_id, chat_session_id)
        
        if not chat_file.exists():
            return False
        
        # Load existing chat history
        with open(chat_file, 'r', encoding='utf-8') as f:
            chat_history = json.load(f)
        
        # Check if index is valid
        if message_index < 0 or message_index >= len(chat_history):
            return False
        
        # Remove message
        chat_history.pop(message_index)
        
        # Save updated history
        with open(chat_file, 'w', encoding='utf-8') as f:
            json.dump(chat_history, f, indent=2, ensure_ascii=False)
        
        return True
    except Exception:
        return False

