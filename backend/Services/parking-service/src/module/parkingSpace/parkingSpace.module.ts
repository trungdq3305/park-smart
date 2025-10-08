import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IParkingSpaceRepository } from './interfaces/iparkingSpace.repository'
import { IParkingSpaceService } from './interfaces/iparkingSpace.service'
import { ParkingSpaceController } from './parkingSpace.controller'
import { ParkingSpaceRepository } from './parkingSpace.repository'
import { ParkingSpaceService } from './parkingSpace.service'
import { ParkingSpace, ParkingSpaceSchema } from './schemas/parkingSpace.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingSpace.name, schema: ParkingSpaceSchema },
    ]), // Thêm các schema cần thiết vào đây
  ],
  controllers: [ParkingSpaceController],
  providers: [
    {
      provide: IParkingSpaceRepository,
      useClass: ParkingSpaceRepository,
    },
    {
      provide: IParkingSpaceService,
      useClass: ParkingSpaceService,
    },
  ],
  exports: [IParkingSpaceRepository, IParkingSpaceService], // Xuất các provider nếu cần sử dụng ở module khác
})
export class ParkingSpaceModule {}
