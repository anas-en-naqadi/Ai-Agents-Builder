"""
Deployment management API routes.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import sys
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.api_service import deploy_agent_api, check_deployment_status, generate_postman_collection
from services.agent_service import get_agent
from api.models.responses import StandardResponse

router = APIRouter(prefix="/api/v1/agents/{agent_id}/deployment", tags=["deployment"])


@router.get("", response_model=StandardResponse)
async def get_deployment_status(agent_id: str):
    """Get deployment status for an agent."""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        status = check_deployment_status(agent_id)
        return StandardResponse(
            success=True,
            data=status,
            message="Deployment status retrieved"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=StandardResponse)
async def deploy_agent(agent_id: str, regenerate: bool = False):
    """Deploy an agent as an API."""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        deployment = deploy_agent_api(agent_id, regenerate=regenerate)
        
        if deployment["success"]:
            return StandardResponse(
                success=True,
                data=deployment,
                message="Agent deployed successfully"
            )
        else:
            raise HTTPException(status_code=500, detail=deployment.get("error", "Deployment failed"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/postman", response_model=StandardResponse)
async def get_postman_collection(agent_id: str):
    """Get Postman collection for an agent's API."""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if not agent.is_deployed:
        raise HTTPException(status_code=400, detail="Agent is not deployed")
    
    try:
        collection = generate_postman_collection(agent)
        return StandardResponse(
            success=True,
            data=collection,
            message="Postman collection generated"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

