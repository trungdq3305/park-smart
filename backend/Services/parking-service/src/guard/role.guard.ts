/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException, // Lỗi 403 khi không có quyền
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core' // Dùng để đọc metadata từ @Roles()
import { ROLES_KEY } from 'src/common/decorators/roles.decorator' // Import ROLES_KEY (từ file roles.decorator.ts)

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách các roles được yêu cầu cho route hiện tại từ @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    // Nếu không có role nào được yêu cầu cụ thể, cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    // 2. Lấy đối tượng user từ request (đã được AuthGuard gắn vào)
    const request = context.switchToHttp().getRequest()
    const user = request.user

    // this.logger.debug(`User object in RolesGuard: ${JSON.stringify(user)}`);
    // this.logger.debug(`Required roles for route: ${JSON.stringify(requiredRoles)}`);

    // 3. Kiểm tra và truy cập trực tiếp vào req.user.role
    // req.user.role giờ đây được mong đợi là một string hoặc một mảng các string
    if (!user || user.role === undefined || user.role === null) {
      this.logger.warn(
        'Thông tin vai trò người dùng (req.user.role) bị thiếu hoặc null.',
      )
      throw new ForbiddenException(
        'Thông tin vai trò người dùng không hợp lệ hoặc không tìm thấy.',
      )
    }

    const userRoleOrRoles = user.role // Đây là giá trị role cần kiểm tra

    let hasPermission = false

    if (typeof userRoleOrRoles === 'string') {
      // Trường hợp 1: req.user.role là một chuỗi string (ví dụ: "Customer")
      // this.logger.debug(`User role (string): ${userRoleOrRoles}`);
      hasPermission = requiredRoles.includes(userRoleOrRoles)
    } else if (
      Array.isArray(userRoleOrRoles) &&
      userRoleOrRoles.every((item) => typeof item === 'string')
    ) {
      // Trường hợp 2: req.user.role là một mảng các chuỗi string (ví dụ: ["Editor", "Viewer"])
      // this.logger.debug(`User roles (array): ${JSON.stringify(userRoleOrRoles)}`);
      hasPermission = requiredRoles.some((requiredRole) =>
        (userRoleOrRoles as string[]).includes(requiredRole),
      )
    } else {
      // Định dạng role không được hỗ trợ
      this.logger.warn(
        `Định dạng vai trò người dùng (req.user.role) không nhận dạng được: ${JSON.stringify(userRoleOrRoles)}`,
      )
      throw new ForbiddenException(
        'Định dạng vai trò người dùng không được hỗ trợ.',
      )
    }

    if (hasPermission) {
      // this.logger.debug('Quyền truy cập được chấp nhận.');
      return true // Người dùng có quyền
    }

    // this.logger.warn('Quyền truy cập bị từ chối. Người dùng không có vai trò được yêu cầu.');
    throw new ForbiddenException(
      'Bạn không có quyền truy cập tài nguyên này với vai trò hiện tại.',
    )
  }
}
