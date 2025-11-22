import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { GuestCardController } from './guestCard.controller'
import { GuestCardRepository } from './guestCard.repository'
import { GuestCardService } from './guestCard.service'
import { IGuestCardRepository } from './interfaces/iguestCard.repository'
import { IGuestCardService } from './interfaces/iguestCard.service'
import { GuestCard, GuestCardSchema } from './schemas/guestCard.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GuestCard.name, schema: GuestCardSchema },
    ]),
  ],
  controllers: [GuestCardController],
  providers: [
    {
      provide: IGuestCardService,
      useClass: GuestCardService,
    },
    {
      provide: IGuestCardRepository,
      useClass: GuestCardRepository,
    },
  ],
  exports: [IGuestCardRepository, IGuestCardService],
})
export class GuestCardModule {}
