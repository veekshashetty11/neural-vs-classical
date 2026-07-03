from __future__ import annotations

from collections import deque
from time import perf_counter

from app.algorithms.grid_environment import Cell, GridEnvironment
from app.algorithms.path_utils import reconstruct_path
from app.models.algorithm import AlgorithmResponse


def run_bfs(environment: GridEnvironment) -> AlgorithmResponse:
    """Run breadth-first search and return exploration events.

    BFS explores the grid in rings around the start. Because every move has the
    same cost, the first discovered goal path is guaranteed to be shortest.
    """

    started_at = perf_counter()
    start = environment.start
    goal = environment.goal

    if goal is None or not environment.is_valid_cell(start) or not environment.is_valid_cell(goal):
        return AlgorithmResponse(visited_order=[], path=[], nodes_explored=0, execution_ms=0)

    queue: deque[Cell] = deque([start])
    seen: set[Cell] = {start}
    came_from: dict[Cell, Cell] = {}
    visited_order: list[Cell] = []

    while queue:
        current = queue.popleft()
        visited_order.append(current)

        if current == goal:
            return AlgorithmResponse(
                visited_order=visited_order,
                path=reconstruct_path(came_from, current),
                nodes_explored=len(visited_order),
                execution_ms=(perf_counter() - started_at) * 1000,
            )

        for neighbor in environment.valid_neighbors(current):
            if neighbor in seen:
                continue
            seen.add(neighbor)
            came_from[neighbor] = current
            queue.append(neighbor)

    return AlgorithmResponse(
        visited_order=visited_order,
        path=[],
        nodes_explored=len(visited_order),
        execution_ms=(perf_counter() - started_at) * 1000,
    )
