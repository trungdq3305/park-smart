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

  findActiveSessionByReservationId(
    reservationId: string,
    parkingLotId?: string,
  ): Promise<ParkingLotSession | null> {
    return this.parkingLotSessionModel
      .findOne({
        reservationId: reservationId,
        parkingLotId: parkingLotId,
        status: ParkingSessionStatusEnum.ACTIVE,
      })
      .lean()
      .exec()
  }

  findActiveSessionBySubscriptionId(
    subscriptionId: string,
    parkingLotId?: string,
  ): Promise<ParkingLotSession | null> {
    return this.parkingLotSessionModel
      .findOne({
        subscriptionId: subscriptionId,
        parkingLotId: parkingLotId,
        status: ParkingSessionStatusEnum.ACTIVE,
      })
      .lean()
      .exec()
  }

  findById(
    sessionId: string,
    session?: ClientSession,
  ): Promise<ParkingLotSession | null> {
    return this.parkingLotSessionModel
      .findById(sessionId)
      .session(session ?? null)
      .lean()
      .exec()
  }

  async findAllSessionsByParkingLotId(
    parkingLotId: string,
    page: number,
    pageSize: number,
    startTime: Date,
    endTime: Date,
    session?: ClientSession,
  ): Promise<{ data: ParkingLotSession[]; total: number }> {
    const filter = {
      parkingLotId: parkingLotId,
      createdAt: {
        $gte: startTime, // Lớn hơn hoặc bằng Start
        $lte: endTime, // Nhỏ hơn hoặc bằng End
      },
    }

    const [data, total] = await Promise.all([
      this.parkingLotSessionModel
        .find(filter)
        .sort({ createdAt: -1 }) // 👈 QUAN TRỌNG: Sắp xếp mới nhất lên đầu
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .session(session ?? null)
        .exec(),
      this.parkingLotSessionModel
        .countDocuments(filter)
        .session(session ?? null)
        .exec(),
    ])

    return { data, total }
  }

  createSession(
    sessionData: Partial<ParkingLotSession>,
    session: ClientSession,
  ): Promise<ParkingLotSession | null> {
    const createdSession = new this.parkingLotSessionModel(sessionData)
    return createdSession.save({ session })
  }

  findActiveSessionByUidCard(
    uidCard: string,
    parkingLotId?: string,
  ): Promise<ParkingLotSession[] | null> {
    const data = this.parkingLotSessionModel
      .find({
        guestCardId: uidCard,
        parkingLotId: parkingLotId,
        status: ParkingSessionStatusEnum.ACTIVE,
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec()
    return data
  }

  async updateSessionOnCheckout(
    sessionId: string,
    updateData: Partial<ParkingLotSession>,
    session: ClientSession,
  ): Promise<boolean> {
    return this.parkingLotSessionModel
      .updateOne({ _id: sessionId }, { $set: updateData })
      .session(session)
      .then((res) => res.modifiedCount > 0)
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

  async findAllSessionsByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotSession[]; total: number }> {
    const [data, total] = await Promise.all([
      this.parkingLotSessionModel
        .find({ createdBy: userId })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.parkingLotSessionModel.countDocuments({ createdBy: userId }).exec(),
    ])
    return { data, total }
  }
}
