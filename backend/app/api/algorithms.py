from fastapi import APIRouter

from app.algorithms.astar import run_astar
from app.models.algorithm import AlgorithmRequest, AlgorithmResponse, environment_from_grid

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


@router.post("/astar", response_model=AlgorithmResponse)
def solve_with_astar(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with A* and return visualization events."""

    environment = environment_from_grid(payload.grid)
    return run_astar(environment)
