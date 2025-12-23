"""
Agent management API routes.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from typing import List, Optional
from pydantic import BaseModel
import sys
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from services.agent_service import (
    create_agent, get_agent, get_all_agents,
    update_agent, delete_agent
)
from models.agent import AgentCreate, AgentUpdate, Resource
from api.models.responses import StandardResponse
import json

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


class AgentResponse(BaseModel):
    """Agent response model."""
    id: str
    name: str
    role: str
    backstory: str
    goal: str
    resources: List[dict]
    created_at: str
    updated_at: str
    api_token: Optional[str] = None
    api_endpoint: Optional[str] = None
    is_deployed: bool


@router.get("", response_model=StandardResponse)
async def list_agents():
    """Get all agents."""
    try:
        agents = get_all_agents()
        agents_data = [agent.model_dump() for agent in agents]
        return StandardResponse(
            success=True,
            data=agents_data,
            message=f"Found {len(agents_data)} agents"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}", response_model=StandardResponse)
async def get_agent_by_id(agent_id: str):
    """Get a specific agent by ID."""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return StandardResponse(
        success=True,
        data=agent.model_dump(),
        message="Agent retrieved successfully"
    )


@router.post("", response_model=StandardResponse)
async def create_new_agent(
    name: str = Form(...),
    role: str = Form(...),
    backstory: str = Form(...),
    goal: str = Form(...),
    resources: Optional[str] = Form(None),  # JSON string
    documents: Optional[List[UploadFile]] = File(None)
):
    """Create a new agent."""
    try:
        # Parse resources JSON
        resources_list = []
        if resources:
            try:
                resources_data = json.loads(resources)
                resources_list = [Resource(**r) for r in resources_data]
            except Exception as e:
                return StandardResponse(
                    success=False,
                    error=f"Invalid resources format: {str(e)}"
                )
        
        # Validate field lengths before creating agent
        validation_errors = []
        if len(name.strip()) < 1:
            validation_errors.append("Name must be at least 1 character")
        if len(role.strip()) < 10:
            validation_errors.append("Role must be at least 10 characters")
        if len(backstory.strip()) < 20:
            validation_errors.append("Backstory must be at least 20 characters")
        if len(goal.strip()) < 10:
            validation_errors.append("Goal must be at least 10 characters")
        
        if validation_errors:
            return StandardResponse(
                success=False,
                error="Validation failed: " + "; ".join(validation_errors)
                )
        
        # Create agent
        try:
            agent_data = AgentCreate(
                name=name,
                role=role,
                backstory=backstory,
                goal=goal,
                resources=resources_list,
            )
        except Exception as e:
            # Pydantic validation error
            error_msg = str(e)
            if "string_too_short" in error_msg:
                # Extract field names from error
                if "role" in error_msg.lower():
                    error_msg = "Role must be at least 10 characters"
                elif "backstory" in error_msg.lower():
                    error_msg = "Backstory must be at least 20 characters"
                elif "goal" in error_msg.lower():
                    error_msg = "Goal must be at least 10 characters"
            return StandardResponse(
                success=False,
                error=f"Validation error: {error_msg}",
            )
        
        agent = create_agent(agent_data)
        
        # Handle document uploads
        if documents:
            from services.document_service import save_uploaded_document
            from services.agent_service import update_agent, AgentUpdate
            
            updated_resources = list(agent.resources)
            for doc_file in documents:
                try:
                    filename = save_uploaded_document(agent.id, doc_file, doc_file.filename)
                    # Find matching resource or create new one
                    doc_name = doc_file.filename.rsplit('.', 1)[0] if '.' in doc_file.filename else doc_file.filename
                    updated_resources.append(Resource(
                        type="document",
                        name=doc_name,
                        value=filename
                    ))
                except Exception as e:
                    pass  # Skip failed uploads
            
            if updated_resources != agent.resources:
                update_agent(agent.id, AgentUpdate(resources=updated_resources))
                agent = get_agent(agent.id)
        
        return StandardResponse(
            success=True,
            data=agent.model_dump(),
            message="Agent created successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{agent_id}", response_model=StandardResponse)
async def update_agent_by_id(
    agent_id: str,
    name: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    backstory: Optional[str] = Form(None),
    goal: Optional[str] = Form(None),
    resources: Optional[str] = Form(None),  # JSON string
    documents: Optional[List[UploadFile]] = File(None)
):
    """Update an agent."""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        # Parse resources JSON if provided
        resources_list = None
        if resources:
            try:
                resources_data = json.loads(resources)
                resources_list = [Resource(**r) for r in resources_data]
            except Exception as e:
                return StandardResponse(
                    success=False,
                    error=f"Invalid resources format: {str(e)}"
                )
        
        update_data = AgentUpdate(
            name=name,
            role=role,
            backstory=backstory,
            goal=goal,
            resources=resources_list
        )
        
        updated_agent = update_agent(agent_id, update_data)
        if not updated_agent:
            raise HTTPException(status_code=500, detail="Failed to update agent")
        
        # Handle document uploads
        if documents:
            from services.document_service import save_uploaded_document
            
            updated_resources = list(updated_agent.resources)
            for doc_file in documents:
                try:
                    filename = save_uploaded_document(agent_id, doc_file, doc_file.filename)
                    # Find matching resource or create new one
                    doc_name = doc_file.filename.rsplit('.', 1)[0] if '.' in doc_file.filename else doc_file.filename
                    updated_resources.append(Resource(
                        type="document",
                        name=doc_name,
                        value=filename
                    ))
                except Exception as e:
                    pass  # Skip failed uploads
            
            if updated_resources != updated_agent.resources:
                update_agent(agent_id, AgentUpdate(resources=updated_resources))
                updated_agent = get_agent(agent_id)
        
        return StandardResponse(
            success=True,
            data=updated_agent.model_dump(),
            message="Agent updated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{agent_id}", response_model=StandardResponse)
async def delete_agent_by_id(agent_id: str):
    """Delete an agent."""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    try:
        if delete_agent(agent_id):
            return StandardResponse(
                success=True,
                message="Agent deleted successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to delete agent")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

