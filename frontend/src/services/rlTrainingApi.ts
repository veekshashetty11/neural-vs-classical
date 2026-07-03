import type {
  QLearningTrainingRequest,
  QLearningTrainingResponse,
  RLTrainingEvent,
} from '../types/maze'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const MAX_RECONNECT_ATTEMPTS = 2

interface RLTrainingSocketOptions {
  websocketUrl: string
  onEvent: (event: RLTrainingEvent) => void
  onOpen: () => void
  onReconnect: (attempt: number) => void
  onError: (message: string) => void
  onClose: () => void
}

export interface RLTrainingSocketControl {
  close: () => void
}

function websocketBaseUrl() {
  return API_BASE_URL.replace(/^http/, 'ws')
}

export async function startQLearningTraining(
  payload: QLearningTrainingRequest,
): Promise<QLearningTrainingResponse> {
  const response = await fetch(`${API_BASE_URL}/rl/train/qlearning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Q-learning training failed with status ${response.status}`)
  }

  return response.json() as Promise<QLearningTrainingResponse>
}

export function connectRLTrainingSocket(
  options: RLTrainingSocketOptions,
): RLTrainingSocketControl {
  let socket: WebSocket | null = null
  let completed = false
  let closedByClient = false
  let reconnectAttempts = 0
  let reconnectTimer: number | null = null

  function close() {
    closedByClient = true
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
    }
    socket?.close()
  }

  function connect() {
    completed = false
    socket = new WebSocket(`${websocketBaseUrl()}${options.websocketUrl}`)

    socket.addEventListener('open', options.onOpen)

    socket.addEventListener('message', (message) => {
      try {
        const event = JSON.parse(message.data) as RLTrainingEvent
        options.onEvent(event)
        if (event.event === 'training_complete') {
          completed = true
        }
      } catch {
        completed = true
        options.onError('Training stream sent an unreadable event.')
        socket?.close()
      }
    })

    socket.addEventListener('error', () => {
      options.onError('Training stream encountered a connection error.')
    })

    socket.addEventListener('close', () => {
      if (closedByClient || completed) {
        options.onClose()
        return
      }

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        options.onError('Training stream disconnected. Please start training again.')
        options.onClose()
        return
      }

      reconnectAttempts += 1
      options.onReconnect(reconnectAttempts)
      reconnectTimer = window.setTimeout(connect, reconnectAttempts * 500)
    })
  }

  connect()

  return { close }
}
