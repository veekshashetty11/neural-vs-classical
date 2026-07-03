from __future__ import annotations

from time import perf_counter

from app.algorithms.grid_environment import Cell, GridEnvironment
from app.algorithms.path_utils import reconstruct_path
from app.models.algorithm import AlgorithmResponse


def run_dfs(environment: GridEnvironment) -> AlgorithmResponse:
    """Run depth-first search and return exploration events.

    DFS dives down one branch before backtracking. It is useful for comparison
    because it is simple and fast, but it does not guarantee a shortest path.
    """

    started_at = perf_counter()
    start = environment.start
    goal = environment.goal

    if goal is None or not environment.is_valid_cell(start) or not environment.is_valid_cell(goal):
        return AlgorithmResponse(visited_order=[], path=[], nodes_explored=0, execution_ms=0)

    stack: list[Cell] = [start]
    seen: set[Cell] = {start}
    came_from: dict[Cell, Cell] = {}
    visited_order: list[Cell] = []

    while stack:
        current = stack.pop()
        visited_order.append(current)

        if current == goal:
            return AlgorithmResponse(
                visited_order=visited_order,
                path=reconstruct_path(came_from, current),
                nodes_explored=len(visited_order),
                execution_ms=(perf_counter() - started_at) * 1000,
            )

        # Reverse the neighbor order so the visual traversal remains close to the
        # grid_environment order after stack LIFO behavior is applied.
        for neighbor in reversed(environment.valid_neighbors(current)):
            if neighbor in seen:
                continue
            seen.add(neighbor)
            came_from[neighbor] = current
            stack.append(neighbor)

    return AlgorithmResponse(
        visited_order=visited_order,
        path=[],
        nodes_explored=len(visited_order),
        execution_ms=(perf_counter() - started_at) * 1000,
    )
