from pydantic import BaseModel, Field, field_validator

SUPPORTED_MAZE_SIZES = {10, 20, 30}


class MazeGenerateRequest(BaseModel):
    """Client-controlled settings for random maze creation."""

    rows: int = Field(..., description="Number of maze rows. Supported: 10, 20, 30.")
    cols: int = Field(..., description="Number of maze columns. Supported: 10, 20, 30.")
    obstacle_density: float = Field(
        0.25,
        ge=0,
        le=0.6,
        description="Probability that each non-start/non-goal cell becomes a wall.",
    )

    @field_validator("rows", "cols")
    @classmethod
    def validate_supported_size(cls, value: int) -> int:
        if value not in SUPPORTED_MAZE_SIZES:
            raise ValueError("maze size must be one of: 10, 20, 30")
        return value


class MazeGenerateResponse(BaseModel):
    """JSON representation consumed by the React maze renderer."""

    grid: list[list[int]]
    start: tuple[int, int]
    goal: tuple[int, int]
