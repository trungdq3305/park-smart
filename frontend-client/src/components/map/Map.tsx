import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

const Map = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  // <<< THAY ĐỔI 1: Tạo state mới để lưu dữ liệu nhận được >>>
  const [receivedData, setReceivedData] = useState<any[]>([])

  useEffect(() => {
    const newSocket = io('ws://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket'],
    })

    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('✅ WebSocket Connected!')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected!')
      setIsConnected(false)
    })

    // <<< THAY ĐỔI 2: Lắng nghe sự kiện nhận dữ liệu từ server >>>
    // !!! QUAN TRỌNG: Thay 'receive-data' bằng tên sự kiện thực tế của bạn
    newSocket.on('parking-lot-spots-updated', (data) => {
      console.log('✅ Dữ liệu nhận được:', data)
      // Thêm dữ liệu mới vào danh sách dữ liệu đã có
      setReceivedData((prevData) => [...prevData, data])
    })

    return () => {
      // Dọn dẹp listener khi component unmount
      newSocket.off('receive-data')
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (isConnected && socket) {
      const roomName = 'room_123456'
      socket.emit('join-room', {
        newRoom: roomName,
      })
      console.log('Đã gửi yêu cầu tham gia room:', roomName)
    }
  }, [isConnected, socket])

  return (
    <div style={{ padding: '100px' }}>
      <p>Trạng thái kết nối: {isConnected ? 'Đã kết nối' : 'Đang chờ...'}</p>

      {/* <<< THAY ĐỔI 3: Hiển thị dữ liệu đã nhận được >>> */}
      <div style={{ marginTop: '20px' }}>
        <h2>Dữ liệu nhận được từ Server:</h2>
        {/* Kiểm tra nếu không có dữ liệu */}
        {receivedData.length === 0 ? (
          <p>Chưa có dữ liệu mới.</p>
        ) : (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {receivedData.map((item, index) => (
              <li
                key={index}
                style={{
                  background: '#f0f0f0',
                  marginBottom: '10px',
                  padding: '10px',
                  borderRadius: '5px',
                }}
              >
                {/* Dùng JSON.stringify để hiển thị object một cách dễ đọc */}
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Map
