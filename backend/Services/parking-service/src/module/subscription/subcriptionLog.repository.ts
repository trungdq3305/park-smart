import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { ISubscriptionLogRepository } from './interfaces/isubcriptionLog.repository'
import { SubscriptionLog } from './schemas/subcriptionLog.schema'

export class SubscriptionLogRepository implements ISubscriptionLogRepository {
  constructor(
    @InjectModel(SubscriptionLog.name)
    private readonly subscriptionLogModel: Model<SubscriptionLog>,
  ) {}

  createLog(
    logData: Partial<SubscriptionLog>,
    session: ClientSession,
  ): Promise<SubscriptionLog | null> {
    const log = new this.subscriptionLogModel(logData)
    return log.save({ session })
  }

  findLogsBySubscriptionId(
    subscriptionId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: SubscriptionLog[]; total: number }> {
    throw new Error('Method not implemented.')
  }

  findLogByPaymentId(
    paymentTransactionId: string,
    session?: ClientSession,
  ): Promise<SubscriptionLog | null> {
    throw new Error('Method not implemented.')
  }
}
