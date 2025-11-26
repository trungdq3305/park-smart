/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

/**
 * Decorator dùng để lấy Raw JWT Token từ Header Authorization.
 * Tự động cắt bỏ chữ "Bearer " và trả về chuỗi token sạch.
 *
 * @example
 * async myApi(@UserToken() token: string) { ... }
 */
export const UserToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest()

    // Lấy header Authorization
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return undefined
    }

    // Kiểm tra định dạng "Bearer <token>"
    // Dùng split(' ') để tách ra thành mảng ['Bearer', 'eyJ...']
    const [type, token] = authHeader.split(' ')

    if (type === 'Bearer' && token) {
      return token
    }

    return undefined
  },
)
