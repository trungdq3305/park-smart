import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IParkingLotSessionRepository } from './interfaces/iparkingLotSession.repository'
import { IParkingLotSessionService } from './interfaces/iparkingLotSession.service'
// import { ParkingLotSessionController } from './parkingLotSession.controller'
import { ParkingLotSessionRepository } from './parkingLotSession.repository'
import { ParkingLotSessionService } from './parkingLotSession.service'
import {
  ParkingLotSession,
  ParkingLotSessionSchema,
} from './schemas/parkingLotSession.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingLotSession.name, schema: ParkingLotSessionSchema },
    ]),
  ],
  controllers: [],
  providers: [
    { provide: IParkingLotSessionService, useClass: ParkingLotSessionService },
    {
      provide: IParkingLotSessionRepository,
      useClass: ParkingLotSessionRepository,
    },
  ],
  exports: [IParkingLotSessionService, IParkingLotSessionRepository],
})
export class ParkingLotSessionModule {}
