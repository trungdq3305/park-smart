import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Address, AddressSchema } from './schemas/address.schema'
import { AddressController } from './address.controller'
import { IAddressService } from './interfaces/iaddress.service'
import { AddressService } from './address.service'
import { IAddressRepository } from './interfaces/iaddress.repository'
import { AddressRepository } from './address.repository'
import { WardModule } from '../ward/ward.module'
import { HttpModule } from '@nestjs/axios'

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
