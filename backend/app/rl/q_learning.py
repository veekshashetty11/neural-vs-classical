from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Literal

from app.algorithms.grid_environment import Cell, GridEnvironment

Action = Literal["UP", "DOWN", "LEFT", "RIGHT"]

ACTIONS: tuple[Action, ...] = ("UP", "DOWN", "LEFT", "RIGHT")
ACTION_DELTAS: dict[Action, Cell] = {
    "UP": (-1, 0),
    "DOWN": (1, 0),
    "LEFT": (0, -1),
    "RIGHT": (0, 1),
}


@dataclass(slots=True)
class QLearningAgent:
    """Tabular Q-learning agent for grid navigation."""

    environment: GridEnvironment
    learning_rate: float = 0.1
    discount_factor: float = 0.9
    epsilon: float = 0.2
    epsilon_decay: float = 0.995
    min_epsilon: float = 0.01
    rng: random.Random = field(default_factory=random.Random)
    q_table: dict[Cell, dict[Action, float]] = field(init=False)

    def __post_init__(self) -> None:
        self.q_table = {
            (row, col): {action: 0.0 for action in ACTIONS}
            for row in range(self.environment.rows)
            for col in range(self.environment.cols)
            if self.environment.is_valid_cell((row, col))
        }

    def q_values(self, state: Cell) -> dict[Action, float]:
        """Return initialized action values for a state."""

        if state not in self.q_table:
            self.q_table[state] = {action: 0.0 for action in ACTIONS}
        return self.q_table[state]

    def select_action(self, state: Cell) -> Action:
        """Select an action using epsilon-greedy exploration."""

        if self.rng.random() < self.epsilon:
            return self.rng.choice(ACTIONS)

        values = self.q_values(state)
        best_value = max(values.values())
        best_actions = [action for action, value in values.items() if value == best_value]
        return self.rng.choice(best_actions)

    def step(self, state: Cell, action: Action) -> tuple[Cell, int, bool]:
        """Apply an action and return next state, reward, and terminal flag."""

        row_delta, col_delta = ACTION_DELTAS[action]
        next_state = (state[0] + row_delta, state[1] + col_delta)

        if not self.environment.is_valid_cell(next_state):
            return state, -10, False

        if next_state == self.environment.goal:
            return next_state, 100, True

        return next_state, -1, False

    def update(self, state: Cell, action: Action, reward: int, next_state: Cell) -> None:
        """Apply the Bellman update rule to one state-action pair."""

        values = self.q_values(state)
        current_value = values[action]
        next_best_value = max(self.q_values(next_state).values())
        values[action] = current_value + self.learning_rate * (
            reward + self.discount_factor * next_best_value - current_value
        )

    def decay_epsilon(self) -> None:
        """Reduce exploration while respecting the configured minimum."""

        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)

    def train_episode(self, max_steps: int) -> tuple[list[dict[str, object]], int, int]:
        """Train for one episode and return streamed events, steps, and reward."""

        state = self.environment.start
        total_reward = 0
        events: list[dict[str, object]] = []

        for step_number in range(1, max_steps + 1):
            action = self.select_action(state)
            next_state, reward, done = self.step(state, action)
            self.update(state, action, reward, next_state)

            state = next_state
            total_reward += reward
            events.append({"event": "agent_move", "position": state})
            events.append({"event": "q_values", "state": state, "values": self.q_values(state)})

            if done:
                self.decay_epsilon()
                return events, step_number, total_reward

        self.decay_epsilon()
        return events, max_steps, total_reward
