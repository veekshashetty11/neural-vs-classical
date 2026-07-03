export type MazeCellValue = 0 | 1

export type Coordinate = [number, number]

export type AlgorithmName = 'bfs' | 'dfs' | 'dijkstra' | 'astar'

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

export interface AlgorithmRun extends AlgorithmResult {
  algorithm: AlgorithmName
}

export type SimulationEvent =
  | { event: 'visit'; cell: Coordinate }
  | { event: 'path'; cell: Coordinate }
  | {
      event: 'complete'
      nodes_explored?: number
      path_length?: number
      execution_ms?: number
    }
  | { event: 'error'; message: string }
