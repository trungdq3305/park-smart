import { useEffect, useRef, useState, useCallback } from 'react'

type Message = any // bạn có thể định nghĩa type cụ thể tùy theo server trả về

export function useWebSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<Message | null>(null)

  const connect = useCallback(() => {
    if (socketRef.current) return

    const socket = new WebSocket(url)
    socketRef.current = socket

    socket.onopen = () => {
      console.log('✅ WebSocket connected:', url)
      setIsConnected(true)
      socket.send(JSON.stringify({ type: 'HELLO', payload: 'client ready' }))
    }

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        console.log('📩 Received:', data)
      } catch {
        console.log('📩 Raw message:', event.data)
      }
    }

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    socket.onclose = () => {
      console.log('🔌 WebSocket closed')
      setIsConnected(false)
      socketRef.current = null
      // 🔄 thử reconnect sau 3s
      setTimeout(connect, 3000)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      socketRef.current?.close()
    }
  }, [connect])

  const sendMessage = useCallback((message: Message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    } else {
      console.warn('⚠️ WebSocket not connected')
    }
  }, [])

  return { isConnected, lastMessage, sendMessage }
}
