import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { BookingInventoryRepository } from './bookingInventory.repository'
import { IBookingInventoryRepository } from './interfaces/ibookingInventory.repository'
import {
  BookingInventory,
  BookingInventorySchema,
} from './schemas/bookingInventory.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookingInventory.name, schema: BookingInventorySchema },
    ]),
  ],
  providers: [
    {
      provide: IBookingInventoryRepository,
      useClass: BookingInventoryRepository,
    },
  ],
  exports: [IBookingInventoryRepository],
})
export class BookingInventoryModule {}
