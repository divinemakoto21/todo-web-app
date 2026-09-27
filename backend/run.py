"""
TaskFlow Pro - FastAPI Server Runner
Starts Uvicorn server on http://127.0.0.1:8000
"""

import uvicorn

if __name__ == "__main__":
    print("Starting TaskFlow Pro FastAPI Backend Server...")
    print("API Documentation available at: http://127.0.0.1:8000/docs")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
