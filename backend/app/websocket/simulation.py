from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError, field_validator

from app.models.algorithm import AlgorithmRequest, environment_from_grid
from app.services.solver_registry import get_solver

STREAM_DELAY_SECONDS = 0.1

router = APIRouter(tags=["simulation websocket"])


class SimulationRequest(AlgorithmRequest):
    """Initial WebSocket payload selecting both grid and algorithm."""

    algorithm: str

    @field_validator("algorithm")
    @classmethod
    def normalize_algorithm(cls, algorithm: str) -> str:
        normalized = algorithm.lower()
        get_solver(normalized)
        return normalized


class ErrorEvent(BaseModel):
    event: str = "error"
    message: str


@router.websocket("/ws/simulation")
async def stream_simulation(websocket: WebSocket) -> None:
    """Stream algorithm visualization events to a connected client.

    The client sends one setup message containing the algorithm name and grid.
    The server then emits one `visit` event per explored cell, one `path` event
    per final-path cell, and a final `complete` event with summary metrics.
    """

    await websocket.accept()

    try:
        raw_payload = await websocket.receive_json()
        payload = SimulationRequest.model_validate(raw_payload)
        environment = environment_from_grid(payload.grid)
        result = get_solver(payload.algorithm)(environment)

        for cell in result.visited_order:
            await websocket.send_json({"event": "visit", "cell": cell})
            await asyncio.sleep(STREAM_DELAY_SECONDS)

        for cell in result.path:
            await websocket.send_json({"event": "path", "cell": cell})
            await asyncio.sleep(STREAM_DELAY_SECONDS)

        await websocket.send_json(
            {
                "event": "complete",
                "nodes_explored": result.nodes_explored,
                "path_length": len(result.path),
                "execution_ms": result.execution_ms,
            }
        )
    except WebSocketDisconnect:
        # A user may generate a new maze, change algorithms, or close the tab
        # while a stream is active. No cleanup is needed beyond ending the task.
        return
    except (ValidationError, ValueError) as exc:
        await websocket.send_json(ErrorEvent(message=str(exc)).model_dump())
        await websocket.close(code=1003)
