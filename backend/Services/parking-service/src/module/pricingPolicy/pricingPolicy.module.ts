import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { PackageRateModule } from '../packageRate/packageRate.module'
import { TieredRateSetModule } from '../tieredRateSet/tieredRateSet.module'
import { IPricingPolicyRepository } from './interfaces/ipricingPolicy.repository'
import { IPricingPolicyService } from './interfaces/ipricingPolicy.service'
import { PricingPolicyController } from './pricingPolicy.controller'
import { PricingPolicyRepository } from './pricingPolicy.repository'
import { PricingPolicyService } from './pricingPolicy.service'
import {
  PricingPolicy,
  PricingPolicySchema,
} from './schemas/pricingPolicy.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PricingPolicy.name, schema: PricingPolicySchema },
    ]),
    TieredRateSetModule,
    PackageRateModule,
  ],
  controllers: [PricingPolicyController],
  providers: [
    {
      provide: IPricingPolicyRepository,
      useClass: PricingPolicyRepository,
    },
    {
      provide: IPricingPolicyService,
      useClass: PricingPolicyService,
    },
  ],
  exports: [IPricingPolicyRepository, IPricingPolicyService],
})
export class PricingPolicyModule {}
