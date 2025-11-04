import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { WsException } from '@nestjs/websockets'
import * as cookie from 'cookie'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { Socket } from 'socket.io'
import { NotificationSocketEvents } from 'src/common/constants/notification.constant'

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>() // 1. Cố gắng đọc token từ query string (Cách truyền từ frontend hiện tại)

    let token = client.handshake.query.token as string | undefined // 2. Nếu không có trong query, Cố gắng đọc token từ Cookie Header (cho HttpOnly)
    if (!token && client.handshake.headers.cookie) {
      const parsedCookies = cookie.parse(client.handshake.headers.cookie) // Thay 'userToken' bằng tên cookie chứa JWT của bạn
      token = parsedCookies.userToken
    }
    if (!token) {
      client.emit(
        NotificationSocketEvents.AUTH_ERROR,
        'Vui lòng cung cấp token xác thực.',
      )
      client.disconnect(true)
      throw new WsException('Missing authorization token')
    }

    let secret: string | undefined // Khai báo secret ở phạm vi ngoài try/catch

    console.log(
      `[WS Guard] Attempting to verify token: ${token.substring(0, 30)}...`,
    )
    try {
      // SỬA LỖI: Lấy Secret Key bằng tên biến môi trường
      secret = this.configService.get<string>('JWT_SECRET')
      if (!secret) {
        console.error('FATAL: JWT_SECRET is not configured.')
        throw new Error('JWT_SECRET is missing')
      } // Dùng .verify() với secret key bạn đã cấu hình trong JwtModule
      const payload = await this.jwtService.verify(token, {
        secret: secret, // <-- Đã được xác định giá trị
      }) // Gắn payload user vào client.data

      client.data.user = payload
      console.log('[WS Guard] Verification SUCCESS.')
      return true
    } catch (e) {
      // =======================================================
      // LOG CHI TIẾT
      console.error('================================================')
      console.error('[WS Guard] Verification FAILED!')
      console.error(
        '[WS Guard] Secret used (length):',
        secret ? secret.length : 'MISSING',
      )
      console.error('[WS Guard] Error details:', e)
      console.error('================================================') // =======================================================
      let errorMessage: string
      const errorName = (e as Error).name

      if (errorName === 'TokenExpiredError') {
        errorMessage = 'Token của bạn đã hết hạn. Vui lòng đăng nhập lại!'
      } else if (errorName === 'JsonWebTokenError') {
        errorMessage = 'Token không hợp lệ hoặc đã bị thay đổi!'
      } else {
        errorMessage = 'Xác thực thất bại.'
      }

      client.emit(NotificationSocketEvents.AUTH_ERROR, errorMessage)
      client.disconnect(true)
      throw new WsException(errorMessage)
    }
  }
}
