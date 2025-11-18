import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/components/auth-provider'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(endpoint: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user } = useAuth()

  const connect = useCallback(() => {
    if (!user) return

    const token = localStorage.getItem('invpro_token')
    if (!token) return

    // Construct WebSocket URL
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000'
    const wsUrl = `${wsProtocol}//${wsHost}/ws/${endpoint}/?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log(`WebSocket connected: ${endpoint}`)
        setIsConnected(true)
        setReconnectAttempts(0)
        if (onConnect) onConnect()

        // Send initial ping
        ws.send(JSON.stringify({ type: 'ping' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (onMessage) onMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        if (onError) onError(error)
      }

      ws.onclose = () => {
        console.log(`WebSocket disconnected: ${endpoint}`)
        setIsConnected(false)
        if (onDisconnect) onDisconnect()

        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`)
            setReconnectAttempts((prev) => prev + 1)
            connect()
          }, reconnectInterval)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }, [endpoint, user, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    sendMessage,
    reconnect: connect,
    disconnect,
  }
}

// Specialized hook for notifications
export function useNotificationWebSocket() {
  const [notifications, setNotifications] = useState<any[]>([])

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification') {
      setNotifications((prev) => [message.notification, ...prev])
    }
  }, [])

  const { isConnected, sendMessage } = useWebSocket('notifications', {
    onMessage: handleMessage,
  })

  const markAsRead = useCallback(
    (notificationId: string | number) => {
      sendMessage({
        type: 'mark_read',
        notification_id: notificationId,
      })
    },
    [sendMessage]
  )

  return {
    notifications,
    isConnected,
    markAsRead,
  }
}

// Specialized hook for dashboard updates
export function useDashboardWebSocket() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [stockAlerts, setStockAlerts] = useState<any[]>([])

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'dashboard_update') {
      setDashboardData(message.data)
    } else if (message.type === 'stock_alert') {
      setStockAlerts((prev) => [message.product, ...prev])
    }
  }, [])

  const { isConnected, sendMessage } = useWebSocket('dashboard', {
    onMessage: handleMessage,
  })

  const requestUpdate = useCallback(() => {
    sendMessage({ type: 'request_update' })
  }, [sendMessage])

  return {
    dashboardData,
    stockAlerts,
    isConnected,
    requestUpdate,
  }
}

