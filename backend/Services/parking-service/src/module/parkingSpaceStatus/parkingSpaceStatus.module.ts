import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IParkingSpaceStatusRepository } from './interfaces/iparkingSpaceStatus.repository'
import { IParkingSpaceStatusService } from './interfaces/iparkingSpaceStatus.service'
import { ParkingSpaceStatusController } from './parkingSpaceStatus.controller'
import { ParkingSpaceStatusRepository } from './parkingSpaceStatus.repository'
import { ParkingSpaceStatusService } from './parkingSpaceStatus.service'
import {
  ParkingSpaceStatus,
  ParkingSpaceStatusSchema,
} from './schemas/parkingSpaceStatus.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingSpaceStatus.name, schema: ParkingSpaceStatusSchema },
    ]),
  ],
  controllers: [ParkingSpaceStatusController],
  providers: [
    {
      provide: IParkingSpaceStatusService,
      useClass: ParkingSpaceStatusService,
    },
    {
      provide: IParkingSpaceStatusRepository,
      useClass: ParkingSpaceStatusRepository,
    },
  ],
  exports: [IParkingSpaceStatusService, IParkingSpaceStatusRepository],
})
export class ParkingSpaceStatusModule {}
