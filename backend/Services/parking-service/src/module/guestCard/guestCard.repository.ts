import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, InsertManyOptions, Model } from 'mongoose'

import { IGuestCardRepository } from './interfaces/iguestCard.repository'
import { GuestCard } from './schemas/guestCard.schema'

interface MongoWriteError {
  code: number
  index: number
  errmsg: string
  op: Partial<GuestCard> // Dữ liệu gốc gây ra lỗi
}

interface MongoBulkWriteError extends Error {
  insertedDocs: GuestCard[] // Danh sách các bản ghi đã chèn thành công
  writeErrors: MongoWriteError[] // Danh sách các lỗi chi tiết
  code?: number
}

@Injectable()
export class GuestCardRepository implements IGuestCardRepository {
  constructor(
    @InjectModel(GuestCard.name)
    private readonly guestCardModel: Model<GuestCard>,
  ) {}

  updateStatusById(
    id: string,
    status: string,
    session?: ClientSession,
  ): Promise<GuestCard | null> {
    const options = session ? { session, new: true } : { new: true }
    const updatedGuestCard = this.guestCardModel
      .findByIdAndUpdate(
        id,
        {
          $set: { status },
        },
        options,
      )
      .lean()
      .exec()
    return updatedGuestCard
  }

  async createGuestCard(
    guestCard: Partial<GuestCard>,
    session?: ClientSession,
  ): Promise<GuestCard> {
    const options = session ? { session } : {}
    const createdGuestCard = new this.guestCardModel(guestCard)
    await createdGuestCard.save(options)
    return createdGuestCard
  }

  async bulkInsertAllowingFailures(
    guestCards: Partial<GuestCard>[],
    session?: ClientSession,
  ): Promise<{ successes: GuestCard[]; errors: MongoWriteError[] }> {
    // 1. Sử dụng InsertManyOptions để type-safe cho options
    const options: InsertManyOptions & { rawResult?: boolean } = {
      session,
      ordered: false, // Quan trọng: Tiếp tục insert dù gặp lỗi
      rawResult: true, // Để lấy kết quả thô nếu cần (tùy version mongoose)
    }

    try {
      // Nếu thành công 100%, Mongoose trả về mảng documents
      const result = await this.guestCardModel.insertMany(guestCards, options)

      // Mongoose types đôi khi trả về (Document & T)[] hoặc BulkWriteResult
      // Ta ép kiểu an toàn về mảng GuestCard[]
      return {
        successes: result as unknown as GuestCard[],
        errors: [],
      }
    } catch (error) {
      // 2. Ép kiểu lỗi về Interface đã định nghĩa (MongoBulkWriteError)
      // Thay vì dùng 'any', ta dùng Type Assertion
      const bulkError = error as MongoBulkWriteError

      // Bây giờ TS hiểu bulkError có insertedDocs và writeErrors
      const successes = bulkError.insertedDocs
      const writeErrors = bulkError.writeErrors

      return {
        successes: successes,
        errors: writeErrors,
      }
    }
  }

  async findGuestCardById(id: string): Promise<GuestCard | null> {
    const guestCard = await this.guestCardModel.findById(id).lean().exec()
    return guestCard
  }

  async findGuestCardByNfcUid(
    nfcUid: string,
    parkingLotId: string,
  ): Promise<GuestCard | null> {
    const guestCard = await this.guestCardModel
      .findOne({ nfcUid, parkingLotId })
      .lean()
      .exec()
    return guestCard
  }

  findGuestCardByCode(
    code: string,
    parkingLotId: string,
  ): Promise<GuestCard | null> {
    const guestCard = this.guestCardModel
      .findOne({ code, parkingLotId })
      .lean()
      .exec()
    return guestCard
  }

  async findAllGuestCardsByParkingLot(
    parkingLotId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: GuestCard[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      this.guestCardModel
        .find({ parkingLotId })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.guestCardModel.countDocuments({ parkingLotId }).exec(),
    ])
    return { data, total }
  }

  updateGuestCard(
    id: string,
    updateData: Partial<GuestCard>,
    session?: ClientSession,
  ): Promise<GuestCard | null> {
    const options = session ? { session, new: true } : { new: true }
    const updatedGuestCard = this.guestCardModel
      .findByIdAndUpdate(
        id,
        {
          $set: updateData,
        },
        options,
      )
      .lean()
      .exec()
    return updatedGuestCard
  }

  async softDeleteGuestCard(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const options = session ? { session } : {}
    return this.guestCardModel
      .findByIdAndUpdate(
        id,
        {
          $set: { deletedAt: new Date(), deletedBy: userId },
        },
        options,
      )
      .then((res) => !!res)
  }

  async deleteGuestCardPermanently(
    id: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const options = session ? { session } : {}
    return this.guestCardModel
      .findByIdAndDelete(id, options)
      .then((res) => !!res)
  }

  async existsByNfcUid(nfcUid: string, parkingLotId: string): Promise<boolean> {
    return this.guestCardModel
      .exists({ nfcUid, parkingLotId })
      .then((res) => !!res)
  }
}
