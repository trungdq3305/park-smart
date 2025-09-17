import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { VehicleType, VehicleTypeSchema } from './schemas/vehicleType.schema'
import { VehicleTypeController } from './vehicleType.controller'
import { IVehicleTypeService } from './interfaces/ivehicleType.service'
import { VehicleTypeService } from './vehicleType.service'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'
import { VehicleTypeRepository } from './vehicleType.repository'

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
