from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import Iterable

Cell = tuple[int, int]
Grid = list[list[int]]


@dataclass(slots=True)
class GridEnvironment:
    """Represent a rectangular maze that solvers can inspect and move through.

    The environment deliberately contains no pathfinding behavior. Classical
    algorithms and RL agents will consume this shared contract in later stages.
    """

    rows: int
    cols: int
    start: Cell = (0, 0)
    goal: Cell | None = None
    walls: set[Cell] = field(default_factory=set)

    def __post_init__(self) -> None:
        if self.rows <= 0 or self.cols <= 0:
            raise ValueError("rows and cols must be positive integers")

        if self.goal is None:
            self.goal = (self.rows - 1, self.cols - 1)

        if not self.in_bounds(self.start):
            raise ValueError("start cell must be inside the grid")
        if not self.in_bounds(self.goal):
            raise ValueError("goal cell must be inside the grid")

        # The start and goal must always remain traversable so every solver has
        # a valid launch point and target, even in dense random mazes.
        self.walls.discard(self.start)
        self.walls.discard(self.goal)

    def in_bounds(self, cell: Cell) -> bool:
        """Return True when a cell lies inside the grid rectangle."""

        row, col = cell
        return 0 <= row < self.rows and 0 <= col < self.cols

    def is_wall(self, cell: Cell) -> bool:
        """Return True when a cell is blocked by an obstacle."""

        return cell in self.walls

    def is_valid_cell(self, cell: Cell) -> bool:
        """Return True when a solver may occupy a cell."""

        return self.in_bounds(cell) and not self.is_wall(cell)

    def validate_move(self, current: Cell, next_cell: Cell) -> bool:
        """Validate a one-step cardinal move from current to next_cell."""

        if not self.is_valid_cell(current) or not self.is_valid_cell(next_cell):
            return False

        row_delta = abs(current[0] - next_cell[0])
        col_delta = abs(current[1] - next_cell[1])
        return row_delta + col_delta == 1

    def valid_neighbors(self, cell: Cell) -> list[Cell]:
        """Return traversable north, south, west, and east neighbors."""

        row, col = cell
        candidates: Iterable[Cell] = (
            (row - 1, col),
            (row + 1, col),
            (row, col - 1),
            (row, col + 1),
        )
        return [candidate for candidate in candidates if self.is_valid_cell(candidate)]

    def to_grid(self) -> Grid:
        """Serialize walls into a 2D grid: 0 is open, 1 is wall."""

        return [
            [1 if (row, col) in self.walls else 0 for col in range(self.cols)]
            for row in range(self.rows)
        ]

    @classmethod
    def generate_random(
        cls,
        rows: int,
        cols: int,
        obstacle_density: float,
        *,
        rng: random.Random | None = None,
    ) -> "GridEnvironment":
        """Create a random maze by sampling each non-terminal cell as a wall.

        The method accepts an optional random generator so tests can later pass a
        deterministic seed without changing the production API.
        """

        if rows not in {10, 20, 30} or cols not in {10, 20, 30}:
            raise ValueError("rows and cols must be one of: 10, 20, 30")
        if not 0 <= obstacle_density <= 0.6:
            raise ValueError("obstacle_density must be between 0 and 0.6")

        generator = rng or random.Random()
        start = (0, 0)
        goal = (rows - 1, cols - 1)
        walls: set[Cell] = set()

        for row in range(rows):
            for col in range(cols):
                cell = (row, col)
                if cell in {start, goal}:
                    continue
                if generator.random() < obstacle_density:
                    walls.add(cell)

        return cls(rows=rows, cols=cols, start=start, goal=goal, walls=walls)
