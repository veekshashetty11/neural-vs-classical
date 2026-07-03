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
  | { event: 'complete' }
  | { event: 'error'; message: string }

export type RLAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface QLearningTrainingRequest extends AlgorithmRequest {
  episodes: number
  learning_rate: number
  discount_factor: number
  epsilon: number
  epsilon_decay: number
  min_epsilon: number
}

export interface QLearningTrainingResponse {
  training_id: string
  websocket_url: string
}

export interface TrainingEpisodePoint {
  episode: number
  steps: number
  reward: number
}

export type QValues = Record<RLAction, number>

export type RLTrainingEvent =
  | { event: 'episode_start'; episode: number }
  | { event: 'agent_move'; position: Coordinate }
  | { event: 'q_values'; state: Coordinate; values: QValues }
  | { event: 'episode_complete'; episode: number; steps: number; reward: number }
  | { event: 'training_complete' }
  | { event: 'error'; message: string }
