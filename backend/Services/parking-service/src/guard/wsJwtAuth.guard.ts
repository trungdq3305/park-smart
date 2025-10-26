import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt' 
import { WsException } from '@nestjs/websockets'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { Socket } from 'socket.io'
import { NotificationSocketEvents } from 'src/common/constants/notification.constant'

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  // JwtService phải được cung cấp qua NotificationModule
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>()
    const token = client.handshake.query.token as string

    if (!token) {
      client.emit(NotificationSocketEvents.AUTH_ERROR, 'Vui lòng cung cấp token xác thực.')
      client.disconnect(true)
      throw new WsException('Missing authorization token')
    }

    try {
      // Dùng .verify() với secret key bạn đã cấu hình trong JwtModule
      const payload = await this.jwtService.verify(token)

      // Gắn payload user vào client.data
      client.data.user = payload

      return true
    } catch (e) {
      let errorMessage: string

      if (e instanceof TokenExpiredError) {
        errorMessage = 'Token của bạn đã hết hạn. Vui lòng đăng nhập lại!'
      } else if (e instanceof JsonWebTokenError) {
        errorMessage = 'Token không hợp lệ hoặc đã bị thay đổi!'
      } else {
        errorMessage = 'Xác thực thất bại.'
      }

      // Gửi lỗi về client và ngắt kết nối
      client.emit(NotificationSocketEvents.AUTH_ERROR, errorMessage)
      client.disconnect(true)
      
      throw new WsException(errorMessage)
    }
  }
}