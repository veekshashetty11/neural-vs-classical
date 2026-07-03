import { useState } from 'react'

import { MazeGrid } from './components/MazeGrid'
import { generateMaze } from './services/mazeApi'
import type { MazeGenerateResponse } from './types/maze'

function App() {
  const [maze, setMaze] = useState<MazeGenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStartSimulation() {
    setIsLoading(true)
    setError(null)

    try {
      // Stage 1 starts with a 20x20 maze because it is large enough to show
      // structure while still fitting comfortably on laptops and tablets.
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
              Generate a maze environment now. Classical solvers, reinforcement learning agents, and live racing will plug into this same grid contract later.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={isLoading}
            className="w-full rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 sm:w-auto sm:text-base"
          >
            {isLoading ? 'Generating Maze...' : 'Start Simulation'}
          </button>
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
          </aside>

          <div className="flex min-h-[420px] items-center justify-center">
            {error ? (
              <div className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-100">
                {error}
              </div>
            ) : maze ? (
              <MazeGrid maze={maze} />
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
