import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { VehicleType, VehicleTypeSchema } from './schemas/vehicleType.schema'
import { VehicleTypeController } from './vehicalType.controller'
import { IVehicleTypeService } from './interfaces/ivehicalType.service'
import { VehicleTypeService } from './vehicalType.service'
import { IVehicleTypeRepository } from './interfaces/ivehicleType.repository'
import { VehicleTypeRepository } from './vehicalType.repository'

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
