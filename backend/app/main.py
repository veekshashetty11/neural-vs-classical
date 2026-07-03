from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# FastAPI owns the HTTP and future WebSocket surface for the platform. Keeping
# the app instance small at this stage makes later routers easy to add without
# mixing simulation logic into the server bootstrap.
app = FastAPI(
    title="AI vs Algorithms API",
    description="Backend API for live maze learning and racing experiments.",
    version="0.1.0",
)

# The Vite development server runs on port 5173 by default. CORS is intentionally
# scoped to local frontend origins for Stage 1, while still allowing credentials
# for future authenticated or session-based real-time flows.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    """Return a lightweight readiness signal for clients and deploy checks."""

    return {"status": "ok"}
