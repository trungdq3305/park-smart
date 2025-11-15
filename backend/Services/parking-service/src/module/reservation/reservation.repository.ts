import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { ReservationStatusEnum } from './enums/reservation.enum'
import { IReservationRepository } from './interfaces/ireservation.repository'
import { Reservation } from './schemas/reservation.schema'

@Injectable()
export class ReservationRepository implements IReservationRepository {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<Reservation>,
  ) {}

  async updateExpiredPendingReservations(
    cutoffTime: Date,
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    // 1. Điều kiện lọc
    const filter = {
      status: ReservationStatusEnum.PENDING_PAYMENT,
      createdAt: { $lt: cutoffTime }, // ⭐️ Lấy các bản ghi TẠO TRƯỚC thời gian "cắt"
      deletedAt: null,
    }

    // 2. Dữ liệu cập nhật
    const update = {
      $set: {
        status: ReservationStatusEnum.CANCELLED_DUE_TO_NON_PAYMENT, // ⭐️ Trạng thái mới
        updatedAt: new Date(),
      },
    }

    // 3. Thực thi
    const result = await this.reservationModel.updateMany(filter, update)

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    }
  }

  async updateReservationStatusForAdmin(
    id: string,
    userId: string,
    status: ReservationStatusEnum,
    session: ClientSession,
  ): Promise<boolean> {
    return this.reservationModel
      .updateOne(
        { _id: id },
        {
          $set: {
            status: status,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        },
      )
      .session(session)
      .exec()
      .then((result) => result.modifiedCount > 0)
  }

  async updateReservationPaymentId(
    id: string,
    paymentId: string,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.reservationModel
      .updateOne(
        { _id: id },
        { $set: { paymentId, status: ReservationStatusEnum.CONFIRMED } },
        { session }, // 'new: true' để trả về document mới
      )
      .exec()
    return result.modifiedCount > 0
  }

  createReservation(
    reservationData: Partial<Reservation>,
    session: ClientSession,
  ): Promise<Reservation | null> {
    const createdReservation = new this.reservationModel(reservationData)
    return createdReservation.save({ session })
  }

  findReservationById(
    id: string,
    session?: ClientSession,
  ): Promise<Reservation | null> {
    const query = this.reservationModel
      .findById(id)
      .populate('parkingLotId') // Populate chi tiết bãi đỗ xe
      .populate('pricingPolicyId') // Populate chi tiết chính sách giá
    if (session) {
      query.session(session)
    }
    return query.exec()
  }

  findReservationByPaymentId(
    paymentId: string,
    session?: ClientSession,
  ): Promise<Reservation | null> {
    const query = this.reservationModel.findOne({ paymentId: paymentId })
    if (session) {
      query.session(session)
    }
    return query.exec()
  }

  findValidReservationForCheckIn(
    reservationIdentifier: string,
  ): Promise<Reservation | null> {
    return this.reservationModel
      .findOne({
        reservationIdentifier,
        status: ReservationStatusEnum.CONFIRMED, // Chỉ tìm các vé đã xác nhận
      })
      .exec()
  }

  async findAllByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Reservation[]; total: number }> {
    const skip = (page - 1) * pageSize
    return Promise.all([
      this.reservationModel
        .find({ createdBy: userId })
        .sort({ createdAt: -1 }) // Mới nhất trước
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.reservationModel.countDocuments({ createdBy: userId }).exec(),
    ]).then(([data, total]) => ({ data, total }))
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatusEnum,
    userId: string,
    session: ClientSession,
  ): Promise<boolean> {
    return this.reservationModel
      .updateOne(
        { _id: id },
        { $set: { status: status, updatedBy: userId, updatedAt: new Date() } },
      )
      .session(session)
      .exec()
      .then((result) => result.modifiedCount > 0)
  }

  expireOverdueReservations(
    cutoffTime: Date,
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    return this.reservationModel
      .updateMany(
        {
          status: ReservationStatusEnum.CONFIRMED,
          userExpectedTime: { $lt: cutoffTime },
        },
        { $set: { status: ReservationStatusEnum.EXPIRED } },
      )
      .exec()
  }
}
