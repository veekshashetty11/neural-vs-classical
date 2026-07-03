import type { AlgorithmName, MazeCellValue, SimulationEvent } from '../types/maze'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const MAX_RECONNECT_ATTEMPTS = 2

interface SimulationSocketOptions {
  algorithm: AlgorithmName
  grid: MazeCellValue[][]
  onEvent: (event: SimulationEvent) => void
  onOpen: () => void
  onReconnect: (attempt: number) => void
  onError: (message: string) => void
  onClose: () => void
}

export interface SimulationSocketControl {
  close: () => void
}

function websocketBaseUrl() {
  // Vite may point at either http:// or https:// for the API. WebSockets need
  // the matching ws:// or wss:// scheme before connecting to FastAPI.
  return API_BASE_URL.replace(/^http/, 'ws')
}

export function connectSimulationSocket(
  options: SimulationSocketOptions,
): SimulationSocketControl {
  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  let completed = false
  let closedByClient = false
  let reconnectTimer: number | null = null

  function closeSocket() {
    closedByClient = true
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
    }
    socket?.close()
  }

  function connect() {
    completed = false
    socket = new WebSocket(`${websocketBaseUrl()}/ws/simulation`)

    socket.addEventListener('open', () => {
      options.onOpen()
      socket?.send(JSON.stringify({ algorithm: options.algorithm, grid: options.grid }))
    })

    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(message.data) as SimulationEvent
        options.onEvent(event)
        if (event.event === 'complete') {
          completed = true
        }
      } catch {
        completed = true
        options.onError('Simulation stream sent an unreadable event.')
        socket?.close()
      }
    })

    socket.addEventListener('error', () => {
      options.onError('Simulation stream encountered a connection error.')
    })

    socket.addEventListener('close', () => {
      if (closedByClient || completed) {
        options.onClose()
        return
      }

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        options.onError('Simulation stream disconnected. Please run it again.')
        options.onClose()
        return
      }

      reconnectAttempts += 1
      options.onReconnect(reconnectAttempts)
      reconnectTimer = window.setTimeout(connect, reconnectAttempts * 500)
    })
  }

  connect()

  return { close: closeSocket }
}
