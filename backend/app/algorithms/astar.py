from __future__ import annotations

import heapq
from time import perf_counter

from app.algorithms.grid_environment import Cell, GridEnvironment
from app.models.algorithm import AlgorithmResponse


def manhattan_distance(cell: Cell, goal: Cell) -> int:
    """Estimate remaining cost using row/column distance on a grid."""

    return abs(cell[0] - goal[0]) + abs(cell[1] - goal[1])


def reconstruct_path(came_from: dict[Cell, Cell], current: Cell) -> list[Cell]:
    """Walk parent pointers from goal back to start, then return start-to-goal."""

    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path


def run_astar(environment: GridEnvironment) -> AlgorithmResponse:
    """Run A* search over the maze using a Manhattan-distance heuristic.

    A* ranks candidates by f(n) = g(n) + h(n), where g(n) is the exact cost
    already paid from the start and h(n) is the Manhattan estimate to the goal.
    Every move has cost 1 in this grid, so the first time the goal is popped from
    the priority queue we have the shortest path for this movement model.
    """

    started_at = perf_counter()
    start = environment.start
    goal = environment.goal

    if goal is None or not environment.is_valid_cell(start) or not environment.is_valid_cell(goal):
        return AlgorithmResponse(
            visited_order=[],
            path=[],
            nodes_explored=0,
            execution_ms=(perf_counter() - started_at) * 1000,
        )

    visited_order: list[Cell] = []
    came_from: dict[Cell, Cell] = {}
    best_cost: dict[Cell, int] = {start: 0}

    # The counter gives heap entries a stable tie-breaker when two cells have
    # the same f-score, avoiding direct tuple comparison surprises later.
    counter = 0
    open_set: list[tuple[int, int, Cell]] = [(manhattan_distance(start, goal), counter, start)]
    queued: set[Cell] = {start}
    explored: set[Cell] = set()

    while open_set:
        _, _, current = heapq.heappop(open_set)
        queued.discard(current)

        if current in explored:
            continue

        explored.add(current)
        visited_order.append(current)

        if current == goal:
            return AlgorithmResponse(
                visited_order=visited_order,
                path=reconstruct_path(came_from, current),
                nodes_explored=len(visited_order),
                execution_ms=(perf_counter() - started_at) * 1000,
            )

        for neighbor in environment.valid_neighbors(current):
            tentative_cost = best_cost[current] + 1
            if tentative_cost >= best_cost.get(neighbor, 10**9):
                continue

            came_from[neighbor] = current
            best_cost[neighbor] = tentative_cost
            priority = tentative_cost + manhattan_distance(neighbor, goal)
            counter += 1
            heapq.heappush(open_set, (priority, counter, neighbor))
            queued.add(neighbor)

    return AlgorithmResponse(
        visited_order=visited_order,
        path=[],
        nodes_explored=len(visited_order),
        execution_ms=(perf_counter() - started_at) * 1000,
    )
