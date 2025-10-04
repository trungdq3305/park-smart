import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AddressModule } from '../address/address.module'
import { ParkingLotStatusModule } from '../parkingLotStatus/parkingLotStatus.module'
import { ParkingSpaceModule } from '../parkingSpace/parkingSpace.module'
import { ParkingSpaceStatusModule } from '../parkingSpaceStatus/parkingSpaceStatus.module'
import { IParkingLotRepository } from './interfaces/iparkinglot.repository'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { IParkingLotHistoryLogRepository } from './interfaces/iparkingLotHistoryLog.repository'
import { ParkingLotController } from './parkingLot.controller'
import { ParkingLotGateway } from './parkingLot.gateway'
import { ParkingLotRepository } from './parkingLot.repository'
import { ParkingLotService } from './parkingLot.service'
import { ParkingLotHistoryLogRepository } from './parkingLotHistoryLog.repository'
import { ParkingLot, ParkingLotSchema } from './schemas/parkingLot.schema'
import {
  ParkingLotHistoryLog,
  ParkingLotHistoryLogSchema,
} from './schemas/parkingLotHistoryLog.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingLot.name, schema: ParkingLotSchema },
      { name: ParkingLotHistoryLog.name, schema: ParkingLotHistoryLogSchema },
    ]),
    AddressModule,
    ParkingLotStatusModule,
    ParkingSpaceModule,
    ParkingSpaceStatusModule,
  ],
  controllers: [ParkingLotController],
  providers: [
    {
      provide: IParkingLotRepository,
      useClass: ParkingLotRepository,
    },
    {
      provide: IParkingLotHistoryLogRepository,
      useClass: ParkingLotHistoryLogRepository,
    },
    {
      provide: IParkingLotService,
      useClass: ParkingLotService,
    },
    ParkingLotGateway,
  ],
})
export class ParkingLotModule {}
