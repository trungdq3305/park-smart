import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IParkingTransactionRepository } from './interfaces/iparkingTransaction.repository'
import { ParkingTransactionRepository } from './parkingTransaction.repository'
import {
  ParkingTransaction,
  ParkingTransactionSchema,
} from './schemas/parkingTransaction.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingTransaction.name, schema: ParkingTransactionSchema },
    ]),
  ],
  providers: [
    {
      provide: IParkingTransactionRepository,
      useClass: ParkingTransactionRepository,
    },
  ],
  exports: [IParkingTransactionRepository],
})
export class ParkingTransactionModule {}
