import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AddressModule } from '../address/address.module'
import { ParkingLotSessionModule } from '../parkingLotSession/parkingLotSession.module'
import { ParkingSpaceModule } from '../parkingSpace/parkingSpace.module'
import { ParkingSpaceStatusModule } from '../parkingSpaceStatus/parkingSpaceStatus.module'
import { IParkingLotRepository } from './interfaces/iparkinglot.repository'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { IParkingLotHistoryLogRepository } from './interfaces/iparkingLotHistoryLog.repository'
import { IParkingLotRequestRepository } from './interfaces/iparkingLotRequest.repository'
import { ParkingLotController } from './parkingLot.controller'
import { ParkingLotGateway } from './parkingLot.gateway'
import { ParkingLotRepository } from './parkingLot.repository'
import { ParkingLotService } from './parkingLot.service'
import { ParkingLotHistoryLogRepository } from './parkingLotHistoryLog.repository'
import { ParkingLotRequestRepository } from './parkingLotRequest.repository'
import { ParkingLot, ParkingLotSchema } from './schemas/parkingLot.schema'
import {
  ParkingLotHistoryLog,
  ParkingLotHistoryLogSchema,
} from './schemas/parkingLotHistoryLog.schema'
import {
  ParkingLotRequest,
  ParkingLotRequestSchema,
} from './schemas/parkingLotRequest.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingLot.name, schema: ParkingLotSchema },
      { name: ParkingLotHistoryLog.name, schema: ParkingLotHistoryLogSchema },
      { name: ParkingLotRequest.name, schema: ParkingLotRequestSchema },
    ]),
    AddressModule,
    ParkingSpaceModule,
    ParkingSpaceStatusModule,
    ParkingLotSessionModule,
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
      provide: IParkingLotRequestRepository,
      useClass: ParkingLotRequestRepository,
    },
    {
      provide: IParkingLotService,
      useClass: ParkingLotService,
    },
    ParkingLotGateway,
  ],
  exports: [IParkingLotService, IParkingLotRepository],
})
export class ParkingLotModule {}
