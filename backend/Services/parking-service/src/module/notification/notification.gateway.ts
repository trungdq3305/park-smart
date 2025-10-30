import { UseGuards } from '@nestjs/common'
import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { NotificationSocketEvents } from 'src/common/constants/notification.constant'
import { WsAuthUser } from 'src/common/decorators/wsAuthUser.decorator'
import { WsJwtAuthGuard } from 'src/guard/wsJwtAuth.guard'

import { NotificationResponseDto } from './dto/notification.dto'

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage(NotificationSocketEvents.IDENTITY)
  handleIdentity(
    client: Socket,
    // Lấy ID và Role từ payload JWT đã được xác thực
    @WsAuthUser('id') userId: string,
    @WsAuthUser('role') userRole: string, // Giả sử trường 'role' có sẵn
  ): void {
    // 1. User join vào phòng riêng theo ID (để nhận thông báo cá nhân)
    void client.join(userId)
    // 2. User join vào phòng chung theo Role (để nhận thông báo chung của Driver/Operator/Admin)
    void client.join(userRole)

    console.log(`User ${userId} (${userRole}) joined rooms: ${userId}, ${userRole}`)
    client.emit('connected', { success: true, userId, role: userRole })
  }

  /**
   * Phương thức được gọi bởi Service để gửi thông báo real-time
   * @param recipientIdOrRole ID người dùng (hoặc Role) cần nhận thông báo
   * @param notification Thông báo đã được tạo (dạng DTO)
   */
  sendNotificationToUser(
    recipientIdOrRole: string,
    notification: NotificationResponseDto,
  ): void {
    this.server
      .to(recipientIdOrRole)
      .emit(NotificationSocketEvents.NEW_NOTIFICATION, notification)
  }
}