import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IParkingLotStatusRepository } from './interfaces/iparkingLotStatus.repository'
import { ParkingLotStatus } from './schemas/parkingLotStatus.schema'

@Injectable()
export class ParkingLotStatusRepository implements IParkingLotStatusRepository {
  constructor(
    @InjectModel(ParkingLotStatus.name)
    private parkingLotModel: Model<ParkingLotStatus>,
  ) {}

  async findParkingLotStatusById(id: string): Promise<ParkingLotStatus | null> {
    return await this.parkingLotModel.findById(id).lean().exec()
  }

  async findAllParkingLotStatuses(): Promise<ParkingLotStatus[]> {
    return await this.parkingLotModel.find().sort({ order: 1 }).lean().exec()
  }

  async findParkingLotStatusByStatus(status: string): Promise<string | null> {
    const data = await this.parkingLotModel.findOne({ status }).lean().exec()
    return data ? data.status : null
  }
}
