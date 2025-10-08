import { InternalServerErrorException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model, Types } from 'mongoose'

import {
  IParkingSpaceRepository,
  ParkingSpaceCreationAttributes,
} from './interfaces/iparkingSpace.repository'
import {
  ParkingSpace,
  ParkingSpaceDocument,
} from './schemas/parkingSpace.schema'

export class ParkingSpaceRepository implements IParkingSpaceRepository {
  constructor(
    @InjectModel(ParkingSpace.name)
    private readonly parkingSpaceModel: Model<ParkingSpaceDocument>,
  ) {}

  async createMany(
    spaces: ParkingSpaceCreationAttributes[],
    session?: ClientSession,
  ): Promise<boolean> {
    const data = await this.parkingSpaceModel.insertMany(spaces, {
      session: session,
    }) // Thêm option session
    return data.length > 0
  }

  findByParkingLotId(
    parkingLotId: string,
    level: number,
  ): Promise<ParkingSpace[]> {
    return this.parkingSpaceModel.aggregate([
      {
        $match: {
          parkingLotId: new Types.ObjectId(parkingLotId),
          level: level,
        },
      },
      {
        $lookup: {
          from: 'parkingspacestatuses', // Tên collection của ParkingSpaceStatus
          localField: 'parkingSpaceStatusId',
          foreignField: '_id',
          as: 'statusDetails',
        },
      },
      { $unwind: '$statusDetails' }, // Giải nén mảng statusDetails
      {
        $project: {
          _id: 1,
          parkingLotId: 1,
          code: 1,
          level: 1,
          isElectricCar: 1,
          parkingSpaceStatusId: {
            _id: '$statusDetails._id',
            status: '$statusDetails.status',
          },
        },
      },
    ])
  }

  findById(id: string): Promise<ParkingSpace | null> {
    return this.parkingSpaceModel
      .findById(id)
      .populate({ path: 'parkingSpaceStatusId', select: '_id status' })
      .lean()
      .exec()
  }

  async updateStatus(
    id: string,
    parkingSpaceStatusId: string,
    session?: ClientSession,
  ): Promise<ParkingSpace | null> {
    const data = await this.parkingSpaceModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            parkingSpaceStatusId: parkingSpaceStatusId,
          },
        },
        { new: true, session: session },
      )
      .lean()
      .exec()
    if (!data) {
      throw new InternalServerErrorException(
        'Cập nhật trạng thái ô đỗ thất bại',
      )
    }
    return data
  }

  deleteByParkingLotId(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
