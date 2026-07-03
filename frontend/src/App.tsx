import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { MazeGrid, cellKey } from './components/MazeGrid'
import { generateMaze } from './services/mazeApi'
import {
  connectRLTrainingSocket,
  startQLearningTraining,
  type RLTrainingSocketControl,
} from './services/rlTrainingApi'
import { connectSimulationSocket, type SimulationSocketControl } from './services/simulationSocket'
import type {
  AlgorithmName,
  AlgorithmResult,
  AlgorithmRun,
  Coordinate,
  MazeGenerateResponse,
  QValues,
  RLTrainingEvent,
  SimulationEvent,
  TrainingEpisodePoint,
} from './types/maze'

const ALGORITHM_LABELS: Record<AlgorithmName, string> = {
  bfs: 'BFS',
  dfs: 'DFS',
  dijkstra: 'Dijkstra',
  astar: 'A*',
}

const ALGORITHM_OPTIONS: AlgorithmName[] = ['bfs', 'dfs', 'dijkstra', 'astar']
const EMPTY_Q_VALUES: QValues = { UP: 0, DOWN: 0, LEFT: 0, RIGHT: 0 }

type ActiveTab = 'simulation' | 'learning'

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulation')
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
  const [episodes, setEpisodes] = useState(300)
  const [learningRate, setLearningRate] = useState(0.1)
  const [discountFactor, setDiscountFactor] = useState(0.9)
  const [epsilon, setEpsilon] = useState(0.3)
  const [isTrainingAgent, setIsTrainingAgent] = useState(false)
  const [trainingStatus, setTrainingStatus] = useState('Idle')
  const [currentEpisode, setCurrentEpisode] = useState(0)
  const [completedEpisodes, setCompletedEpisodes] = useState(0)
  const [currentReward, setCurrentReward] = useState<number | null>(null)
  const [agentPosition, setAgentPosition] = useState<Coordinate | null>(null)
  const [qValues, setQValues] = useState<QValues>(EMPTY_Q_VALUES)
  const [trainingHistory, setTrainingHistory] = useState<TrainingEpisodePoint[]>([])
  const streamControl = useRef<SimulationSocketControl | null>(null)
  const trainingControl = useRef<RLTrainingSocketControl | null>(null)
  const simulationStartedAt = useRef<number | null>(null)
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
    return () => {
      closeActiveStream()
      closeActiveTraining()
    }
  }, [])

  function closeActiveStream() {
    streamControl.current?.close()
    streamControl.current = null
    simulationStartedAt.current = null
  }

  function closeActiveTraining() {
    trainingControl.current?.close()
    trainingControl.current = null
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

  function resetTrainingPlayback() {
    closeActiveTraining()
    setCurrentEpisode(0)
    setCompletedEpisodes(0)
    setCurrentReward(null)
    setAgentPosition(maze?.start ?? null)
    setQValues(EMPTY_Q_VALUES)
    setTrainingHistory([])
    setTrainingStatus('Idle')
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
      nodes_explored: streamedVisited.current.length,
      execution_ms:
        simulationStartedAt.current === null ? 0 : performance.now() - simulationStartedAt.current,
    }

    setAlgorithmResult(completedResult)
    setComparisonRuns((current) => [
      { algorithm: selectedAlgorithm, ...completedResult },
      ...current.filter((run) => run.algorithm !== selectedAlgorithm),
    ])
    setIsRunningAlgorithm(false)
    setStreamStatus('Complete')
  }

  function handleTrainingEvent(event: RLTrainingEvent) {
    if (event.event === 'episode_start') {
      setCurrentEpisode(event.episode)
      setCurrentReward(null)
      setAgentPosition(maze?.start ?? null)
      return
    }

    if (event.event === 'agent_move') {
      setAgentPosition(event.position)
      return
    }

    if (event.event === 'q_values') {
      setQValues(event.values)
      return
    }

    if (event.event === 'episode_complete') {
      setCompletedEpisodes(event.episode)
      setCurrentReward(event.reward)
      setTrainingHistory((history) => [
        ...history,
        { episode: event.episode, steps: event.steps, reward: event.reward },
      ])
      return
    }

    if (event.event === 'error') {
      setError(event.message)
      setTrainingStatus('Error')
      setIsTrainingAgent(false)
      closeActiveTraining()
      return
    }

    setTrainingStatus('Complete')
    setIsTrainingAgent(false)
  }

  async function handleStartSimulation() {
    setIsLoading(true)
    setError(null)
    resetVisualization()
    resetTrainingPlayback()
    setComparisonRuns([])

    try {
      const nextMaze = await generateMaze({
        rows: 20,
        cols: 20,
        obstacle_density: 0.25,
      })
      setMaze(nextMaze)
      setAgentPosition(nextMaze.start)
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
        simulationStartedAt.current = performance.now()
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

  async function handleTrainAgent() {
    if (!maze) {
      setError('Generate a maze before training an agent.')
      return
    }

    resetTrainingPlayback()
    setIsTrainingAgent(true)
    setError(null)
    setTrainingStatus('Starting')

    try {
      const training = await startQLearningTraining({
        grid: maze.grid,
        episodes,
        learning_rate: learningRate,
        discount_factor: discountFactor,
        epsilon,
        epsilon_decay: 0.995,
        min_epsilon: 0.01,
      })

      trainingControl.current = connectRLTrainingSocket({
        websocketUrl: training.websocket_url,
        onOpen: () => {
          setTrainingStatus('Training')
        },
        onReconnect: (attempt) => {
          setTrainingStatus(`Reconnecting (${attempt})`)
        },
        onEvent: handleTrainingEvent,
        onError: (message) => {
          setError(message)
          setTrainingStatus('Error')
        },
        onClose: () => {
          trainingControl.current = null
          setIsTrainingAgent(false)
        },
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to start training.')
      setTrainingStatus('Error')
      setIsTrainingAgent(false)
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
              Compare classical search with a Q-learning agent that learns maze navigation from trial and error.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:w-auto">
            <div className="grid grid-cols-2 rounded-lg border border-slate-700 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setActiveTab('simulation')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === 'simulation' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Simulation
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('learning')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === 'learning' ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                Learning Lab
              </button>
            </div>

            <button
              type="button"
              onClick={handleStartSimulation}
              disabled={isLoading || isRunningAlgorithm || isTrainingAgent}
              className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 sm:text-base"
            >
              {isLoading ? 'Generating Maze...' : 'Generate Maze'}
            </button>
          </div>
        </header>

        {activeTab === 'simulation' ? renderSimulationTab() : renderLearningTab()}
      </section>
    </main>
  )

  function renderSimulationTab() {
    return (
      <section className="grid flex-1 gap-8 py-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Classical Solver</h2>
            <div className="mt-5 grid gap-3">
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
                onClick={handleRunAlgorithm}
                disabled={!maze || isLoading || isRunningAlgorithm}
                className="rounded-lg border border-yellow-300/50 bg-yellow-300/10 px-6 py-3 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/20 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 sm:text-base"
              >
                {isRunningAlgorithm ? `Running ${ALGORITHM_LABELS[selectedAlgorithm]}...` : 'Run Simulation'}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Current Metrics</h2>
            <dl className="mt-5 space-y-4 text-sm text-slate-300">
              <Metric label="Algorithm" value={ALGORITHM_LABELS[selectedAlgorithm]} />
              <Metric label="Stream" value={streamStatus} accent="text-cyan-200" />
              <Metric label="Nodes explored" value={algorithmResult?.nodes_explored ?? '-'} />
              <Metric label="Path length" value={algorithmResult?.path.length ?? '-'} />
              <Metric
                label="Execution time"
                value={algorithmResult ? `${algorithmResult.execution_ms.toFixed(2)} ms` : '-'}
              />
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

        <MazePanel />
      </section>
    )
  }

  function renderLearningTab() {
    return (
      <section className="grid flex-1 gap-8 py-8 lg:grid-cols-[320px_1fr] lg:items-start">
        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Q-Learning Controls</h2>
            <div className="mt-5 space-y-5">
              <label className="block text-sm font-medium text-slate-300">
                Episodes
                <input
                  type="number"
                  min={1}
                  max={2000}
                  value={episodes}
                  onChange={(event) => setEpisodes(Number(event.target.value))}
                  disabled={isTrainingAgent}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 disabled:text-slate-500"
                />
              </label>
              <RangeControl
                label="Learning rate"
                value={learningRate}
                min={0.01}
                max={1}
                step={0.01}
                disabled={isTrainingAgent}
                onChange={setLearningRate}
              />
              <RangeControl
                label="Gamma"
                value={discountFactor}
                min={0}
                max={1}
                step={0.01}
                disabled={isTrainingAgent}
                onChange={setDiscountFactor}
              />
              <RangeControl
                label="Epsilon"
                value={epsilon}
                min={0}
                max={1}
                step={0.01}
                disabled={isTrainingAgent}
                onChange={setEpsilon}
              />
              <button
                type="button"
                onClick={handleTrainAgent}
                disabled={!maze || isLoading || isTrainingAgent}
                className="w-full rounded-lg border border-fuchsia-300/50 bg-fuchsia-300/10 px-6 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:ring-offset-2 focus:ring-offset-[#05070b] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 sm:text-base"
              >
                {isTrainingAgent ? 'Training Agent...' : 'Train Agent'}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Training Metrics</h2>
            <dl className="mt-5 space-y-4 text-sm text-slate-300">
              <Metric label="Status" value={trainingStatus} accent="text-cyan-200" />
              <Metric label="Current episode" value={currentEpisode || '-'} />
              <Metric label="Current reward" value={currentReward ?? '-'} />
              <Metric label="Episodes completed" value={`${completedEpisodes} / ${episodes}`} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Live Q-Values</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              {Object.entries(qValues).map(([action, value]) => (
                <div key={action} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <div className="font-semibold text-slate-300">{action}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{value.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <MazePanel agentCell={agentPosition} />

          <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Steps per Episode</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trainingHistory} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="episode" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#020617',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      color: '#e2e8f0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>
    )
  }

  function MazePanel({ agentCell = null }: { agentCell?: Coordinate | null }) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        {error ? (
          <div className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 p-6 text-center text-rose-100">
            {error}
          </div>
        ) : maze ? (
          <MazeGrid
            maze={maze}
            agentCell={agentCell}
            pathCells={pathCells}
            visitedCells={activeTab === 'simulation' ? visitedCells : new Set()}
          />
        ) : (
          <div className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-10 text-center text-slate-300">
            Generate a maze to begin.
          </div>
        )}
      </div>
    )
  }
}

function Metric({
  label,
  value,
  accent = 'text-slate-100',
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt>{label}</dt>
      <dd className={`font-medium ${accent}`}>{value}</dd>
    </div>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-semibold text-slate-100">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-cyan-300 disabled:cursor-not-allowed"
      />
    </label>
  )
}

export default App
