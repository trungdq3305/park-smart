import React, { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

const Map = () => {
  // 1. Dùng useState để lưu trữ socket instance và trạng thái kết nối
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // 2. Dùng useEffect để kết nối và dọn dẹp khi component unmount
  useEffect(() => {
    // Kết nối đến Ocelot Gateway

    const newSocket = io('wss://parksmarthcmc.io.vn', {
      path: '/notifications/socket.io',
      transports: ['websocket'],
    })

    // Lưu socket instance vào state
    setSocket(newSocket)

    // Lắng nghe sự kiện kết nối thành công
    newSocket.on('connect', () => {
      console.log('✅ WebSocket Connected!')
      setIsConnected(true)
    })

    // Lắng nghe sự kiện mất kết nối
    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket Disconnected!')
      setIsConnected(false)
    })

    // Quan trọng: Dọn dẹp (cleanup) khi component bị unmount
    return () => {
      newSocket.disconnect()
    }
  }, []) // Mảng rỗng [] đảm bảo useEffect này chỉ chạy 1 lần duy nhất

  // 3. Dùng một useEffect khác để tham gia room sau khi đã kết nối thành công
  useEffect(() => {
    // Chỉ thực hiện khi đã kết nối và có socket instance
    if (isConnected && socket) {
      const roomName = 'room_w3gvw8b' // Tên room của bạn

      // Gửi sự kiện 'join-room'
      socket.emit('join-room', {
        newRoom: roomName,
      })

      console.log('Đã gửi yêu cầu tham gia room:', roomName)
    }
  }, [isConnected, socket]) // Chạy lại khi isConnected hoặc socket thay đổi

  return (
    <div style={{ padding: '100px' }}>
      <p>Trạng thái kết nối: {isConnected ? 'Đã kết nối' : 'Đang chờ...'}</p>
      {/* Giao diện của bạn */}
    </div>
  )
}

export default Map
