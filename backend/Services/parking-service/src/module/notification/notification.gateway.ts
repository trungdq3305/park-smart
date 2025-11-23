import { UseGuards } from '@nestjs/common' // Giữ lại ExecutionContext
import {
  ConnectedSocket, // <-- THÊM DECORATOR NÀY
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
    // Lấy Socket trực tiếp bằng decorator của NestJS
    @ConnectedSocket() client: Socket, // Lấy ID và Role từ payload JWT đã được xác thực
    @WsAuthUser('id') userId: string,
    @WsAuthUser('role') userRole: string,
  ): void {
    // =======================================================
    // GẮN LOG CHI TIẾT ĐỂ XÁC NHẬN GIÁ TRỊ SAU XÁC THỰC
    console.log(
      `[WS IDENTITY] Receiving payload. ID: ${userId}, Role: ${userRole}`,
    )
    // =======================================================

    // Nếu decorator WsAuthUser gặp lỗi, các giá trị này có thể là undefined
    if (!userId || !userRole) {
      console.error(
        `[WS CRASH PREVENTED] Payload thiếu ID hoặc Role. ID: ${userId}, Role: ${userRole}`,
      )
      client.emit(
        NotificationSocketEvents.AUTH_ERROR,
        'Xác thực không đầy đủ (Thiếu ID/Role).',
      )
      client.disconnect(true)
      return
    }

    // Gán giá trị thành chuỗi để đảm bảo không bị lỗi type và tham gia phòng
    const userRoom = userId
    const roleRoom = userRole // 1. User join vào phòng riêng theo ID (để nhận thông báo cá nhân)

    void client.join(userRoom) // 2. User join vào phòng chung theo Role (để nhận thông báo chung của Driver/Operator/Admin)
    void client.join(roleRoom)

    console.log(
      `User ${userId} (${userRole}) joined rooms: ${userRoom}, ${roleRoom}`,
    ) // Gửi tín hiệu thành công về frontend
    client.emit('connected', { success: true, userId, role: userRole })
  } /**
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
