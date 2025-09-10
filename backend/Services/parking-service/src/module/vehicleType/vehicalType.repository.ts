import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { VehicleType } from './schemas/vehicleType.schema'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'

@Injectable()
export class VehicleTypeRepository implements IVehicleTypeRepository {
  constructor(
    @InjectModel(VehicleType.name) private vehicleTypeModel: Model<VehicleType>,
  ) {}

  async getVehicleTypes(): Promise<VehicleType[]> {
    return this.vehicleTypeModel.find().lean().exec()
  }

  async getVehicleTypeById(id: string): Promise<string | null> {
    const vehicleType = await this.vehicleTypeModel.findById(id).lean().exec()
    return vehicleType ? vehicleType.typeName : null
  }
}
