/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

import { RoleEnum } from '../enum/role.enum'

/**
 * Custom decorator để lấy userId từ payload của JWT đã được xác thực.
 * Guard (ví dụ: JwtAuthGuard) phải chạy trước và gắn object `user` vào request.
 */
export const GetCurrenIdOfUserRole = createParamDecorator(
  (data: undefined, context: ExecutionContext): string => {
    // Chuyển context sang HTTP request
    const request = context.switchToHttp().getRequest()

    // Lấy object 'user' mà JwtAuthGuard đã gắn vào request
    const user = request.user

    // Trả về trường 'sub' (subject), nơi thường lưu ID người dùng trong JWT payload
    // Nếu bạn lưu ID trong một trường khác (ví dụ: 'id'), hãy thay 'sub' bằng 'id'
    if (user.role === RoleEnum.ADMIN) {
      return user.adminId
    }
    if (user.role === RoleEnum.DRIVER) {
      return user.driverId
    }
    if (user.role === RoleEnum.OPERATOR) {
      return user.operatorId
    }
    if (user.role === null || user.role === undefined) {
      return user.id
    }
    // Default return to satisfy all code paths
    return ''
  },
)
