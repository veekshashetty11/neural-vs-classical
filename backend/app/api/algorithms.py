from fastapi import APIRouter

from app.algorithms.astar import run_astar
from app.algorithms.bfs import run_bfs
from app.algorithms.dfs import run_dfs
from app.algorithms.dijkstra import run_dijkstra
from app.models.algorithm import AlgorithmRequest, AlgorithmResponse, environment_from_grid

router = APIRouter(prefix="/algorithms", tags=["algorithms"])


def solve(payload: AlgorithmRequest, solver) -> AlgorithmResponse:
    """Build the environment once and pass it to the selected solver."""

    environment = environment_from_grid(payload.grid)
    return solver(environment)


@router.post("/astar", response_model=AlgorithmResponse)
def solve_with_astar(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with A* and return visualization events."""

    return solve(payload, run_astar)


@router.post("/bfs", response_model=AlgorithmResponse)
def solve_with_bfs(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with breadth-first search."""

    return solve(payload, run_bfs)


@router.post("/dfs", response_model=AlgorithmResponse)
def solve_with_dfs(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with depth-first search."""

    return solve(payload, run_dfs)


@router.post("/dijkstra", response_model=AlgorithmResponse)
def solve_with_dijkstra(payload: AlgorithmRequest) -> AlgorithmResponse:
    """Solve the submitted maze with Dijkstra's algorithm."""

    return solve(payload, run_dijkstra)
