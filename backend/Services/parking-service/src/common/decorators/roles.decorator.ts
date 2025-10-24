import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'role'

/**
 * Decorator để gán vai trò (roles) cho các route handler trong NestJS.
 * Sử dụng cùng với RolesGuard để kiểm tra quyền truy cập dựa trên vai trò người dùng.
 *
 * @param roles - Mảng các vai trò được phép truy cập route handler.
 *
 * Ví dụ sử dụng:
 *
 * ```typescript
 * @Roles(RoleEnum.ADMIN, RoleEnum.USER)
 * @Get('protected-route')
 * getProtectedData() {
 *   // Chỉ ADMIN và USER mới có thể truy cập route này
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles)
