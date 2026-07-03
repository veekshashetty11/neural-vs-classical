from collections.abc import Callable

from app.algorithms.astar import run_astar
from app.algorithms.bfs import run_bfs
from app.algorithms.dfs import run_dfs
from app.algorithms.dijkstra import run_dijkstra
from app.algorithms.grid_environment import GridEnvironment
from app.models.algorithm import AlgorithmResponse

Solver = Callable[[GridEnvironment], AlgorithmResponse]

# One registry keeps REST and WebSocket execution aligned. Adding a future solver
# should only require adding it here and exposing the desired route/control.
SOLVERS: dict[str, Solver] = {
    "bfs": run_bfs,
    "dfs": run_dfs,
    "dijkstra": run_dijkstra,
    "astar": run_astar,
}


def get_solver(algorithm: str) -> Solver:
    """Return the solver function for a supported algorithm name."""

    try:
        return SOLVERS[algorithm]
    except KeyError as exc:
        supported = ", ".join(sorted(SOLVERS))
        raise ValueError(f"unsupported algorithm '{algorithm}'. Supported: {supported}") from exc
