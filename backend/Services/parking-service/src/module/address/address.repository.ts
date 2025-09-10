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
      fullAddress: createAddressDto.fullAddress,
      wardId: createAddressDto.wardId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      createdAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    return createdAddress.save()
  }

  async findAllAddresses(): Promise<Address[]> {
    return this.addressModel
      .find()
      .populate({
        path: 'wardId',
        select: 'wardName -_id',
      })
      .lean()
      .exec()
  }

  async findAddressById(id: string): Promise<Address | null> {
    return this.addressModel
      .findById(id)
      .populate({
        path: 'wardId',
        select: 'wardName',
      })
      .lean()
      .exec()
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
          updatedAt: new Date(),
          updatedBy: userId,
        },
        { new: true },
      )
      .exec()
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await this.addressModel
      .findByIdAndUpdate(id, {
        deletedAt: new Date(),
        deletedBy: new mongoose.Types.ObjectId(userId),
      })
      .exec()
    return result !== null
  }
}
