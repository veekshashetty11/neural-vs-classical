import { useEffect, useMemo, useRef, useState } from 'react'

import { MazeGrid, cellKey } from './components/MazeGrid'
import { generateMaze } from './services/mazeApi'
import { connectSimulationSocket, type SimulationSocketControl } from './services/simulationSocket'
import type {
  AlgorithmName,
  AlgorithmResult,
  AlgorithmRun,
  Coordinate,
  MazeGenerateResponse,
  SimulationEvent,
} from './types/maze'

const ALGORITHM_LABELS: Record<AlgorithmName, string> = {
  bfs: 'BFS',
  dfs: 'DFS',
  dijkstra: 'Dijkstra',
  astar: 'A*',
}

const ALGORITHM_OPTIONS: AlgorithmName[] = ['bfs', 'dfs', 'dijkstra', 'astar']

function App() {
  const [maze, setMaze] = useState<MazeGenerateResponse | null>(null)
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmName>('astar')
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningAlgorithm, setIsRunningAlgorithm] = useState(false)
  const [streamStatus, setStreamStatus] = useState('Idle')
  const [error, setError] = useState<string | null>(null)
  const [algorithmResult, setAlgorithmResult] = useState<AlgorithmResult | null>(null)
  const [comparisonRuns, setComparisonRuns] = useState<AlgorithmRun[]>([])
  const [animatedVisited, setAnimatedVisited] = useState<Coordinate[]>([])
  const [animatedPath, setAnimatedPath] = useState<Coordinate[]>([])
  const streamControl = useRef<SimulationSocketControl | null>(null)
  const streamedVisited = useRef<Coordinate[]>([])
  const streamedPath = useRef<Coordinate[]>([])

  const visitedCells = useMemo(
    () => new Set(animatedVisited.map(([row, col]) => cellKey(row, col))),
    [animatedVisited],
  )
  const pathCells = useMemo(
    () => new Set(animatedPath.map(([row, col]) => cellKey(row, col))),
    [animatedPath],
  )

  useEffect(() => {
    return () => closeActiveStream()
  }, [])

  function closeActiveStream() {
    streamControl.current?.close()
    streamControl.current = null
  }

  function resetVisualization() {
    closeActiveStream()
    streamedVisited.current = []
    streamedPath.current = []
    setAlgorithmResult(null)
    setAnimatedVisited([])
    setAnimatedPath([])
    setStreamStatus('Idle')
  }

  function resetStreamPlayback() {
    streamedVisited.current = []
    streamedPath.current = []
    setAlgorithmResult(null)
    setAnimatedVisited([])
    setAnimatedPath([])
  }

  function handleSimulationEvent(event: SimulationEvent) {
    if (event.event === 'visit') {
      streamedVisited.current = [...streamedVisited.current, event.cell]
      setAnimatedVisited(streamedVisited.current)
      setAlgorithmResult({
        visited_order: streamedVisited.current,
        path: streamedPath.current,
        nodes_explored: streamedVisited.current.length,
        execution_ms: 0,
      })
      return
    }

    if (event.event === 'path') {
      streamedPath.current = [...streamedPath.current, event.cell]
      setAnimatedPath(streamedPath.current)
      setAlgorithmResult({
        visited_order: streamedVisited.current,
        path: streamedPath.current,
        nodes_explored: streamedVisited.current.length,
        execution_ms: 0,
      })
      return
    }

    if (event.event === 'error') {
      setError(event.message)
      setIsRunningAlgorithm(false)
      setStreamStatus('Error')
      closeActiveStream()
      return
    }

    const completedResult: AlgorithmResult = {
      visited_order: streamedVisited.current,
      path: streamedPath.current,
      nodes_explored: event.nodes_explored ?? streamedVisited.current.length,
      execution_ms: event.execution_ms ?? 0,
    }

    setAlgorithmResult(completedResult)
    setComparisonRuns((current) => [
      { algorithm: selectedAlgorithm, ...completedResult },
      ...current.filter((run) => run.algorithm !== selectedAlgorithm),
    ])
    setIsRunningAlgorithm(false)
    setStreamStatus('Complete')
  }

  async function handleStartSimulation() {
    setIsLoading(true)
    setError(null)
    resetVisualization()
    setComparisonRuns([])

    try {
      const nextMaze = await generateMaze({
        rows: 20,
        cols: 20,
        obstacle_density: 0.25,
      })
      setMaze(nextMaze)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to generate a maze right now.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleRunAlgorithm() {
    if (!maze) {
      setError('Generate a maze before running an algorithm.')
      return
    }

    resetVisualization()
    setIsRunningAlgorithm(true)
    setError(null)
    setStreamStatus('Connecting')

    streamControl.current = connectSimulationSocket({
      algorithm: selectedAlgorithm,
      grid: maze.grid,
      onOpen: () => {
        setError(null)
        setStreamStatus('Streaming')
      },
      onReconnect: (attempt) => {
        resetStreamPlayback()
        setError(null)
        setStreamStatus(`Reconnecting (${attempt})`)
      },
      onEvent: handleSimulationEvent,
      onError: (message) => {
        setError(message)
        setStreamStatus('Error')
      },
      onClose: () => {
        streamControl.current = null
        setIsRunningAlgorithm(false)
      },
    })
  }

  return (
    <main className="min-h-screen bg-[#05070b] text-slate-100">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:py-14">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
              Live Maze Learning & Racing Platform
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
              AI vs Algorithms
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Generate a maze, choose a classical solver, and watch WebSocket events paint exploration and final path in real time.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[160px_auto_auto]">
            <select
              value={selectedAlgorithm}
              onChange={(event) => setSelectedAlgorithm(event.target.value as AlgorithmName)}
              disabled={isLoading || isRunningAlgorithm}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 disabled:cursor-not-allowed disabled:text-slate-500 sm:text-base"
              aria-label="Choose pathfinding algorithm"
            >
              {ALGORITHM_OPTIONS.map((algorithm) => (
                <option key={algorithm} value={algorithm}>
                  {ALGORITHM_LABELS[algorithm]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleStartSimulation}
              disabled={isLoading || isRunningAlgorithm}
              className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 sm:text-base"
            >
              {isLoading ? 'Generating Maze...' : 'Start Simulation'}
            </button>
            <button
              type="button"
              onClick={handleRunAlgorithm}
              disabled={!maze || isLoading || isRunningAlgorithm}
              className="rounded-lg border border-yellow-300/50 bg-yellow-300/10 px-6 py-3 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/20 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 sm:text-base"
            >
              {isRunningAlgorithm ? `Running ${ALGORITHM_LABELS[selectedAlgorithm]}...` : 'Run Simulation'}
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-8 lg:grid-cols-[320px_1fr] lg:items-start">
          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-lg font-semibold text-white">Maze Environment</h2>
              <dl className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <dt>Size</dt>
                  <dd className="font-medium text-slate-100">20 x 20</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Obstacle density</dt>
                  <dd className="font-medium text-slate-100">25%</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Start</dt>
                  <dd className="font-medium text-emerald-300">[0, 0]</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Goal</dt>
                  <dd className="font-medium text-rose-300">[19, 19]</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-lg font-semibold text-white">Current Metrics</h2>
              <dl className="mt-5 space-y-4 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <dt>Algorithm</dt>
                  <dd className="font-medium text-slate-100">{ALGORITHM_LABELS[selectedAlgorithm]}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Stream</dt>
                  <dd className="font-medium text-cyan-200">{streamStatus}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Nodes explored</dt>
                  <dd className="font-medium text-slate-100">
                    {algorithmResult?.nodes_explored ?? '-'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Path length</dt>
                  <dd className="font-medium text-slate-100">
                    {algorithmResult?.path.length ?? '-'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Execution time</dt>
                  <dd className="font-medium text-slate-100">
                    {algorithmResult ? `${algorithmResult.execution_ms.toFixed(2)} ms` : '-'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="text-lg font-semibold text-white">Comparison</h2>
              <div className="mt-5 space-y-3">
                {comparisonRuns.length > 0 ? (
                  comparisonRuns.map((run) => (
                    <div
                      key={run.algorithm}
                      className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3 font-semibold text-white">
                        <span>{ALGORITHM_LABELS[run.algorithm]}</span>
                        <span>{run.execution_ms.toFixed(2)} ms</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-slate-300">
                        <span>{run.nodes_explored} nodes</span>
                        <span>{run.path.length} path cells</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Run algorithms to compare their search behavior.</p>
                )}
              </div>
            </section>
          </aside>

          <div className="flex min-h-[420px] items-center justify-center">
            {error ? (
              <div className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-100">
                {error}
              </div>
            ) : maze ? (
              <MazeGrid maze={maze} pathCells={pathCells} visitedCells={visitedCells} />
            ) : (
              <div className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center text-slate-300">
                Press Start Simulation to generate the first maze.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
