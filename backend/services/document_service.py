"""
Service for handling document resources (file uploads, text extraction).
"""
import os
from pathlib import Path
from typing import Optional
import config


def save_uploaded_document(agent_id: str, file, filename: str) -> str:
    """
    Save an uploaded document file to the agent's documents directory.
    
    Args:
        agent_id: Agent ID
        file: Uploaded file object (from Streamlit)
        filename: Original filename
    
    Returns:
        Path to saved document (filename only, relative to documents dir)
    """
    # Create documents directory for agent
    documents_dir = config.get_agent_documents_dir(agent_id)
    
    # Sanitize filename
    safe_filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    if not safe_filename:
        safe_filename = "document"
    
    # Save file
    file_path = documents_dir / safe_filename
    with open(file_path, "wb") as f:
        # Support both Streamlit-style uploads (getbuffer) and FastAPI UploadFile
        if hasattr(file, "getbuffer"):
            # Streamlit UploadedFile
            f.write(file.getbuffer())
        elif hasattr(file, "file"):
            # FastAPI UploadFile
            file.file.seek(0)
            f.write(file.file.read())
        else:
            # Fallback: try to read directly
            data = getattr(file, "read", lambda: b"")()
            f.write(data or b"")
    
    return safe_filename  # Return just filename, path will be resolved when needed


def extract_text_from_document(file_path: str) -> Optional[str]:
    """
    Extract text content from a document file.
    Supports: .txt, .md, .pdf (basic), .py, .js, .json, etc.
    
    Args:
        file_path: Path to document file
    
    Returns:
        Extracted text content or None if extraction fails
    """
    file_path_obj = Path(file_path)
    
    if not file_path_obj.exists():
        return None
    
    extension = file_path_obj.suffix.lower()
    
    try:
        # Text files
        if extension in ['.txt', '.md', '.py', '.js', '.json', '.yaml', '.yml', '.csv', '.html', '.css', '.xml']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        
        # PDF files (requires PyPDF2 or pdfplumber)
        elif extension == '.pdf':
            try:
                import PyPDF2
                text = ""
                with open(file_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
                return text
            except ImportError:
                return f"[PDF file: {file_path_obj.name} - Install PyPDF2 for PDF text extraction]"
            except Exception as e:
                return f"[Error reading PDF: {str(e)}]"
        
        # Word documents (requires python-docx)
        elif extension in ['.docx', '.doc']:
            try:
                from docx import Document
                doc = Document(file_path)
                return "\n".join([para.text for para in doc.paragraphs])
            except ImportError:
                return f"[Word file: {file_path_obj.name} - Install python-docx for Word document extraction]"
            except Exception as e:
                return f"[Error reading Word document: {str(e)}]"
        
        else:
            return f"[Unsupported file type: {extension}. File saved at: {file_path}]"
    
    except Exception as e:
        return f"[Error reading file: {str(e)}]"


def get_document_content(agent_id: str, document_filename: str) -> Optional[str]:
    """
    Get text content from a document resource.
    
    Args:
        agent_id: Agent ID
        document_filename: Document filename (stored in resource value)
    
    Returns:
        Document text content
    """
    # Get full path to document
    documents_dir = config.get_agent_documents_dir(agent_id)
    document_path = documents_dir / document_filename
    
    return extract_text_from_document(str(document_path))


def list_agent_documents(agent_id: str) -> list:
    """
    List all documents for an agent.
    
    Args:
        agent_id: Agent ID
    
    Returns:
        List of document filenames
    """
    documents_dir = config.get_agent_documents_dir(agent_id)
    
    if not documents_dir.exists():
        return []
    
    return [f.name for f in documents_dir.iterdir() if f.is_file()]


def delete_document(agent_id: str, document_filename: str) -> bool:
    """
    Delete a document file for an agent.
    
    Args:
        agent_id: Agent ID
        document_filename: Document filename to delete
    
    Returns:
        True if deleted, False if not found
    """
    documents_dir = config.get_agent_documents_dir(agent_id)
    document_path = documents_dir / document_filename
    
    if document_path.exists() and document_path.is_file():
        try:
            document_path.unlink()
            return True
        except Exception:
            return False
    
    return False

