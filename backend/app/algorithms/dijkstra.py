from __future__ import annotations

import heapq
from time import perf_counter

from app.algorithms.grid_environment import Cell, GridEnvironment
from app.algorithms.path_utils import reconstruct_path
from app.models.algorithm import AlgorithmResponse


def run_dijkstra(environment: GridEnvironment) -> AlgorithmResponse:
    """Run Dijkstra's algorithm on an unweighted grid.

    Each move has cost 1 today, but the priority-queue shape mirrors the version
    needed later for weighted terrain or penalties introduced by RL experiments.
    """

    started_at = perf_counter()
    start = environment.start
    goal = environment.goal

    if goal is None or not environment.is_valid_cell(start) or not environment.is_valid_cell(goal):
        return AlgorithmResponse(visited_order=[], path=[], nodes_explored=0, execution_ms=0)

    counter = 0
    priority_queue: list[tuple[int, int, Cell]] = [(0, counter, start)]
    best_cost: dict[Cell, int] = {start: 0}
    came_from: dict[Cell, Cell] = {}
    visited_order: list[Cell] = []
    explored: set[Cell] = set()

    while priority_queue:
        current_cost, _, current = heapq.heappop(priority_queue)

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
            next_cost = current_cost + 1
            if next_cost >= best_cost.get(neighbor, 10**9):
                continue

            best_cost[neighbor] = next_cost
            came_from[neighbor] = current
            counter += 1
            heapq.heappush(priority_queue, (next_cost, counter, neighbor))

    return AlgorithmResponse(
        visited_order=visited_order,
        path=[],
        nodes_explored=len(visited_order),
        execution_ms=(perf_counter() - started_at) * 1000,
    )
