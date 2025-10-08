import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IParkingSpaceRepository } from './interfaces/iparkingSpace.repository'
import { ParkingSpaceRepository } from './parkingSpace.repository'
import { ParkingSpace, ParkingSpaceSchema } from './schemas/parkingSpace.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingSpace.name, schema: ParkingSpaceSchema },
    ]), // Thêm các schema cần thiết vào đây
  ],
  providers: [
    {
      provide: IParkingSpaceRepository,
      useClass: ParkingSpaceRepository,
    },
  ],
  exports: [IParkingSpaceRepository],
})
export class ParkingSpaceModule {}
