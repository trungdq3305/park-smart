import { InjectModel } from '@nestjs/mongoose'
import { ClientSession } from 'mongoose'
import { Model } from 'mongoose'

import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto'
import { SubscriptionStatusEnum } from './enums/subscription.enum'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { Subscription } from './schemas/subscription.schema'

export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<Subscription>,
  ) {}

  async findActiveAndFutureSubscriptions(
    parkingLotId: string,
    fromDate: Date, // (Đây là 'today' được chuẩn hóa)
  ): Promise<Pick<Subscription, 'startDate' | 'endDate'>[]> {
    const filter = {
      parkingLotId: parkingLotId,
      status: SubscriptionStatusEnum.ACTIVE, // Chỉ đếm các gói đang active
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

  createSubscription(
    subscriptionData: CreateSubscriptionDto,
    userId: string,
    session: ClientSession,
  ): Promise<Subscription | null> {
    const createdSubscription = new this.subscriptionModel({
      ...subscriptionData,
      createdBy: userId,
      createdAt: new Date(),
    })
    return createdSubscription.save({ session })
  }

  findSubscriptionById(
    id: string,
    userId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionModel
      .findOne({ _id: id, createdBy: userId })
      .lean()
      .exec()
  }

  async findActiveSubscriptionByIdentifier(
    subscriptionIdentifier: string,
  ): Promise<Subscription | null> {
    return this.subscriptionModel
      .findOne({
        subscriptionIdentifier,
        isUsed: true,
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
    session?: ClientSession,
  ): Promise<number> {
    return this.subscriptionModel
      .countDocuments({
        parkingLotId,
        status: SubscriptionStatusEnum.ACTIVE,
        deletedAt: null,
        startDate: { $lte: requestedDate },
        endDate: { $gte: requestedDate },
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
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.subscriptionModel.countDocuments({ userId }).exec(),
    ])
    return { data, total }
  }

  async updateSubscription(
    id: string,
    updateData: UpdateSubscriptionDto,
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
}
