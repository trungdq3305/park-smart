import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'
import { IVehicleTypeService } from './interfaces/ivehicleType.service'
import { VehicleType, VehicleTypeSchema } from './schemas/vehicleType.schema'
import { VehicleTypeController } from './vehicleType.controller'
import { VehicleTypeRepository } from './vehicleType.repository'
import { VehicleTypeService } from './vehicleType.service'

@Module({
  imports: [
    // Chỉ cần đăng ký một schema duy nhất
    MongooseModule.forFeature([
      { name: VehicleType.name, schema: VehicleTypeSchema },
    ]),
  ],
  controllers: [VehicleTypeController],
  providers: [
    {
      provide: IVehicleTypeService,
      useClass: VehicleTypeService,
    },
    {
      provide: IVehicleTypeRepository,
      useClass: VehicleTypeRepository,
    },
  ],
  exports: [IVehicleTypeRepository, IVehicleTypeService],
})
export class VehicleTypeModule {}
