"""
Data models for Agent entities.
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime
from uuid import UUID, uuid4


class Resource(BaseModel):
    """Resource model for agent tools and links."""
    type: str = Field(..., description="Type of resource: 'tool', 'link', or 'document'")
    name: str = Field(..., description="Name or title of the resource")
    value: str = Field(..., description="URL, tool name, or document path")
    description: Optional[str] = Field(None, description="Optional description")


class Agent(BaseModel):
    """Agent model with all required fields."""
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique agent ID")
    name: str = Field(..., min_length=1, max_length=100, description="Agent name")
    role: str = Field(..., min_length=10, description="Agent role description")
    backstory: str = Field(..., min_length=20, description="Agent backstory")
    goal: str = Field(..., min_length=10, description="Agent goal")
    resources: List[Resource] = Field(default_factory=list, description="List of resources (tools, links)")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    api_token: Optional[str] = Field(None, description="API token if deployed")
    api_endpoint: Optional[str] = Field(None, description="API endpoint URL if deployed")
    is_deployed: bool = Field(default=False, description="Whether agent is deployed as API")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AgentCreate(BaseModel):
    """Model for creating a new agent."""
    name: str
    role: str
    backstory: str
    goal: str
    resources: List[Resource] = []


class AgentUpdate(BaseModel):
    """Model for updating an existing agent."""
    name: Optional[str] = None
    role: Optional[str] = None
    backstory: Optional[str] = None
    goal: Optional[str] = None
    resources: Optional[List[Resource]] = None


