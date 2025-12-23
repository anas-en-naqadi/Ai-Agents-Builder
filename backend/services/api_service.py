"""
Service for managing API deployment of agents.
"""
import json
from typing import Optional
import config
from models.agent import Agent
from services.agent_service import update_agent_deployment, get_agent
from utils.token_generator import generate_api_token, save_token, is_token_expired, get_token_data


def deploy_agent_api(agent_id: str, base_url: Optional[str] = None, regenerate: bool = False) -> dict:
    """
    Deploy an agent as an API by generating token and endpoint.
    Checks for token expiration and regenerates if needed.
    
    Args:
        agent_id: Agent ID to deploy
        base_url: Base URL for the API (defaults to config)
        regenerate: Force token regeneration even if valid token exists
    
    Returns:
        Dictionary with deployment information
    """
    agent = get_agent(agent_id)
    if not agent:
        return {
            "success": False,
            "error": "Agent not found"
        }
    
    # Check if agent is already deployed and token is still valid
    if agent.is_deployed and not regenerate:
        if not is_token_expired(agent_id):
            # Token is still valid, return existing deployment info
            token_data = get_token_data(agent_id)
            return {
                "success": True,
                "agent_id": agent_id,
                "api_token": agent.api_token,
                "api_endpoint": agent.api_endpoint,
                "token_data": token_data,
                "regenerated": False
            }
        else:
            # Token expired, regenerate
            regenerate = True
    
    # Generate new API token
    token = generate_api_token()
    
    # Save token
    token_data = save_token(agent_id, token, expires_in_hours=config.TOKEN_EXPIRATION_HOURS)
    
    # Generate endpoint URL
    if base_url is None:
        base_url = f"http://{config.API_HOST}:{config.API_PORT}"
    
    api_endpoint = f"{base_url}/api/v1/agents/{agent_id}/chat"
    
    # Update agent with deployment info
    agent = update_agent_deployment(agent_id, token, api_endpoint)
    
    if not agent:
        return {
            "success": False,
            "error": "Failed to update agent"
        }
    
    return {
        "success": True,
        "agent_id": agent_id,
        "api_token": token,
        "api_endpoint": api_endpoint,
        "token_data": token_data,
        "regenerated": regenerate
    }


def check_deployment_status(agent_id: str) -> dict:
    """
    Check the deployment status of an agent.
    
    Args:
        agent_id: Agent ID
    
    Returns:
        Dictionary with deployment status information
    """
    agent = get_agent(agent_id)
    if not agent:
        return {
            "deployed": False,
            "error": "Agent not found"
        }
    
    if not agent.is_deployed:
        return {
            "deployed": False,
            "message": "Agent is not deployed"
        }
    
    is_expired = is_token_expired(agent_id)
    token_data = get_token_data(agent_id)
    
    return {
        "deployed": True,
        "is_expired": is_expired,
        "api_endpoint": agent.api_endpoint,
        "token_data": token_data,
        "needs_regeneration": is_expired
    }


def generate_postman_collection(agent: Agent, base_url: Optional[str] = None) -> dict:
    """
    Generate a Postman collection for an agent's API.
    
    Args:
        agent: Agent object
        base_url: Base URL for the API
    
    Returns:
        Postman collection JSON structure
    """
    if base_url is None:
        base_url = f"http://{config.API_HOST}:{config.API_PORT}"
    
    collection = {
        "info": {
            "name": f"{agent.name} API",
            "description": f"API collection for {agent.name} agent",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "item": [
            {
                "name": "Chat with Agent",
                "request": {
                    "method": "POST",
                    "header": [
                        {
                            "key": "Authorization",
                            "value": f"Bearer {agent.api_token}",
                            "type": "text"
                        },
                        {
                            "key": "Content-Type",
                            "value": "application/json",
                            "type": "text"
                        }
                    ],
                    "body": {
                        "mode": "raw",
                        "raw": json.dumps({
                            "prompt": "Your message here",
                            "context": {}
                        }, indent=2)
                    },
                    "url": {
                        "raw": f"{agent.api_endpoint}",
                        "host": [base_url.replace("http://", "").replace("https://", "").split(":")[0]],
                        "path": ["api", "v1", "agents", agent.id, "chat"]
                    }
                }
            }
        ]
    }
    
    return collection

