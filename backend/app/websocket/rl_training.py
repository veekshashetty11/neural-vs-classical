from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.rl.training_manager import training_manager

router = APIRouter(tags=["reinforcement learning websocket"])


@router.websocket("/ws/rl/train/{training_id}")
async def stream_rl_training(websocket: WebSocket, training_id: str) -> None:
    """Stream queued Q-learning training events for a session."""

    session = training_manager.get_session(training_id)
    if session is None:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    try:
        while True:
            event = await session.queue.get()
            await websocket.send_json(event)
            session.queue.task_done()

            if event.get("event") == "training_complete":
                break
    except WebSocketDisconnect:
        return
