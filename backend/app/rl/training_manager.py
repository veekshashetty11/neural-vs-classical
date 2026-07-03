from __future__ import annotations

import asyncio
from dataclasses import dataclass
from uuid import uuid4

from app.algorithms.grid_environment import Grid
from app.models.algorithm import environment_from_grid
from app.rl.q_learning import QLearningAgent

TRAINING_EVENT_DELAY_SECONDS = 0.01


@dataclass(slots=True)
class QLearningTrainingConfig:
    grid: Grid
    episodes: int
    learning_rate: float
    discount_factor: float
    epsilon: float
    epsilon_decay: float
    min_epsilon: float


@dataclass(slots=True)
class TrainingSession:
    training_id: str
    queue: asyncio.Queue[dict[str, object]]
    task: asyncio.Task[None]


class TrainingManager:
    """Own active RL training sessions and their event queues."""

    def __init__(self) -> None:
        self._sessions: dict[str, TrainingSession] = {}

    def start_qlearning(self, config: QLearningTrainingConfig) -> str:
        training_id = uuid4().hex
        queue: asyncio.Queue[dict[str, object]] = asyncio.Queue()
        task = asyncio.create_task(self._run_qlearning(config, queue))
        self._sessions[training_id] = TrainingSession(
            training_id=training_id,
            queue=queue,
            task=task,
        )
        task.add_done_callback(lambda _: self._cleanup_finished(training_id))
        return training_id

    def get_session(self, training_id: str) -> TrainingSession | None:
        return self._sessions.get(training_id)

    def _cleanup_finished(self, training_id: str) -> None:
        session = self._sessions.get(training_id)
        if session is not None and session.task.done() and session.queue.empty():
            self._sessions.pop(training_id, None)

    async def _run_qlearning(
        self,
        config: QLearningTrainingConfig,
        queue: asyncio.Queue[dict[str, object]],
    ) -> None:
        environment = environment_from_grid(config.grid)
        agent = QLearningAgent(
            environment=environment,
            learning_rate=config.learning_rate,
            discount_factor=config.discount_factor,
            epsilon=config.epsilon,
            epsilon_decay=config.epsilon_decay,
            min_epsilon=config.min_epsilon,
        )
        max_steps = max(1, environment.rows * environment.cols * 4)

        for episode in range(1, config.episodes + 1):
            await queue.put({"event": "episode_start", "episode": episode})
            events, steps, reward = agent.train_episode(max_steps=max_steps)

            for event in events:
                await queue.put(event)
                await asyncio.sleep(TRAINING_EVENT_DELAY_SECONDS)

            await queue.put(
                {
                    "event": "episode_complete",
                    "episode": episode,
                    "steps": steps,
                    "reward": reward,
                }
            )

        await queue.put({"event": "training_complete"})


training_manager = TrainingManager()
