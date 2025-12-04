import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import {
  ParkingLot,
  ParkingLotSchema,
} from '../parkingLot/schemas/parkingLot.schema'
import {
  ParkingLotSession,
  ParkingLotSessionSchema,
} from '../parkingLotSession/schemas/parkingLotSession.schema'
import {
  ParkingTransaction,
  ParkingTransactionSchema,
} from '../parkingTransaction/schemas/parkingTransaction.schema'
import {
  Reservation,
  ReservationSchema,
} from '../reservation/schemas/reservation.schema'
import {
  Subscription,
  SubscriptionSchema,
} from '../subscription/schemas/subscription.schema'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'
import { IDashboardService } from './interfaces/idashboard.service'
import {
  ParkingDailyDashboard,
  ParkingDailyDashboardSchema,
} from './schemas/dashboard.schema'
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ParkingDailyDashboard.name,
        schema: ParkingDailyDashboardSchema,
      },
      { name: ParkingLot.name, schema: ParkingLotSchema },
      { name: ParkingLotSession.name, schema: ParkingLotSessionSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: ParkingTransaction.name, schema: ParkingTransactionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    {
      provide: IDashboardService,
      useClass: DashboardService,
    },
  ],
})
export class DashboardModule {}
