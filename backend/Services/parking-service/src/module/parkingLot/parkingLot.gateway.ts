import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import {
  ParkingLotResponseDto,
  ParkingLotSpotsUpdateDto,
} from './dto/parkingLot.dto'
import { IParkingLotService } from './interfaces/iparkingLot.service'

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  pingInterval: 10000,
  pingTimeout: 15000,
})
export class ParkingLotGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private logger: Logger = new Logger('ParkingLotGateway')

  // --- MỚI: Map lưu trữ kết nối của Python Gateway (Thiết bị tại bãi xe) ---
  // Key: parkingId (ví dụ "PARKING_01"), Value: socketId
  private activePythonConnections = new Map<string, string>()
  constructor(
    @Inject(forwardRef(() => IParkingLotService))
    private readonly parkingLotService: IParkingLotService,
  ) {}
  
  // ==================================================================
  // 1. QUẢN LÝ KẾT NỐI (Merge cả Frontend & Python Device)
  // ==================================================================
  async handleConnection(client: Socket) {
    const auth = client.handshake.auth

    // A. TRƯỜNG HỢP 1: KẾT NỐI TỪ PYTHON GATEWAY (THIẾT BỊ)
    // Python Client sẽ gửi auth: { parkingId, secretKey }
    if (auth.parkingId && auth.secretKey) {
      const parkingId = auth.parkingId as string
      const secretKey = auth.secretKey as string

      // 👇 3. SỬ DỤNG HÀM CỦA BẠN TẠI ĐÂY
      // Thay thế đoạn code check cứng trước đó bằng đoạn này:
      const isValid = await this.parkingLotService.validateParkingKey(
        parkingId,
        secretKey,
      )

      if (!isValid) {
        this.logger.error(
          `⛔ Từ chối kết nối thiết bị ${parkingId}: Sai Secret Key hoặc ID không tồn tại`,
        )
        client.disconnect()
        return
      }

      // Nếu hợp lệ -> Lưu socket ID
      this.activePythonConnections.set(parkingId, client.id)
      this.logger.log(
        `🔌 DEVICE CONNECTED: Bãi xe ${parkingId} đã Online (Socket: ${client.id})`,
      )

      client.emit('connection_ack', {
        status: 'ok',
        message: 'Cloud accepted connection',
      })
      return
    }

    // B. TRƯỜNG HỢP 2: KẾT NỐI TỪ FRONTEND (NGƯỜI DÙNG)
    this.logger.log(`✅ USER CONNECTED: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    // 1. Kiểm tra xem có phải là Python Device bị mất kết nối không
    for (const [
      parkingId,
      socketId,
    ] of this.activePythonConnections.entries()) {
      if (socketId === client.id) {
        this.activePythonConnections.delete(parkingId)
        this.logger.warn(
          `⚠️ DEVICE DISCONNECTED: Bãi xe ${parkingId} đã Offline`,
        )
        return
      }
    }

    // 2. Nếu không phải Device thì là User bình thường
    this.logger.log(`❌ USER DISCONNECTED: ${client.id}`)
  }

  // ==================================================================
  // 2. LOGIC CHO FRONTEND (ROOMS & UPDATES) - GIỮ NGUYÊN CŨ
  // ==================================================================

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { newRoom: string; oldRoom?: string },
  ) {
    if (payload.oldRoom) {
      await client.leave(payload.oldRoom)
    }
    await client.join(payload.newRoom)
    // this.logger.debug(`Client ${client.id} joined room ${payload.newRoom}`);
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomName: string,
  ) {
    await client.leave(roomName)
  }

  /**
   * Gửi cập nhật số chỗ trống đến Frontend đang xem khu vực cụ thể.
   */
  sendSpotsUpdate(roomName: string, payload: ParkingLotSpotsUpdateDto) {
    // this.logger.debug(`Broadcasting spots update to room: ${roomName}`);
    this.server.to(roomName).emit('parking-lot-spots-updated', payload)
  }

  /**
   * Gửi thông tin về một bãi đỗ xe mới được thêm vào.
   */
  sendNewParkingLot(roomName: string, payload: ParkingLotResponseDto) {
    this.server.to(roomName).emit('new-parking-lot-added', payload)
  }

  // ==================================================================
  // 3. LOGIC CHO PYTHON DEVICE (TUNNEL CONTROL) - MỚI THÊM
  // ==================================================================

  /**
   * API nội bộ: Gửi lệnh MỞ CỔNG xuống Python tại bãi xe cụ thể.
   * Hàm này được gọi bởi Controller/Service.
   */
  sendOpenCommand(parkingId: string, triggeredBy = 'System') {
    const socketId = this.activePythonConnections.get(parkingId)

    if (!socketId) {
      this.logger.error(`Gửi lệnh thất bại: Bãi xe ${parkingId} đang Offline.`)
      return {
        success: false,
        message: 'Thiết bị tại bãi xe đang mất kết nối Internet',
      }
    }

    // Bắn sự kiện 'open_barrier' xuống đúng Socket của bãi xe đó
    this.server.to(socketId).emit('open_barrier', {
      timestamp: Date.now(),
      command: 'OPEN',
      triggeredBy: triggeredBy,
    })

    this.logger.log(
      `🚀 Đã gửi lệnh OPEN xuống bãi xe ${parkingId} (User: ${triggeredBy})`,
    )
    return { success: true, message: 'Đã gửi lệnh xuống thiết bị' }
  }

  /**
   * (Optional) Nhận phản hồi từ Python (VD: Check-in thành công, NFC scan)
   */
  @SubscribeMessage('check_in_event')
  handleCheckInEvent(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📥 Nhận dữ liệu Check-in từ Device ${client.id}:`, data)
    // Tại đây bạn có thể gọi Service để lưu vào DB
    // this.parkingService.processCheckIn(data);
  }
}
