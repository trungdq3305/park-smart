import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, InsertManyOptions, Model } from 'mongoose'

import { IGuestCardRepository } from './interfaces/iguestCard.repository'
import { GuestCard } from './schemas/guestCard.schema'

export interface MongoWriteError {
  code: number
  index: number
  errmsg: string
  op: Partial<GuestCard> // Dữ liệu gốc gây ra lỗi
}

export interface MongoBulkWriteError extends Error {
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
    userId: string,
    session?: ClientSession,
  ): Promise<GuestCard | null> {
    const options = session ? { session, new: true } : { new: true }
    const updatedGuestCard = this.guestCardModel
      .findByIdAndUpdate(
        id,
        {
          $set: { status, updatedBy: userId, updatedAt: new Date() },
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
    const options: InsertManyOptions = {
      session,
      ordered: false,
      // ⚠️ QUAN TRỌNG: Bỏ rawResult: true hoặc set thành false
      // Để Mongoose trả về mảng Documents thay vì object result
      rawResult: false,
    }

    try {
      // Khi rawResult = false, result sẽ là mảng GuestCard[]
      const result = await this.guestCardModel.insertMany(guestCards, options)

      // Double check: Đảm bảo nó là mảng (phòng trường hợp thư viện thay đổi)
      const successes = Array.isArray(result) ? result : []

      return {
        successes: successes as unknown as GuestCard[],
        errors: [],
      }
    } catch (error) {
      const bulkError = error as MongoBulkWriteError

      // Trong trường hợp lỗi, insertedDocs luôn là mảng các doc thành công
      const successes = bulkError.insertedDocs || []
      const writeErrors = bulkError.writeErrors || []

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
    status?: string,
  ): Promise<{ data: GuestCard[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      this.guestCardModel
        .find({ parkingLotId, ...(status ? { status } : {}) })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.guestCardModel
        .countDocuments({ parkingLotId, ...(status ? { status } : {}) })
        .exec(),
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
