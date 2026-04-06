import { API_BASE } from './api'

export type SSEEventHandler = (eventType: string, data: unknown) => void

export interface SSEConnection {
  close: () => void
}

export function connectSSE(
  path: string,
  token: string,
  body: unknown,
  onEvent: SSEEventHandler,
  onError?: (error: Error) => void,
  onClose?: () => void
): SSEConnection {
  let closed = false
  let controller: AbortController | null = new AbortController()

  async function run() {
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller?.signal,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Stream error' }))
        throw new Error(errorData.detail?.message || errorData.detail || `HTTP ${res.status}`)
      }

      if (!res.body) {
        throw new Error('No response body')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      let currentEvent = 'message'
      let currentData = ''

      const processLines = (lines: string[]) => {
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6).trim()
          } else if (line === '' && currentData) {
            try {
              const parsed = JSON.parse(currentData)
              onEvent(currentEvent, parsed)
            } catch {
              onEvent(currentEvent, currentData)
            }
            currentEvent = 'message'
            currentData = ''
          }
        }
      }

      while (!closed) {
        const { done, value } = await reader.read()

        if (done) {
          // Flush remaining buffer when stream ends
          if (buffer) {
            buffer += '\n'
            const lines = buffer.split('\n')
            buffer = ''
            processLines(lines)
          }
          // If there's still a pending event with data, dispatch it
          if (currentData) {
            try {
              const parsed = JSON.parse(currentData)
              onEvent(currentEvent, parsed)
            } catch {
              onEvent(currentEvent, currentData)
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        processLines(lines)
      }

      onClose?.()
    } catch (err) {
      if (!closed) {
        onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }

  run()

  return {
    close() {
      closed = true
      controller?.abort()
      controller = null
    },
  }
}
