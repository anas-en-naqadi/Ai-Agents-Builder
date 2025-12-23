"""
Input validation utilities.
"""
import re
from urllib.parse import urlparse
from typing import List


def validate_url(url: str) -> bool:
    """
    Validate if a string is a valid URL.
    
    Args:
        url: URL string to validate
    
    Returns:
        True if valid URL, False otherwise
    """
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except Exception:
        return False


def validate_agent_name(name: str) -> tuple[bool, str]:
    """
    Validate agent name.
    
    Args:
        name: Agent name to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name or not name.strip():
        return False, "Agent name cannot be empty"
    
    if len(name) > 100:
        return False, "Agent name must be less than 100 characters"
    
    if not re.match(r'^[a-zA-Z0-9\s\-_]+$', name):
        return False, "Agent name can only contain letters, numbers, spaces, hyphens, and underscores"
    
    return True, ""


def validate_resources(resources: List[dict]) -> tuple[bool, str]:
    """
    Validate resources list.
    
    Args:
        resources: List of resource dictionaries
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    valid_types = ['tool', 'link', 'document']
    
    for resource in resources:
        if not isinstance(resource, dict):
            return False, "Each resource must be a dictionary"
        
        resource_type = resource.get('type', '').lower()
        if resource_type not in valid_types:
            return False, f"Resource type must be one of: {', '.join(valid_types)}"
        
        if resource_type == 'link':
            url = resource.get('value', '')
            if not validate_url(url):
                return False, f"Invalid URL: {url}"
        
        if not resource.get('name'):
            return False, "Each resource must have a name"
    
    return True, ""


