"""
Run the FastAPI server.
"""
import uvicorn
from api.server import app
import config

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=config.API_HOST,
        port=config.API_PORT,
        reload=True
    )


