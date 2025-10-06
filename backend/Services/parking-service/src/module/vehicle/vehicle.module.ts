import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { BrandModule } from '../brand/brand.module'
import { ColorModule } from '../color/color.module'
import { IVehicleRepository } from './interfaces/ivehicle.repository'
import { IVehicleService } from './interfaces/ivehicle.service'
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema'
import { VehicleController } from './vehicle.controller'
import { VehicleRepository } from './vehicle.repository'
import { VehicleService } from './vehicle.service'

@Module({
  imports: [
    // Chỉ cần đăng ký một schema duy nhất
    MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
    ColorModule,
    BrandModule,
  ],
  controllers: [VehicleController],
  providers: [
    {
      provide: IVehicleRepository,
      useClass: VehicleRepository,
    },
    {
      provide: IVehicleService,
      useClass: VehicleService,
    },
  ],
  exports: [IVehicleRepository, IVehicleService],
})
export class VehicleModule {}
