"""
Configuration management for the Agent Builder application.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project paths
BASE_DIR = Path(__file__).parent
STORAGE_DIR = BASE_DIR / "storage"
AGENTS_DIR = STORAGE_DIR / "agents"
TOKENS_DIR = STORAGE_DIR / "tokens"  # Legacy, kept for migration

# Create directories if they don't exist
STORAGE_DIR.mkdir(exist_ok=True)
AGENTS_DIR.mkdir(exist_ok=True)
TOKENS_DIR.mkdir(exist_ok=True)


def get_agent_dir(agent_id: str) -> Path:
    """Get the directory path for an agent's data."""
    agent_dir = AGENTS_DIR / agent_id
    agent_dir.mkdir(exist_ok=True)
    return agent_dir


def get_agent_file_path(agent_id: str) -> Path:
    """Get the path for agent metadata file."""
    return get_agent_dir(agent_id) / "agent.json"


def get_agent_chats_dir(agent_id: str) -> Path:
    """Get the directory path for an agent's chat files."""
    chats_dir = get_agent_dir(agent_id) / "chats"
    chats_dir.mkdir(exist_ok=True)
    return chats_dir


def get_agent_sessions_file(agent_id: str) -> Path:
    """Get the path for agent's chat sessions metadata."""
    return get_agent_dir(agent_id) / "sessions.json"


def get_agent_deployment_file(agent_id: str) -> Path:
    """Get the path for agent's deployment info (tokens, endpoints)."""
    return get_agent_dir(agent_id) / "deployment.json"


def get_agent_documents_dir(agent_id: str) -> Path:
    """Get the directory path for an agent's uploaded documents."""
    documents_dir = get_agent_dir(agent_id) / "documents"
    documents_dir.mkdir(exist_ok=True)
    return documents_dir

# API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production").strip()
API_HOST = os.getenv("API_HOST", "localhost").strip()
API_PORT_STR = os.getenv("API_PORT", "8000").strip()
API_PORT = int(API_PORT_STR) if API_PORT_STR else 8000

# LLM Configuration
LLM_MODEL = os.getenv("LLM_MODEL", "groq/llama-3.3-70b-versatile").strip()
LLM_TEMPERATURE_STR = os.getenv("LLM_TEMPERATURE", "0.1").strip()
LLM_TEMPERATURE = float(LLM_TEMPERATURE_STR) if LLM_TEMPERATURE_STR else 0.1

# Security
TOKEN_EXPIRATION_STR = os.getenv("TOKEN_EXPIRATION_HOURS", "24").strip()
TOKEN_EXPIRATION_HOURS = int(TOKEN_EXPIRATION_STR) if TOKEN_EXPIRATION_STR else 24

