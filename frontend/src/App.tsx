import { useEffect, useMemo, useRef, useState } from 'react'

import { MazeGrid, cellKey } from './components/MazeGrid'
import { runAstar } from './services/algorithmApi'
import { generateMaze } from './services/mazeApi'
import type { AlgorithmResult, Coordinate, MazeGenerateResponse } from './types/maze'

const ANIMATION_STEP_MS = 100

function App() {
  const [maze, setMaze] = useState<MazeGenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningAlgorithm, setIsRunningAlgorithm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [algorithmResult, setAlgorithmResult] = useState<AlgorithmResult | null>(null)
  const [animatedVisited, setAnimatedVisited] = useState<Coordinate[]>([])
  const [animatedPath, setAnimatedPath] = useState<Coordinate[]>([])
  const animationTimers = useRef<number[]>([])

  const visitedCells = useMemo(
    () => new Set(animatedVisited.map(([row, col]) => cellKey(row, col))),
    [animatedVisited],
  )
  const pathCells = useMemo(
    () => new Set(animatedPath.map(([row, col]) => cellKey(row, col))),
    [animatedPath],
  )

  useEffect(() => {
    return () => clearAnimationTimers()
  }, [])

  function clearAnimationTimers() {
    for (const timer of animationTimers.current) {
      window.clearTimeout(timer)
    }
    animationTimers.current = []
  }

  function resetVisualization() {
    clearAnimationTimers()
    setAlgorithmResult(null)
    setAnimatedVisited([])
    setAnimatedPath([])
  }

  function playAlgorithmAnimation(result: AlgorithmResult) {
    clearAnimationTimers()
    setAnimatedVisited([])
    setAnimatedPath([])

    result.visited_order.forEach((cell, index) => {
      const timer = window.setTimeout(() => {
        setAnimatedVisited((current) => [...current, cell])
      }, index * ANIMATION_STEP_MS)
      animationTimers.current.push(timer)
    })

    // The final path starts only after exploration completes, making the two
    // phases legible: blue search frontier first, yellow solution second.
    const pathStartDelay = result.visited_order.length * ANIMATION_STEP_MS
    result.path.forEach((cell, index) => {
      const timer = window.setTimeout(() => {
        setAnimatedPath((current) => [...current, cell])
      }, pathStartDelay + index * ANIMATION_STEP_MS)
      animationTimers.current.push(timer)
    })
  }

  async function handleStartSimulation() {
    setIsLoading(true)
    setError(null)
    resetVisualization()

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

  async function handleRunAstar() {
    if (!maze) {
      setError('Generate a maze before running A*.')
      return
    }

    setIsRunningAlgorithm(true)
    setError(null)
    resetVisualization()

    try {
      const result = await runAstar({ grid: maze.grid })
      setAlgorithmResult(result)
      playAlgorithmAnimation(result)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Unable to run A* right now.',
      )
    } finally {
      setIsRunningAlgorithm(false)
    }
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
              Generate a maze, then watch A* explore the grid and trace the final path with a timed visualization.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
              onClick={handleRunAstar}
              disabled={!maze || isLoading || isRunningAlgorithm}
              className="rounded-lg border border-yellow-300/50 bg-yellow-300/10 px-6 py-3 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/20 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 sm:text-base"
            >
              {isRunningAlgorithm ? 'Running A*...' : 'Run A*'}
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
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

            <h2 className="mt-8 text-lg font-semibold text-white">A* Metrics</h2>
            <dl className="mt-5 space-y-4 text-sm text-slate-300">
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
