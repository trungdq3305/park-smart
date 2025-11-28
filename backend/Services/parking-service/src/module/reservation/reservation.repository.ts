import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, FilterQuery, Model, Types } from 'mongoose'

import { ReservationStatusEnum } from './enums/reservation.enum'
import { IReservationRepository } from './interfaces/ireservation.repository'
import { Reservation, ReservationDocument } from './schemas/reservation.schema'

@Injectable()
export class ReservationRepository implements IReservationRepository {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<Reservation>,
  ) {}

  async updateReservationRefundAmount(
    id: string,
    refundAmount: number,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.reservationModel
      .updateOne(
        { _id: id },
        {
          $set: {
            refundedAmount: refundAmount,
            updatedAt: new Date(),
          },
        },
        { session },
      )
      .exec()
    return result.modifiedCount > 0
  }

  findReservationByIdWithoutPopulate(
    id: string,
    session?: ClientSession,
  ): Promise<Reservation | null> {
    const query = this.reservationModel.findById(id).lean()
    if (session) {
      query.session(session)
    }
    return query.exec()
  }

  async updateExpiredReservationsToExpiredStatus(
    cutoffTime: Date,
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const filter = {
      status: {
        $in: [
          ReservationStatusEnum.CONFIRMED, // Chỉ xử lý những vé ĐÃ ĐẶT mà KHÔNG ĐẾN
        ],
      },
      estimatedEndTime: { $lt: cutoffTime }, // Đã quá giờ kết thúc
      deletedAt: null,
    }

    // 2. Dữ liệu cập nhật
    const update = {
      $set: {
        status: ReservationStatusEnum.EXPIRED,
        updatedAt: new Date(),
        // Có thể thêm log ghi chú
        cancelReason: 'System Auto-expire (No-show)',
      },
    }

    // 3. Thực thi
    const result = await this.reservationModel.updateMany(filter, update)

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    }
  }

  async countConflictingReservations(
    parkingLotId: string,
    start: Date,
    end: Date,
    excludeReservationId: string,
  ): Promise<number> {
    /**
     * Logic tìm Booking trùng giờ:
     * (StartA < EndB) AND (EndA > StartB)
     *
     * A: Booking trong DB
     * B: Khoảng thời gian muốn kiểm tra (start, end)
     */
    const filter: FilterQuery<ReservationDocument> = {
      parkingLotId: new Types.ObjectId(parkingLotId),
      // Loại trừ chính booking đang gia hạn
      _id: { $ne: new Types.ObjectId(excludeReservationId) },
      // Chỉ tính các booking đang chiếm chỗ
      status: {
        $in: [
          ReservationStatusEnum.CONFIRMED,
          ReservationStatusEnum.CHECKED_IN,
          ReservationStatusEnum.PENDING_PAYMENT, // Tính cả những ông đang trả tiền
        ],
      },
      $or: [
        {
          userExpectedTime: { $lt: end }, // Start DB < End Request
          estimatedEndTime: { $gt: start }, // End DB > Start Request
        },
      ],
    }

    return this.reservationModel.countDocuments(filter).exec()
  }

  async extendReservationEndTime(
    id: string,
    newEndTime: Date,
    additionalAmount: number,
    session: ClientSession,
  ): Promise<Reservation | null> {
    return this.reservationModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            estimatedEndTime: newEndTime, // Cập nhật giờ ra mới
            updatedAt: new Date(),
          },
          $inc: {
            prepaidAmount: additionalAmount, // Cộng dồn tiền vào tổng tiền đã trả
            // Hoặc nếu bạn có field 'totalAmount', hãy update nó
          },
        },
        { new: true, session },
      )
      .exec()
  }

  async checkReservationStatusByIdentifier(
    reservationIdentifier: string,
  ): Promise<boolean> {
    const data = await this.reservationModel
      .findOne({
        reservationIdentifier,
        status: ReservationStatusEnum.CONFIRMED,
      })
      .select('inUsed')
      .lean<{ inUsed?: boolean }>()
      .exec()
    return !!data?.inUsed
  }

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
    prepaidAmount: number,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.reservationModel
      .updateOne(
        { _id: id },
        {
          $set: {
            paymentId,
            status: ReservationStatusEnum.CONFIRMED,
            prepaidAmount: prepaidAmount,
          },
        },
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
    const query = this.reservationModel.findById(id).populate([
      {
        path: 'parkingLotId',
        select: 'parkingLotOperatorId name _id',
      },
      {
        path: 'pricingPolicyId',
        populate: [
          { path: 'basisId' },
          { path: 'packageRateId' },
          { path: 'tieredRateSetId' },
        ],
      },
    ]) // Populate chi tiết bãi đỗ xe
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
    status: string,
  ): Promise<{ data: Reservation[]; total: number }> {
    const skip = (page - 1) * pageSize
    return Promise.all([
      this.reservationModel
        .find({ createdBy: userId, status: status, deletedAt: null })
        .populate([
          {
            path: 'parkingLotId',
            select: 'parkingLotOperatorId name _id',
          },
          {
            path: 'pricingPolicyId',
            populate: [
              { path: 'basisId' },
              { path: 'packageRateId' },
              { path: 'tieredRateSetId' },
            ],
          },
        ])
        .sort({ createdAt: -1 }) // Mới nhất trước
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.reservationModel
        .countDocuments({ createdBy: userId, status: status, deletedAt: null })
        .exec(),
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
