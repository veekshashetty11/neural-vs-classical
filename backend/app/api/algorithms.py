from fastapi import APIRouter

from app.models.algorithm import AlgorithmRequest, AlgorithmResponse, environment_from_grid
from app.services.solver_registry import get_solver

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


def solve(payload: AlgorithmRequest, algorithm: str) -> AlgorithmResponse:
    """Build the environment once and pass it to the selected solver."""

    environment = environment_from_grid(payload.grid)
    return get_solver(algorithm)(environment)


@router.post("/astar", response_model=AlgorithmResponse)
def solve_with_astar(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with A* and return visualization events."""

    return solve(payload, "astar")


@router.post("/bfs", response_model=AlgorithmResponse)
def solve_with_bfs(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with breadth-first search."""

    return solve(payload, "bfs")


@router.post("/dfs", response_model=AlgorithmResponse)
def solve_with_dfs(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with depth-first search."""

    return solve(payload, "dfs")


@router.post("/dijkstra", response_model=AlgorithmResponse)
def solve_with_dijkstra(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with Dijkstra's algorithm."""

    return solve(payload, "dijkstra")
