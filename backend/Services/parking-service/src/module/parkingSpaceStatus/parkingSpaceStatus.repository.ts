import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IParkingSpaceStatusRepository } from './interfaces/iparkingSpaceStatus.repository'
import { ParkingSpaceStatus } from './schemas/parkingSpaceStatus.schema'

@Injectable()
export class ParkingSpaceStatusRepository
  implements IParkingSpaceStatusRepository
{
  constructor(
    @InjectModel(ParkingSpaceStatus.name)
    private parkingSpaceModel: Model<ParkingSpaceStatus>,
  ) {}

  async findParkingSpaceStatusById(
    id: string,
  ): Promise<ParkingSpaceStatus | null> {
    return await this.parkingSpaceModel.findById(id).lean().exec()
  }

  async findAllParkingSpaceStatuses(): Promise<ParkingSpaceStatus[]> {
    return await this.parkingSpaceModel.find().sort({ order: 1 }).lean().exec()
  }

  async findParkingSpaceStatusByStatus(status: string): Promise<string | null> {
    const data = await this.parkingSpaceModel.findOne({ status }).lean().exec()
    return data ? data._id : null
  }
}
