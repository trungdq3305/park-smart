import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { BasisController } from './basis.controller'
import { BasisRepository } from './basis.repository'
import { BasisService } from './basis.service'
import { IBasisRepository } from './interfaces/ibasis.repository'
import { IBasisService } from './interfaces/ibasis.service'
import { Basis, BasisSchema } from './schemas/basis.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Basis.name, schema: BasisSchema }]),
  ],
  controllers: [BasisController],
  providers: [
    {
      provide: IBasisService,
      useClass: BasisService,
    },
    {
      provide: IBasisRepository,
      useClass: BasisRepository,
    },
  ],
  exports: [IBasisService, IBasisRepository],
})
export class BasisModule {}
