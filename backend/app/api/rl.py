from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.models.algorithm import AlgorithmRequest
from app.rl.training_manager import QLearningTrainingConfig, training_manager

router = APIRouter(prefix="/rl", tags=["reinforcement learning"])


class QLearningTrainingRequest(AlgorithmRequest):
    """Configuration payload for tabular Q-learning training."""

    episodes: int = Field(default=300, ge=1, le=2000)
    learning_rate: float = Field(default=0.1, ge=0.001, le=1.0)
    discount_factor: float = Field(default=0.9, ge=0.0, le=1.0)
    epsilon: float = Field(default=0.3, ge=0.0, le=1.0)
    epsilon_decay: float = Field(default=0.995, ge=0.8, le=1.0)
    min_epsilon: float = Field(default=0.01, ge=0.0, le=1.0)


class QLearningTrainingResponse(BaseModel):
    training_id: str
    websocket_url: str


@router.post("/train/qlearning", response_model=QLearningTrainingResponse, status_code=202)
async def train_qlearning(payload: QLearningTrainingRequest) -> QLearningTrainingResponse:
    """Start Q-learning training and return immediately with a stream handle."""

    training_id = training_manager.start_qlearning(
        QLearningTrainingConfig(
            grid=payload.grid,
            episodes=payload.episodes,
            learning_rate=payload.learning_rate,
            discount_factor=payload.discount_factor,
            epsilon=payload.epsilon,
            epsilon_decay=payload.epsilon_decay,
            min_epsilon=payload.min_epsilon,
        )
    )

    return QLearningTrainingResponse(
        training_id=training_id,
        websocket_url=f"/ws/rl/train/{training_id}",
    )
