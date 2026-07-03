import type { Coordinate, MazeGenerateResponse } from '../types/maze'

interface MazeGridProps {
  maze: MazeGenerateResponse
}

function sameCell(a: Coordinate, row: number, col: number) {
  return a[0] === row && a[1] === col
}

export function MazeGrid({ maze }: MazeGridProps) {
  const columnCount = maze.grid[0]?.length ?? 0

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-700 bg-slate-950/70 p-3 shadow-2xl shadow-black/30">
      {/* CSS grid lets the same component render 10x10, 20x20, and 30x30 mazes
          while preserving square cells and predictable alignment. */}
      <div
        className="mx-auto grid w-[min(86vw,680px)] gap-1"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        aria-label="Generated maze grid"
      >
        {maze.grid.map((rowCells, row) =>
          rowCells.map((cell, col) => {
            const isStart = sameCell(maze.start, row, col)
            const isGoal = sameCell(maze.goal, row, col)
            const isWall = cell === 1

            const cellClass = isStart
              ? 'bg-emerald-400 shadow-emerald-400/40'
              : isGoal
                ? 'bg-rose-500 shadow-rose-500/40'
                : isWall
                  ? 'bg-slate-500'
                  : 'bg-slate-900 hover:bg-slate-800'

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                className={`aspect-square rounded-[3px] shadow-sm transition ${cellClass}`}
                aria-label={`Cell ${row}, ${col}${isStart ? ', start' : isGoal ? ', goal' : isWall ? ', wall' : ', empty'}`}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
