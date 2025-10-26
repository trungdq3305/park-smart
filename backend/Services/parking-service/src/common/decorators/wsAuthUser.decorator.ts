import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common'
import type { Socket } from 'socket.io'

/**
 * Custom decorator để lấy thông tin user (payload JWT) từ đối tượng request của WebSocket
 * Cách dùng: @WsAuthUser('id') userId: string | @WsAuthUser() userPayload: object
 */
export const WsAuthUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const client = ctx.switchToWs().getClient<Socket>()
    // user được đính kèm vào client.data bởi WsJwtAuthGuard
    const user = client.data.user 

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return data ? user?.[data] : user
  },
)