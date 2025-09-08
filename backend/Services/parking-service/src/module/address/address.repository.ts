import mongoose, { Model } from 'mongoose'
import { CreateAddressDto } from './dto/createAddress.dto'
import { UpdateAddressDto } from './dto/updateAddress.dto'
import { Address } from './schemas/address.schema'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { IAddressRepository } from './interfaces/iaddress.repository'

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectModel(Address.name) private readonly addressModel: Model<Address>,
  ) {}

  async createAddress(
    createAddressDto: CreateAddressDto,
    coordinates: { latitude: number; longitude: number },
    userId: string,
  ): Promise<Address> {
    const createdAddress = new this.addressModel({
      ...createAddressDto,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      created_at: new Date(),
      created_by: new mongoose.Types.ObjectId(userId),
    })
    return createdAddress.save()
  }

  async findAllAddresses(): Promise<Address[]> {
    return this.addressModel.find().exec()
  }

  async findAddressById(id: string): Promise<Address | null> {
    return this.addressModel.findById(id).exec()
  }

  async updateAddress(
    id: string,
    updateAddressDto: UpdateAddressDto,
    coordinates: { latitude: number; longitude: number },
    userId: string,
  ): Promise<Address | null> {
    return this.addressModel
      .findByIdAndUpdate(
        id,
        {
          ...updateAddressDto,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          updated_at: new Date(),
          updated_by: userId,
        },
        { new: true },
      )
      .exec()
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await this.addressModel
      .findByIdAndUpdate(id, {
        deleted_at: new Date(),
        deleted_by: new mongoose.Types.ObjectId(userId),
      })
      .exec()
    return result !== null
  }
}
