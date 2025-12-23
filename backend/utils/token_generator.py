"""
Token generation utilities for API authentication.
"""
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional
import json
from pathlib import Path
import config


def generate_api_token(length: int = 32) -> str:
    """
    Generate a secure random API token.
    
    Args:
        length: Length of the token (default: 32)
    
    Returns:
        A secure random token string
    """
    alphabet = string.ascii_letters + string.digits
    token = ''.join(secrets.choice(alphabet) for _ in range(length))
    return f"agt_{token}"


def save_token(agent_id: str, token: str, expires_in_hours: Optional[int] = None) -> dict:
    """
    Save token to storage with metadata in agent's deployment file.
    
    Args:
        agent_id: ID of the agent
        token: The API token
        expires_in_hours: Optional expiration time in hours
    
    Returns:
        Token metadata dictionary
    """
    deployment_file = config.get_agent_deployment_file(agent_id)
    
    expires_at = None
    if expires_in_hours:
        expires_at = (datetime.now() + timedelta(hours=expires_in_hours)).isoformat()
    
    token_data = {
        "agent_id": agent_id,
        "token": token,
        "created_at": datetime.now().isoformat(),
        "expires_at": expires_at,
        "is_active": True
    }
    
    # Load existing deployment data or create new
    deployment_data = {}
    if deployment_file.exists():
        try:
            with open(deployment_file, 'r') as f:
                deployment_data = json.load(f)
        except Exception:
            deployment_data = {}
    
    # Update token in deployment data
    deployment_data["token"] = token_data
    
    # Save deployment data
    with open(deployment_file, 'w') as f:
        json.dump(deployment_data, f, indent=2)
    
    return token_data


def validate_token(token: str) -> Optional[dict]:
    """
    Validate an API token and return its metadata.
    
    Args:
        token: The token to validate
    
    Returns:
        Token metadata if valid, None otherwise
    """
    # Search through all agent directories
    for agent_dir in config.AGENTS_DIR.iterdir():
        if not agent_dir.is_dir():
            continue
        
        deployment_file = agent_dir / "deployment.json"
        if not deployment_file.exists():
            continue
        
        try:
            with open(deployment_file, 'r') as f:
                deployment_data = json.load(f)
            
            token_data = deployment_data.get("token", {})
            if isinstance(token_data, dict) and token_data.get("token") == token:
                if token_data.get("is_active", True):
                    # Check expiration
                    expires_at = token_data.get("expires_at")
                    if expires_at:
                        if datetime.fromisoformat(expires_at) < datetime.now():
                            return None
                    
                    return token_data
        except Exception:
            continue
    
    return None


def revoke_token(agent_id: str) -> bool:
    """
    Revoke a token for an agent.
    
    Args:
        agent_id: ID of the agent
    
    Returns:
        True if successful, False otherwise
    """
    deployment_file = config.get_agent_deployment_file(agent_id)
    
    if deployment_file.exists():
        try:
            with open(deployment_file, 'r') as f:
                deployment_data = json.load(f)
            
            if "token" in deployment_data:
                deployment_data["token"]["is_active"] = False
                
                with open(deployment_file, 'w') as f:
                    json.dump(deployment_data, f, indent=2)
                
                return True
        except Exception:
            return False
    
    return False


def get_token_data(agent_id: str) -> Optional[dict]:
    """
    Get token data for an agent.
    
    Args:
        agent_id: ID of the agent
    
    Returns:
        Token metadata dictionary or None if not found
    """
    deployment_file = config.get_agent_deployment_file(agent_id)
    
    if not deployment_file.exists():
        return None
    
    try:
        with open(deployment_file, 'r') as f:
            deployment_data = json.load(f)
            return deployment_data.get("token")
    except Exception:
        return None


def is_token_expired(agent_id: str) -> bool:
    """
    Check if a token is expired.
    
    Args:
        agent_id: ID of the agent
    
    Returns:
        True if expired or not found, False if valid
    """
    token_data = get_token_data(agent_id)
    
    if not token_data:
        return True
    
    if not token_data.get("is_active", True):
        return True
    
    expires_at = token_data.get("expires_at")
    if expires_at:
        try:
            if datetime.fromisoformat(expires_at) < datetime.now():
                return True
        except Exception:
            return True
    
    return False

