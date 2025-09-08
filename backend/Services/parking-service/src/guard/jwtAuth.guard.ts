import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Override phương thức handleRequest để tùy chỉnh thông báo lỗi.
   * @param err Lỗi chung
   * @param user Thông tin user nếu xác thực thành công (từ hàm validate của JwtStrategy)
   * @param info Thông tin bổ sung, chứa lỗi cụ thể từ passport-jwt
   */
  handleRequest(err, user, info: Error) {
    // Bắt lỗi TokenExpiredError
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException(
        'Token của bạn đã hết hạn. Vui lòng đăng nhập lại!',
      )
    }

    // Bắt các lỗi JWT khác (sai chữ ký, token không hợp lệ...)
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã bị thay đổi!')
    }

    // Xử lý các lỗi khác hoặc trường hợp không có user
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Hành động không được phép. Vui lòng cung cấp token.',
        )
      )
    }

    // Nếu không có lỗi, trả về user
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user
  }
}
