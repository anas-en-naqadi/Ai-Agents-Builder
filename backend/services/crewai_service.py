"""
Service for integrating with CrewAI to create and execute agents.
"""
import os
import sys
from crewai import Agent, Task, Crew, LLM, Process
from typing import Optional
import config
from models.agent import Agent as AgentModel


# Fix encoding for Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')


def create_crewai_agent(agent_model: AgentModel) -> Agent:
    """
    Create a CrewAI Agent from an AgentModel.
    
    Args:
        agent_model: Agent model with role, backstory, goal, etc.
    
    Returns:
        CrewAI Agent object
    """
    # Initialize LLM
    llm = LLM(
        model=config.LLM_MODEL,
        temperature=config.LLM_TEMPERATURE,
        api_key=config.GROQ_API_KEY
    )
    
    # Create CrewAI Agent
    crewai_agent = Agent(
        role=agent_model.role,
        goal=agent_model.goal,
        backstory=agent_model.backstory,
        llm=llm,
        verbose=True
    )
    
    return crewai_agent


def execute_agent_task(agent_model: AgentModel, prompt: str) -> str:
    """
    Execute a task with a single agent.
    
    Args:
        agent_model: Agent model
        prompt: User prompt/task description
    
    Returns:
        Agent response as string
    """
    try:
        # Create CrewAI agent
        crewai_agent = create_crewai_agent(agent_model)
        
        # Create a task
        task = Task(
            description=prompt,
            expected_output="A detailed response addressing the user's request.",
            agent=crewai_agent
        )
        
        # Create crew with single agent
        crew = Crew(
            agents=[crewai_agent],
            tasks=[task],
            process=Process.sequential,
            verbose=True
        )
        
        # Execute
        result = crew.kickoff()
        return str(result)
    
    except Exception as e:
        return f"Error executing agent task: {str(e)}"


def format_resources_for_context(resources: list, agent_id: str = None) -> str:
    """
    Format agent resources into a context string with actual content.
    
    Args:
        resources: List of resource dictionaries
        agent_id: Agent ID (for accessing documents)
    
    Returns:
        Formatted context string with resource content
    """
    if not resources:
        return ""
    
    from services.tool_service import format_tools_for_context
    from services.document_service import get_document_content
    
    context_parts = []
    
    tools = [r for r in resources if r.get('type') == 'tool']
    links = [r for r in resources if r.get('type') == 'link']
    documents = [r for r in resources if r.get('type') == 'document']
    
    # Format tools with usage instructions
    if tools:
        context_parts.append(format_tools_for_context(tools))
        context_parts.append("")
    
    # Format links
    if links:
        context_parts.append("=== Available Links ===")
        context_parts.append("You can reference these links for information:")
        for link in links:
            context_parts.append(f"  - {link.get('name', 'Unknown')}: {link.get('value', '')}")
        context_parts.append("")
    
    # Format documents with actual content
    if documents and agent_id:
        context_parts.append("=== Available Documents ===")
        context_parts.append("You have access to the following documents. Use their content to answer questions:")
        context_parts.append("")
        
        for doc in documents:
            doc_name = doc.get('name', 'Unknown Document')
            doc_path = doc.get('value', '')
            
            context_parts.append(f"**Document: {doc_name}**")
            
            # Try to extract and include document content
            if doc_path:
                doc_content = get_document_content(agent_id, doc_path)
                if doc_content and not doc_content.startswith('['):
                    # Include first 2000 characters of document
                    preview = doc_content[:2000]
                    if len(doc_content) > 2000:
                        preview += f"\n... [Document continues, {len(doc_content)} total characters]"
                    context_parts.append(f"Content:\n{preview}")
                else:
                    context_parts.append(f"Path: {doc_path}")
                    if doc_content and doc_content.startswith('['):
                        context_parts.append(f"Note: {doc_content}")
            else:
                context_parts.append("No file path specified")
            
            context_parts.append("")
    
    return "\n".join(context_parts)


