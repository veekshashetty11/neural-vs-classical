from fastapi import APIRouter

from app.algorithms.grid_environment import GridEnvironment
from app.models.maze import MazeGenerateRequest, MazeGenerateResponse

router = APIRouter(prefix="/maze", tags=["maze"])


@router.post("/generate", response_model=MazeGenerateResponse)
def generate_maze(payload: MazeGenerateRequest) -> MazeGenerateResponse:
    """Generate a random grid maze for the frontend simulation arena."""

    environment = GridEnvironment.generate_random(
        rows=payload.rows,
        cols=payload.cols,
        obstacle_density=payload.obstacle_density,
    )

    return MazeGenerateResponse(
        grid=environment.to_grid(),
        start=environment.start,
        goal=environment.goal,
    )
