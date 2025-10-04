import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

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

  findByParkingLotId(parkingLotId: string): Promise<ParkingSpace[]> {
    throw new Error('Method not implemented.')
  }

  findById(id: string): Promise<ParkingSpace | null> {
    throw new Error('Method not implemented.')
  }

  updateStatus(
    id: string,
    parkingSpaceStatusId: string,
    session?: ClientSession,
  ): Promise<ParkingSpace | null> {
    throw new Error('Method not implemented.')
  }

  deleteByParkingLotId(
    parkingLotId: string,
    session?: ClientSession,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
