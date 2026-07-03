export type MazeCellValue = 0 | 1

export type Coordinate = [number, number]

export interface MazeGenerateRequest {
  rows: 10 | 20 | 30
  cols: 10 | 20 | 30
  obstacle_density: number
}

export interface MazeGenerateResponse {
  grid: MazeCellValue[][]
  start: Coordinate
  goal: Coordinate
}

export interface AlgorithmRequest {
  grid: MazeCellValue[][]
}

export interface AlgorithmResult {
  visited_order: Coordinate[]
  path: Coordinate[]
  nodes_explored: number
  execution_ms: number
}
