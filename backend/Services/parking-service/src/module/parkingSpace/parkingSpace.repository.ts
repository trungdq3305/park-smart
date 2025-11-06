/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  ): Promise<any> {
    // Trả về any vì aggregate trả về plain object

    // BƯỚC 1: Cập nhật document bằng findByIdAndUpdate một cách an toàn.
    // Chúng ta không cần populate ở bước này nữa.
    const updatedDoc = await this.parkingSpaceModel.findByIdAndUpdate(
      id,
      {
        $set: {
          parkingSpaceStatusId: new Types.ObjectId(parkingSpaceStatusId),
        },
      },
      { new: true, session: session },
    )

    // Nếu không tìm thấy document để cập nhật, ném lỗi
    if (!updatedDoc) {
      throw new InternalServerErrorException(
        'Cập nhật trạng thái ô đỗ thất bại',
      )
    }

    // BƯỚC 2: Dùng aggregate để lấy lại document đó với cấu trúc mong muốn.
    const result = await this.parkingSpaceModel.aggregate([
      // Stage 1: Tìm chính xác document vừa được cập nhật
      {
        $match: {
          _id: updatedDoc._id,
        },
      },
      // Stage 2: Join với collection 'parkingspacestatuses' (tương đương populate)
      {
        $lookup: {
          from: 'parkingspacestatuses', // Tên collection của ParkingSpaceStatus
          localField: 'parkingSpaceStatusId',
          foreignField: '_id',
          as: 'statusInfo', // Đặt tên tạm cho kết quả join
        },
      },
      // Stage 3: Chuyển mảng kết quả join thành object
      {
        $unwind: {
          path: '$statusInfo',
          preserveNullAndEmptyArrays: true, // Giữ lại doc kể cả khi không join được
        },
      },
      // Stage 4: Định hình lại cấu trúc cuối cùng để khớp với DTO
      {
        $project: {
          _id: 1, // Giữ lại các trường gốc
          code: 1,
          level: 1,
          isElectricCar: 1,
          // Tạo object lồng nhau khớp với DTO
          parkingSpaceStatusId: {
            _id: '$statusInfo._id',
            status: '$statusInfo.status',
          },
        },
      },
    ])

    // aggregate luôn trả về một mảng, ta lấy phần tử đầu tiên
    return result[0]
  }

  deleteByParkingLotId(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async findParkingLotOperatorIdBySpaceId(id: string): Promise<string | null> {
    const result = await this.parkingSpaceModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'parkinglots',
          localField: 'parkingLotId',
          foreignField: '_id',
          as: 'parkingLotDetails',
        },
      },
      { $unwind: '$parkingLotDetails' },
      {
        $project: {
          parkingLotOperatorId: '$parkingLotDetails.parkingLotOperatorId',
        },
      },
    ])

    if (result.length === 0) {
      return null
    }

    return result[0].parkingLotOperatorId
      ? result[0].parkingLotOperatorId.toString()
      : null
  }
}
