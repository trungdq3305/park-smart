import React, { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const Map = () => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  // ✨ BƯỚC 1: Thêm state mới
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    if (socketRef.current === null) {
      const newSocket = io('wss://parksmarthcmc.io.vn/', {
        path: '/parking/notifications/socket.io',
        transports: ['websocket'],
      })

      socketRef.current = newSocket

      newSocket.on('connect', () => {
        console.log('✅ WebSocket Connected! Socket ID:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket Disconnected! Reason:', reason)
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket Connection Error:', error.message)
      })

      // ✨ BƯỚC 2: Thêm trình lắng nghe sự kiện từ server
      newSocket.on('parking-lot-spots-updated', (data) => {
        console.log('📬 Received spots update:', data)
        setLastMessage({ event: 'parking-lot-spots-updated', payload: data })
      })

      newSocket.on('new-parking-lot-added', (data) => {
        console.log('📬 Received new parking lot:', data)
        setLastMessage({ event: 'new-parking-lot-added', payload: data })
      })
    }

    return () => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('Dọn dẹp và ngắt kết nối socket...')
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isConnected && socketRef.current) {
      const roomName = 'room_w3gvw8b'
      socketRef.current.emit('join-room', { newRoom: roomName })
      console.log('Đã gửi yêu cầu tham gia room:', roomName)
    }
  }, [isConnected])

  return (
    <div style={{ padding: '100px' }}>
      <p>
        Trạng thái kết nối:{' '}
        {isConnected ? (
          <span style={{ color: 'green' }}>Đã kết nối</span>
        ) : (
          <span style={{ color: 'red' }}>Đang chờ...</span>
        )}
      </p>

      {/* ✨ BƯỚC 3: Hiển thị dữ liệu nhận được */}
      {lastMessage && (
        <div
          style={{
            marginTop: '20px',
            border: '1px solid #ccc',
            padding: '10px',
            background: '#f9f9f9',
            borderRadius: '5px',
          }}
        >
          <p>
            <strong>Tin nhắn cuối cùng nhận được:</strong>
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(lastMessage, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default Map
