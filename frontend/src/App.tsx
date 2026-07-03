function App() {
  return (
    <main className="min-h-screen bg-[#05070b] text-slate-100">
      {/* The first screen is the product surface, not a marketing page: it gives
          users a clear entry point for the simulation features that arrive next. */}
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
        <div className="mb-6 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
          Live Maze Learning & Racing Platform
        </div>

        <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
          AI vs Algorithms
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Watch classical pathfinding and reinforcement learning agents solve the same maze side-by-side with real-time visualization.
        </p>

        <button
          type="button"
          className="mt-10 rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#05070b] sm:text-base"
        >
          Start Simulation
        </button>
      </section>
    </main>
  )
}

export default App
