import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, FilterQuery, Model } from 'mongoose'

import { TransactionFilterDto } from './dto/parkingTransaction.dto'
import { IParkingTransactionRepository } from './interfaces/iparkingTransaction.repository'
import {
  ParkingTransaction,
  ParkingTransactionDocument,
} from './schemas/parkingTransaction.schema'

@Injectable()
export class ParkingTransactionRepository
  implements IParkingTransactionRepository
{
  constructor(
    @InjectModel(ParkingTransaction.name)
    private readonly parkingTransactionModel: Model<ParkingTransaction>,
  ) {}

  async createTransaction(
    data: Partial<ParkingTransaction>,
    session: ClientSession,
  ): Promise<ParkingTransaction> {
    const createdData = new this.parkingTransactionModel(data)
    return createdData.save({ session })
  }

  async findById(id: string): Promise<ParkingTransaction | null> {
    const data = await this.parkingTransactionModel.findById(id).lean().exec()
    return data
  }

  async findByPaymentId(paymentId: string): Promise<ParkingTransaction | null> {
    const data = await this.parkingTransactionModel
      .findOne({ paymentId })
      .lean()
      .exec()
    return data
  }

  async findAll(
    filterDto: TransactionFilterDto,
    page: number,
    limit: number,
  ): Promise<{ data: ParkingTransaction[]; total: number }> {
    // 1. Tạo Query Object
    const query: FilterQuery<ParkingTransactionDocument> = {}

    // 2. Áp dụng các bộ lọc
    if (filterDto.parkingLotId) {
      query.parkingLotId = filterDto.parkingLotId
    }

    if (filterDto.type) {
      query.type = filterDto.type
    }

    // Lọc theo thời gian giao dịch (transactionDate chuẩn hơn createdAt)
    if (filterDto.startDate || filterDto.endDate) {
      query.transactionDate = {
        ...(filterDto.startDate ? { $gte: filterDto.startDate } : {}),
        ...(filterDto.endDate ? { $lte: filterDto.endDate } : {}),
      }
    }

    // 3. Thực thi Query song song (Promise.all) để tối ưu tốc độ
    const [data, total] = await Promise.all([
      this.parkingTransactionModel
        .find(query)
        .sort({ transactionDate: -1 }) // Mới nhất lên đầu
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.parkingTransactionModel.countDocuments(query).exec(),
    ])

    return { data: data as ParkingTransaction[], total }
  }

  async sumAmountByUserId(userId: string): Promise<number> {
    const result = await this.parkingTransactionModel
      .aggregate<{ totalAmount?: number }>([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
          },
        },
      ])
      .exec()
    return result[0]?.totalAmount ?? 0
  }
}
