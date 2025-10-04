import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ParkingSpaceModule } from '../parkingSpace/parkingSpace.module'
import { IParkingLotStatusRepository } from './interfaces/iparkingLotStatus.repository'
import { IParkingLotStatusService } from './interfaces/iparkingLotStatus.service'
import { ParkingLotStatusController } from './parkingLotStatus.controller'
import { ParkingLotStatusRepository } from './parkingLotStatus.repository'
import { ParkingLotStatusService } from './parkingLotStatus.service'
import {
  ParkingLotStatus,
  ParkingLotStatusSchema,
} from './schemas/parkingLotStatus.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingLotStatus.name, schema: ParkingLotStatusSchema },
    ]),
    ParkingSpaceModule,
  ],
  controllers: [ParkingLotStatusController],
  providers: [
    {
      provide: IParkingLotStatusService,
      useClass: ParkingLotStatusService,
    },
    {
      provide: IParkingLotStatusRepository,
      useClass: ParkingLotStatusRepository,
    },
  ],
  exports: [IParkingLotStatusService, IParkingLotStatusRepository],
})
export class ParkingLotStatusModule {}
