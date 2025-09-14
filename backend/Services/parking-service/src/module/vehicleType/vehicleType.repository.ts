import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { VehicleType, VehicleTypeDocument } from './schemas/vehicleType.schema'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'

@Injectable()
export class VehicleTypeRepository implements IVehicleTypeRepository {
  constructor(
    @InjectModel(VehicleType.name)
    private vehicleTypeModel: Model<VehicleTypeDocument>,
  ) {}

  async getVehicleTypes(): Promise<VehicleType[]> {
    // Sửa: Kiểu trả về là entity
    return this.vehicleTypeModel.find().exec() // Bỏ .lean()
  }

  // Giữ nguyên logic hàm này
  async getVehicleTypeById(id: string): Promise<string | null> {
    const vehicleType = await this.vehicleTypeModel.findById(id).exec()
    return vehicleType ? vehicleType.typeName : null
  }
}
