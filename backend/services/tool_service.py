"""
Service for handling tool resources and tool integration.
"""
from typing import List, Dict, Optional
import json


# Available tools that agents can use
AVAILABLE_TOOLS = {
    "web_search": {
        "name": "Web Search",
        "description": "Search the web for information. Use this to find current information, research topics, or verify facts.",
        "usage": "When you need to search for information online, use web_search(query='your search term')"
    },
    "calculator": {
        "name": "Calculator",
        "description": "Perform mathematical calculations. Use this for arithmetic, algebra, or any numerical computations.",
        "usage": "For calculations, use calculator(expression='2+2') or calculator(expression='sqrt(16)')"
    },
    "code_executor": {
        "name": "Code Executor",
        "description": "Execute Python code snippets. Use this to run calculations, process data, or test code.",
        "usage": "To execute code, use code_executor(code='print(\"Hello\")')"
    },
    "file_reader": {
        "name": "File Reader",
        "description": "Read content from files. Use this to access local files or documents.",
        "usage": "To read a file, use file_reader(filepath='path/to/file.txt')"
    },
    "data_analyzer": {
        "name": "Data Analyzer",
        "description": "Analyze data structures, JSON, CSV files. Use this to process and understand data.",
        "usage": "To analyze data, use data_analyzer(data='your data', format='json')"
    },
    "text_processor": {
        "name": "Text Processor",
        "description": "Process and manipulate text. Use this for text analysis, formatting, or transformation.",
        "usage": "To process text, use text_processor(text='your text', operation='summarize')"
    }
}


def get_tool_info(tool_name: str) -> Optional[Dict]:
    """
    Get information about a specific tool.
    
    Args:
        tool_name: Name of the tool
    
    Returns:
        Tool information dictionary or None
    """
    return AVAILABLE_TOOLS.get(tool_name.lower())


def format_tools_for_context(tools: List[Dict]) -> str:
    """
    Format tool resources into a context string that explains how to use them.
    
    Args:
        tools: List of tool resource dictionaries
    
    Returns:
        Formatted context string with tool usage instructions
    """
    if not tools:
        return ""
    
    context_parts = ["\n=== Available Tools ==="]
    context_parts.append("You have access to the following tools. Use them when appropriate:")
    context_parts.append("")
    
    for tool in tools:
        tool_name = tool.get('name', '').lower().replace(' ', '_')
        tool_info = get_tool_info(tool_name)
        
        if tool_info:
            context_parts.append(f"**{tool_info['name']}**")
            context_parts.append(f"  Description: {tool_info['description']}")
            context_parts.append(f"  Usage: {tool_info['usage']}")
            context_parts.append("")
        else:
            # Custom tool
            tool_desc = tool.get('description', tool.get('value', ''))
            context_parts.append(f"**{tool.get('name', 'Custom Tool')}**")
            context_parts.append(f"  Description: {tool_desc}")
            context_parts.append("  Note: This is a custom tool. Use it as described in your instructions.")
            context_parts.append("")
    
    context_parts.append("When using tools, describe what you're doing and why.")
    context_parts.append("If a tool is not available, explain what you would do if it were available.")
    
    return "\n".join(context_parts)

