import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { ISubscriptionLogRepository } from './interfaces/isubcriptionLog.repository'
import { SubscriptionLog } from './schemas/subcriptionLog.schema'

export class SubscriptionLogRepository implements ISubscriptionLogRepository {
  constructor(
    @InjectModel(SubscriptionLog.name)
    private readonly subscriptionLogModel: Model<SubscriptionLog>,
  ) {}

  countLogsBySubscriptionId(subscriptionId: string): Promise<number> {
    return this.subscriptionLogModel.countDocuments({ subscriptionId }).exec()
  }

  createLog(
    logData: Partial<SubscriptionLog>,
    session: ClientSession,
  ): Promise<SubscriptionLog | null> {
    const log = new this.subscriptionLogModel(logData)
    return log.save({ session })
  }

  async findLogsBySubscriptionId(
    subscriptionId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: SubscriptionLog[]; total: number }> {
    const skip = (page - 1) * pageSize
    return Promise.all([
      this.subscriptionLogModel
        .find({ subscriptionId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.subscriptionLogModel.countDocuments({ subscriptionId }).exec(),
    ]).then(([data, total]) => ({ data, total }))
  }

  findLogByPaymentId(
    paymentId: string,
    session?: ClientSession,
  ): Promise<SubscriptionLog | null> {
    return this.subscriptionLogModel
      .findOne({ paymentId })
      .session(session ?? null)
      .lean()
      .exec()
  }
}
