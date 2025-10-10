import { Injectable } from '@nestjs/common'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import { ParkingSpaceUpdateRealTimeDto } from './dto/parkingSpace.dto'

@Injectable() // Quan trọng: Để có thể inject vào Service
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  pingInterval: 10000, // Gửi một gói tin ping mỗi 10 giây
  pingTimeout: 15000, // Nếu không nhận được phản hồi pong trong 15 giây, coi như mất kết nối
})
export class ParkingSpaceGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server // Biến server để có thể phát sóng event

  // 1. Quản lý kết nối
  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`)
  }

  // 2. Xử lý sự kiện từ Client
  @SubscribeMessage('join-room-parking-space')
  async handleJoinRoom(
    client: Socket,
    payload: { newRoom: string; oldRoom?: string },
  ) {
    // Nếu có room cũ, hãy rời khỏi nó trước
    if (payload.oldRoom) {
      await client.leave(payload.oldRoom)
    }
    // Tham gia vào room mới
    await client.join(payload.newRoom)
  }

  @SubscribeMessage('leave-room-parking-space')
  async handleLeaveRoom(client: Socket, roomName: string) {
    await client.leave(roomName)
  }

  // 3. Các phương thức để Service gọi (để phát sóng)

  /**
   * Gửi cập nhật số chỗ trống đến một khu vực cụ thể.
   */
  sendsParkingSpaceUpdate(
    roomName: string,
    payload: ParkingSpaceUpdateRealTimeDto,
  ) {
    console.log(payload)
    this.server.to(roomName).emit('parking-space-updated', payload)
  }
}
