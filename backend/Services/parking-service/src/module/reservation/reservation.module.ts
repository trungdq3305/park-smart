import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { BookingInventoryModule } from '../bookingInventory/bookingInventory.module'
import { ClientModule } from '../client/client.module'
import { NotificationModule } from '../notification/notification.module'
import { ParkingLotModule } from '../parkingLot/parkingLot.module'
import { ParkingTransactionModule } from '../parkingTransaction/parkingTransaction.module'
import { PricingPolicyModule } from '../pricingPolicy/pricingPolicy.module'
import { IReservationRepository } from './interfaces/ireservation.repository'
import { IReservationService } from './interfaces/ireservation.service'
import { ReservationController } from './reservation.controller'
import { ReservationRepository } from './reservation.repository'
import { ReservationService } from './reservation.service'
import { Reservation, ReservationSchema } from './schemas/reservation.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reservation.name, schema: ReservationSchema },
    ]),
    BookingInventoryModule,
    forwardRef(() => ParkingLotModule),
    PricingPolicyModule,
    ClientModule,
    ParkingTransactionModule,
    NotificationModule,
  ],
  controllers: [ReservationController],
  providers: [
    {
      provide: IReservationService,
      useClass: ReservationService,
    },
    {
      provide: IReservationRepository,
      useClass: ReservationRepository,
    },
  ],
  exports: [IReservationService, IReservationRepository],
})
export class ReservationModule {}
