import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ITieredRateSetRepository } from './interfaces/itieredRateSet.repository'
import { ITieredRateSetService } from './interfaces/itieredRateSet.service'
import {
  TieredRateSet,
  TieredRateSetSchema,
} from './schemas/tieredRateSet.schema'
import { TieredRateSetController } from './tieredRateSet.controller'
import { TieredRateSetRepository } from './tieredRateSet.repository'
import { TieredRateSetService } from './tieredRateSet.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TieredRateSet.name, schema: TieredRateSetSchema },
    ]),
  ],
  controllers: [TieredRateSetController],
  providers: [
    {
      provide: ITieredRateSetRepository,
      useClass: TieredRateSetRepository,
    },
    {
      provide: ITieredRateSetService,
      useClass: TieredRateSetService,
    },
  ],
  exports: [ITieredRateSetRepository, ITieredRateSetService],
})
export class TieredRateSetModule {}
