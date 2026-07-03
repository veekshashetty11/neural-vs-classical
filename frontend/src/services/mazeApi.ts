import type { MazeGenerateRequest, MazeGenerateResponse } from '../types/maze'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function generateMaze(
  payload: MazeGenerateRequest,
): Promise<MazeGenerateResponse> {
  // The service layer keeps fetch details out of UI components, which will be
  // useful once WebSocket simulation events join the REST setup endpoints.
  const response = await fetch(`${API_BASE_URL}/maze/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Maze generation failed with status ${response.status}`)
  }

  return response.json() as Promise<MazeGenerateResponse>
}
