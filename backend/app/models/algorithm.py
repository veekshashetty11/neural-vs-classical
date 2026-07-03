from pydantic import BaseModel, Field, field_validator

from app.algorithms.grid_environment import GridEnvironment


class AlgorithmRequest(BaseModel):
    """Grid payload submitted by the frontend for solver execution."""

    grid: list[list[int]] = Field(..., description="2D maze grid where 0=open and 1=wall.")

    @field_validator("grid")
    @classmethod
    def validate_grid(cls, grid: list[list[int]]) -> list[list[int]]:
        if not grid or not grid[0]:
            raise ValueError("grid must contain at least one row and one column")

        expected_cols = len(grid[0])
        for row in grid:
            if len(row) != expected_cols:
                raise ValueError("grid rows must all have the same length")
            if any(cell not in {0, 1} for cell in row):
                raise ValueError("grid cells must be 0 for open or 1 for wall")

        return grid


class AlgorithmResponse(BaseModel):
    """Serializable pathfinding result shared by every algorithm endpoint."""

    visited_order: list[tuple[int, int]]
    path: list[tuple[int, int]]
    nodes_explored: int
    execution_ms: float


def environment_from_grid(grid: list[list[int]]) -> GridEnvironment:
    """Convert a client grid into the common environment abstraction."""

    rows = len(grid)
    cols = len(grid[0])
    walls = {
        (row_index, col_index)
        for row_index, row in enumerate(grid)
        for col_index, cell in enumerate(row)
        if cell == 1
    }

    return GridEnvironment(rows=rows, cols=cols, walls=walls)
