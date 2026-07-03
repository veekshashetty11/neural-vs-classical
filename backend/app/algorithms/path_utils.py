from app.algorithms.grid_environment import Cell


def reconstruct_path(came_from: dict[Cell, Cell], current: Cell) -> list[Cell]:
    """Walk parent pointers from a goal cell back to the start cell."""

    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path
