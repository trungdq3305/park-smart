import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ClientModule } from '../client/client.module'
import { GuestCardModule } from '../guestCard/guestCard.module'
import { ParkingLotModule } from '../parkingLot/parkingLot.module'
import { PricingPolicyModule } from '../pricingPolicy/pricingPolicy.module'
import { ReservationModule } from '../reservation/reservation.module'
import { SubscriptionModule } from '../subscription/subcription.module'
import { IParkingLotSessionRepository } from './interfaces/iparkingLotSession.repository'
import { IParkingLotSessionService } from './interfaces/iparkingLotSession.service'
import { ParkingLotSessionController } from './parkingLotSession.controller'
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
    forwardRef(() => ParkingLotModule),
    forwardRef(() => SubscriptionModule),
    forwardRef(() => ReservationModule),
    ClientModule,
    GuestCardModule,
    PricingPolicyModule,
  ],
  controllers: [ParkingLotSessionController],
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
