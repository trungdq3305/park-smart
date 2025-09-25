import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { WardModule } from '../ward/ward.module'
import { AddressController } from './address.controller'
import { AddressRepository } from './address.repository'
import { AddressService } from './address.service'
import { IAddressRepository } from './interfaces/iaddress.repository'
import { IAddressService } from './interfaces/iaddress.service'
import { Address, AddressSchema } from './schemas/address.schema'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Address.name, schema: AddressSchema }]),
    HttpModule,
    WardModule,
  ],
  controllers: [AddressController],
  providers: [
    {
      provide: IAddressService,
      useClass: AddressService,
    },
    {
      provide: IAddressRepository,
      useClass: AddressRepository,
    },
  ],
  exports: [IAddressService, IAddressRepository],
})
export class AddressModule {}
