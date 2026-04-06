'use client'

import { useEffect, useRef, useCallback } from 'react'
import { connectSSE, SSEConnection, SSEEventHandler } from '@/lib/sse'

interface UseSSEOptions {
  path: string
  token: string
  body: unknown
  onEvent: SSEEventHandler
  onError?: (error: Error) => void
  onClose?: () => void
  enabled?: boolean
}

export function useSSE({
  path,
  token,
  body,
  onEvent,
  onError,
  onClose,
  enabled = true,
}: UseSSEOptions) {
  const connectionRef = useRef<SSEConnection | null>(null)
  const onEventRef = useRef(onEvent)
  const onErrorRef = useRef(onError)
  const onCloseRef = useRef(onClose)

  onEventRef.current = onEvent
  onErrorRef.current = onError
  onCloseRef.current = onClose

  const connect = useCallback(() => {
    connectionRef.current?.close()
    connectionRef.current = connectSSE(
      path,
      token,
      body,
      (eventType, data) => onEventRef.current(eventType, data),
      (err) => onErrorRef.current?.(err),
      () => onCloseRef.current?.()
    )
  }, [path, token, body])

  const disconnect = useCallback(() => {
    connectionRef.current?.close()
    connectionRef.current = null
  }, [])

  useEffect(() => {
    if (enabled && token) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return { connect, disconnect }
}
