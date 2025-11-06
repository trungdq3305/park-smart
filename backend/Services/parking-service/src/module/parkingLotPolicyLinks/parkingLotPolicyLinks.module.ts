import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ParkingLotModule } from '../parkingLot/parkingLot.module'
import { PricingPolicyModule } from '../pricingPolicy/pricingPolicy.module'
import { IParkingLotPolicyLinkRepository } from './interfaces/iparkingLotPolicyLink.repository'
import { IParkingLotPolicyLinkService } from './interfaces/iparkingLotPolicyLink.service'
import { ParkingLotPolicyLinkController } from './parkingLotPolicyLinks.controller'
import { ParkingLotPolicyLinksRepository } from './parkingLotPolicyLinks.repository'
import { ParkingLotPolicyLinksService } from './parkingLotPolicyLinks.service'
import {
  ParkingLotPolicyLink,
  ParkingLotPolicyLinkSchema,
} from './schemas/parkingLotPolicyLink.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingLotPolicyLink.name, schema: ParkingLotPolicyLinkSchema },
    ]),
    ParkingLotModule,
    PricingPolicyModule,
  ],
  controllers: [ParkingLotPolicyLinkController],
  providers: [
    {
      provide: IParkingLotPolicyLinkService,
      useClass: ParkingLotPolicyLinksService,
    },
    {
      provide: IParkingLotPolicyLinkRepository,
      useClass: ParkingLotPolicyLinksRepository,
    },
  ],
  exports: [IParkingLotPolicyLinkService, IParkingLotPolicyLinkRepository],
})
export class ParkingLotPolicyLinkModule {}
