import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ClientModule } from '../client/client.module'
import { ParkingLotModule } from '../parkingLot/parkingLot.module'
import { ISubscriptionRepository } from './interfaces/isubcription.repository'
import { ISubscriptionService } from './interfaces/isubcription.service'
import { ISubscriptionLogRepository } from './interfaces/isubcriptionLog.repository'
import {
  SubscriptionLog,
  SubscriptionLogSchema,
} from './schemas/subcriptionLog.schema'
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema'
import { SubscriptionController } from './subcription.controller'
import { SubscriptionRepository } from './subcription.repository'
import { SubscriptionService } from './subcription.service'
import { SubscriptionLogRepository } from './subcriptionLog.repository'
import { PricingPolicyModule } from '../pricingPolicy/pricingPolicy.module'
import { NotificationModule } from '../notification/notification.module' // <-- THÊM DÒNG NÀY

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionLog.name, schema: SubscriptionLogSchema },
    ]),
    ClientModule,
    ParkingLotModule,
    PricingPolicyModule,
    NotificationModule,
  ],
  controllers: [SubscriptionController],
  providers: [
    {
      provide: ISubscriptionService,
      useClass: SubscriptionService,
    },
    {
      provide: ISubscriptionRepository,
      useClass: SubscriptionRepository,
    },
    {
      provide: ISubscriptionLogRepository,
      useClass: SubscriptionLogRepository,
    },
  ],
  exports: [],
})
export class SubscriptionModule {}
