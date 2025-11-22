import { InjectModel } from '@nestjs/mongoose'
import { ClientSession } from 'mongoose'
import { Model } from 'mongoose'

import { CreateSubscriptionDto } from './dto/subscription.dto'
import { SubscriptionStatusEnum } from './enums/subscription.enum'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { Subscription } from './schemas/subscription.schema'

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  async countPendingByUser(userId: string): Promise<number> {
    return this.subscriptionModel
      .countDocuments({
        userId: userId,
        status: SubscriptionStatusEnum.PENDING_PAYMENT,
        deletedAt: null,
      })
      .exec()
  }

  async updateExpiredPendingSubscriptions(
    cutoffTime: Date,
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    // 1. Điều kiện lọc
    const filter = {
      status: SubscriptionStatusEnum.PENDING_PAYMENT,
      createdAt: { $lt: cutoffTime }, // ⭐️ Lấy các bản ghi TẠO TRƯỚC thời gian "cắt"
      deletedAt: null,
    }

    // 2. Dữ liệu cập nhật
    const update = {
      $set: {
        status: SubscriptionStatusEnum.CANCELLED_DUE_TO_NON_PAYMENT, // ⭐️ Trạng thái mới
        updatedAt: new Date(),
      },
    }

    // 3. Thực thi
    const result = await this.subscriptionModel.updateMany(filter, update)

    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    }
  }

  updateSubscriptionPaymentId(
    id: string,
    paymentId: string,
    session: ClientSession,
  ): Promise<Subscription | null> {
    return this.subscriptionModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            paymentId,
            updatedAt: new Date(),
            status: SubscriptionStatusEnum.ACTIVE,
          },
        },
        { session, new: true },
      )
      .lean()
      .exec()
  }

  async cancelSubscription(
    id: string,
    userId: string,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.subscriptionModel
      .findByIdAndUpdate(
        id, // ⭐️ CHỈ CẦN TÌM THEO ID
        {
          $set: {
            status: SubscriptionStatusEnum.CANCELLED,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        },
        { session, new: true },
      )
      .lean()
      .exec()
    return result ? true : false
  }

  async setExpiredSubscriptionsJob(): Promise<{
    modifiedCount: number
    failedCount: number
  }> {
    const data = await this.subscriptionModel.updateMany(
      {
        endDate: { $lt: new Date() },
        status: { $eq: SubscriptionStatusEnum.ACTIVE },
      },
      { $set: { status: SubscriptionStatusEnum.EXPIRED } },
    )
    return {
      modifiedCount: data.modifiedCount,
      failedCount: data.matchedCount - data.modifiedCount,
    }
  }

  async findActiveAndFutureSubscriptions(
    parkingLotId: string,
    fromDate: Date, // (Đây là 'today' được chuẩn hóa)
  ): Promise<Pick<Subscription, 'startDate' | 'endDate'>[]> {
    const filter = {
      parkingLotId: parkingLotId,
      status: {
        $in: [
          SubscriptionStatusEnum.ACTIVE,
          SubscriptionStatusEnum.PENDING_PAYMENT,
        ],
      }, // Chỉ đếm các gói đang active
      deletedAt: null, // Bỏ qua các gói đã xóa mềm

      // ⭐️ Logic quan trọng:
      // Lấy tất cả các gói CHƯA HẾT HẠN (tính từ hôm nay)
      endDate: { $gte: fromDate },
    }

    return this.subscriptionModel
      .find(filter)
      .select('startDate endDate') // ⭐️ Chỉ lấy 2 trường này để tối ưu
      .lean() // Trả về JS object thuần túy
      .exec()
  }

  async createSubscription(
    subscriptionData: CreateSubscriptionDto,
    userId: string,
    session: ClientSession,
  ): Promise<Subscription | null> {
    const createdSubscription = new this.subscriptionModel({
      ...subscriptionData,
      createdBy: userId,
      createdAt: new Date(),
    })
    const data = await createdSubscription.save({ session })
    const populated = await data.populate([
      {
        path: 'parkingLotId',
        select: 'name _id',
      },
      {
        path: 'pricingPolicyId',
        select: 'name _id',
      },
    ])
    return populated
  }

  findSubscriptionById(
    id: string,
    userId?: string,
    session?: ClientSession,
  ): Promise<Subscription | null> {
    const query = { _id: id, ...(userId ? { createdBy: userId } : {}) }
    return this.subscriptionModel
      .findOne(query)
      .session(session ?? null)
      .lean()
      .exec()
  }

  async findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<Subscription | null> {
    return this.subscriptionModel
      .findOne({
        subscriptionIdentifier,
        status: SubscriptionStatusEnum.ACTIVE,
      })
      .lean()
      .exec()
  }

  async updateUsageStatus(
    subscriptionIdentifier: string,
    isUsed: boolean,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.subscriptionModel.updateOne(
      { subscriptionIdentifier },
      { $set: { isUsed } },
      { session },
    )
    return result.modifiedCount > 0
  }

  async countActiveOnDateByParkingLot(
    parkingLotId: string,
    requestedDate: Date,
    subscriptionIdToExclude?: string,
    session?: ClientSession,
  ): Promise<number> {
    return this.subscriptionModel
      .countDocuments({
        parkingLotId,
        status: {
          $in: [
            SubscriptionStatusEnum.ACTIVE,
            SubscriptionStatusEnum.PENDING_PAYMENT, // ✅ Thêm dòng này
          ],
        },
        deletedAt: null,
        startDate: { $lte: requestedDate },
        endDate: { $gte: requestedDate },
        _id: { $ne: subscriptionIdToExclude ?? null },
      })
      .session(session ?? null)
      .exec()
  }

  async findAllByUserId(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Subscription[]; total: number }> {
    const limit = pageSize
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.subscriptionModel
        .find({ createdBy: userId, deletedAt: null })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          {
            path: 'parkingLotId',
            select: 'name _id',
          },
          {
            path: 'pricingPolicyId',
            select: 'name _id',
          },
        ])
        .lean()
        .exec(),
      this.subscriptionModel
        .countDocuments({ createdBy: userId, deletedAt: null })
        .exec(),
    ])
    return { data, total }
  }

  async updateSubscription(
    id: string,
    updateData: {
      startDate?: Date
      endDate?: Date
      status?: string
    },
    session: ClientSession,
  ): Promise<Subscription | null> {
    return await this.subscriptionModel
      .findByIdAndUpdate(
        { _id: id },
        { $set: updateData },
        {
          new: true,
          session,
        },
      )
      .lean()
      .exec()
  }

  async softDeleteSubscription(
    id: string,
    userId: string,
    session: ClientSession,
  ): Promise<boolean> {
    const data = await this.subscriptionModel
      .findByIdAndUpdate(
        { _id: id },
        { $set: { deletedAt: new Date(), deletedBy: userId } },
        { new: true, session },
      )
      .lean()
      .exec()
    return !!data
  }

  async findExpiringSubscriptions(
    daysRemaining: number,
    today: Date,
  ): Promise<Pick<Subscription, '_id' | 'createdBy' | 'endDate' | 'status'>[]> {
    const targetDate = new Date(today.getTime())
    // Thêm số ngày để tính ra ngày HẾT HẠN MONG MUỐN (ví dụ: today + 3 ngày)
    targetDate.setDate(targetDate.getDate() + daysRemaining)

    const filter = {
      status: SubscriptionStatusEnum.ACTIVE, // Chỉ quét các gói đang hoạt động
      deletedAt: null,

      // Ngày hết hạn (endDate) phải TRƯỚC HOẶC BẰNG ngày mục tiêu (targetDate)
      // VÀ phải LỚN HƠN ngày hiện tại (today)
      endDate: {
        $lte: targetDate,
        $gt: today,
      },
    }

    return (
      this.subscriptionModel
        .find(filter)
        // Lấy các trường cần thiết để gửi thông báo (ID gói, ID người dùng, ngày hết hạn)
        .select('_id createdBy endDate status')
        .lean()
        .exec()
    )
  }
}
