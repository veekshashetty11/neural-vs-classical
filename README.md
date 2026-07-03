# AI vs Algorithms: Live Maze Learning & Racing Platform

A real-time platform where classical pathfinding algorithms and reinforcement learning agents solve mazes side-by-side with live visualization.

## Stage 1 Scope

- React + TypeScript + Vite frontend
- TailwindCSS dark interface
- FastAPI backend with CORS configured for local frontend development
- `GET /health` readiness endpoint
- `POST /maze/generate` random maze generation endpoint
- Shared grid environment contract for future solvers
- Classical BFS, DFS, Dijkstra, and A* solvers
- `WS /ws/simulation` real-time solver visualization stream

Reinforcement learning agents, multi-agent racing, and the future C core are intentionally left for later stages.

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

Generate maze:

```bash
curl -X POST http://localhost:8000/maze/generate \
  -H "Content-Type: application/json" \
  -d '{"rows":20,"cols":20,"obstacle_density":0.25}'
```

Stream a solver run over WebSockets:

```text
WS /ws/simulation
```

Send one setup payload after connecting:

```json
{"algorithm":"astar","grid":[[0,0],[0,0]]}
```

The server emits events as cells are visualized:

```json
{"event":"visit","cell":[0,0]}
{"event":"path","cell":[1,1]}
{"event":"complete"}
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server: `http://localhost:5173`

Set `VITE_API_BASE_URL` if the FastAPI server is not running on `http://localhost:8000`.
