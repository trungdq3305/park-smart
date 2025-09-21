import { InjectModel } from '@nestjs/mongoose'
import { IParkingLotHistoryLogRepository } from './interfaces/iparkingLotHistoryLog.repository'
import { ParkingLotHistoryLog } from './schemas/parkingLotHistoryLog.schema'
import { Model, Types } from 'mongoose'

export class ParkingLotHistoryLogRepository
  implements IParkingLotHistoryLogRepository
{
  constructor(
    @InjectModel(ParkingLotHistoryLog.name)
    private parkingLotHistoryLogModel: Model<ParkingLotHistoryLog>,
  ) {}

  async updateParkingLot(
    parkingLotHistory: Partial<ParkingLotHistoryLog>,
  ): Promise<ParkingLotHistoryLog> {
    const data = await this.parkingLotHistoryLogModel.create({
      ...parkingLotHistory,
    })
    return data.save()
  }

  async findByParkingLotId(
    parkingLotId: string,
  ): Promise<ParkingLotHistoryLog[] | null> {
    return await this.parkingLotHistoryLogModel
      .find({ parkingLotId: new Types.ObjectId(parkingLotId) })
      .exec()
  }

  async updateParkingLotHistoryLogStatus(
    id: string,
    userId: string,
    statusId: string,
  ): Promise<boolean> {
    try {
      const result = await this.parkingLotHistoryLogModel
        .updateOne(
          { _id: id },
          {
            $set: {
              parkingLotStatusId: new Types.ObjectId(statusId),
              updatedAt: new Date(),
              updatedBy: userId,
            },
          },
        )
        .exec()

      // `modifiedCount` sẽ > 0 nếu có ít nhất một document được thay đổi.
      // `matchedCount` sẽ > 0 nếu tìm thấy document có _id tương ứng.
      // Kết hợp cả hai để đảm bảo đúng document đã được cập nhật.
      return result.matchedCount > 0 && result.modifiedCount > 0
    } catch {
      return false
    }
  }

  async deleteParkingLot(
    id: string,
    userId: string,
    statusId: string,
  ): Promise<boolean> {
    try {
      const result = await this.parkingLotHistoryLogModel
        .updateOne(
          { _id: id },
          {
            $set: {
              parkingLotStatusId: new Types.ObjectId(statusId),
              deletedAt: new Date(),
              deletedBy: userId,
            },
          },
        )
        .exec()

      // `modifiedCount` sẽ > 0 nếu có ít nhất một document được thay đổi.
      // `matchedCount` sẽ > 0 nếu tìm thấy document có _id tương ứng.
      // Kết hợp cả hai để đảm bảo đúng document đã được cập nhật.
      return result.matchedCount > 0 && result.modifiedCount > 0
    } catch {
      return false
    }
  }
}
