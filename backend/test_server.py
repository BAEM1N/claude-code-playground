"""
Minimal test server to verify backend connectivity
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Test API Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "name": "Test API Server",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/test")
async def test_endpoint():
    return {
        "message": "Backend is working!",
        "data": {
            "frontend_can_connect": True,
            "cors_enabled": True
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "test_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )
