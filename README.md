# AI vs Algorithms: Live Maze Learning & Racing Platform

A real-time platform where classical pathfinding algorithms and reinforcement learning agents solve mazes side-by-side with live visualization.

## Stage 1 Scope

- React + TypeScript + Vite frontend
- TailwindCSS dark interface
- FastAPI backend
- CORS configured for local frontend development
- `/health` endpoint
- Maze environment and random maze generation API

Algorithms, reinforcement learning agents, WebSocket racing, and the future C core are intentionally left for later stages.

## Project Structure

```text
frontend/          React app
backend/           FastAPI app
docs/              Project documentation
```

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check: `GET http://localhost:8000/health`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server: `http://localhost:5173`
