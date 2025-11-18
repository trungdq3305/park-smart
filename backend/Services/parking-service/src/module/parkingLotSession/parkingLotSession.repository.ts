import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { ParkingSessionStatusEnum } from './enums/parkingLotSession.enum'
import { IParkingLotSessionRepository } from './interfaces/iparkingLotSession.repository'
import { ParkingLotSession } from './schemas/parkingLotSession.schema'

export class ParkingLotSessionRepository
  implements IParkingLotSessionRepository
{
  constructor(
    @InjectModel(ParkingLotSession.name)
    private parkingLotSessionModel: Model<ParkingLotSession>,
  ) {}

  createSession(
    sessionData: Partial<ParkingLotSession>,
    session: ClientSession,
  ): Promise<ParkingLotSession | null> {
    throw new Error('Method not implemented.')
  }

  findActiveSessionByPlate(
    plateNumber: string,
    parkingLotId?: string,
  ): Promise<ParkingLotSession | null> {
    throw new Error('Method not implemented.')
  }

  updateSessionOnCheckout(
    sessionId: string,
    updateData: Partial<ParkingLotSession>,
    session: ClientSession,
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async countActiveWalkInSessions(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<number> {
    return await this.parkingLotSessionModel
      .countDocuments({
        parkingLotId: parkingLotId,
        status: ParkingSessionStatusEnum.ACTIVE, // Chỉ đếm xe đang ở trong bãi
        reservationId: null, // ⭐️ Không phải đặt trước
        subscriptionId: null, // ⭐️ Không phải vé tháng
      })
      .session(session ?? null)
      .exec()
  }

  /**
   * (Bổ sung) Đếm xe Đặt trước (Xô 2) đang trong bãi
   * Logic: status = ACTIVE và CÓ reservationId
   */
  async countActiveBookedSessions(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<number> {
    return await this.parkingLotSessionModel
      .countDocuments({
        parkingLotId: parkingLotId,
        status: ParkingSessionStatusEnum.ACTIVE,
        reservationId: { $ne: null }, // ⭐️ Có Reservation ID
      })
      .session(session ?? null)
      .exec()
  }

  /**
   * (Bổ sung) Đếm xe Thuê bao (Xô 1) đang trong bãi
   * Logic: status = ACTIVE và CÓ subscriptionId
   */
  async countActiveLeasedSessions(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<number> {
    return await this.parkingLotSessionModel
      .countDocuments({
        parkingLotId: parkingLotId,
        status: ParkingSessionStatusEnum.ACTIVE,
        subscriptionId: { $ne: null }, // ⭐️ Có Subscription ID
      })
      .session(session ?? null)
      .exec()
  }

  findAllSessionsByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotSession[]; total: number }> {
    throw new Error('Method not implemented.')
  }
}
