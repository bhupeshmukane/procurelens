from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .database import init_db
from .routers import evaluations, documents, pipeline, scoring, evidence, demo

app = FastAPI(
    title="ProcureLens API",
    description="Enterprise AI Procurement Decision-Intelligence Platform Backend",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database schema
@app.on_event("startup")
def on_startup():
    init_db()

# Mount API routers
app.include_router(evaluations.router)
app.include_router(documents.router)
app.include_router(pipeline.router)
app.include_router(scoring.router)
app.include_router(evidence.router)
app.include_router(demo.router)

# Serve Vite-built production frontend as the SINGLE source of truth
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists():
    # Mount assets folder
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api"):
            return {"error": "API route not found"}
        
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Fallback to index.html for client-side routing
        index_path = FRONTEND_DIST / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"error": "Vite frontend build not found"}
else:
    @app.get("/")
    def serve_fallback():
        return {
            "app": "ProcureLens API",
            "status": "online",
            "message": "Frontend not built yet. Run 'npm run build' in /frontend directory."
        }
