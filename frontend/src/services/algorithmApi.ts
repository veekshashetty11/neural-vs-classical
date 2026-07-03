import type { AlgorithmName, AlgorithmRequest, AlgorithmResult } from '../types/maze'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function runAlgorithm(
  algorithm: AlgorithmName,
  payload: AlgorithmRequest,
): Promise<AlgorithmResult> {
  // Algorithm endpoints return all visualization events at once for Stage 2.
  // The frontend controls playback timing so backend execution stays fast and
  // deterministic before WebSockets enter the project.
  const response = await fetch(`${API_BASE_URL}/algorithms/${algorithm}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`${algorithm.toUpperCase()} failed with status ${response.status}`)
  }

  return response.json() as Promise<AlgorithmResult>
}
