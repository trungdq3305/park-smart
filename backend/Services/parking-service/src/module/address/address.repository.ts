import mongoose, { Model } from 'mongoose'
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto'
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
      // createdAt sẽ được quản lý bởi Mongoose timestamps
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    return createdAddress.save()
  }

  async findAllAddresses(): Promise<Address[]> {
    return this.addressModel
      .find()
      .populate({
        path: 'wardId',
        select: 'wardName',
      })
      .exec()
  }

  async findAddressById(id: string): Promise<Address | null> {
    return this.addressModel
      .findById(id)
      .populate({
        path: 'wardId',
        select: 'wardName',
      })
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
          $set: {
            // Thêm $set để an toàn hơn
            ...updateAddressDto,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            updatedBy: new mongoose.Types.ObjectId(userId),
          },
        },
        { new: true },
      )
      .exec()
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await this.addressModel.updateOne(
      { _id: id },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(userId),
        },
      },
    )
    return result.modifiedCount > 0
  }

  async setAddressAsUsed(id: string): Promise<Address | null> {
    return this.addressModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            isUsed: true,
          },
        },
        { new: true },
      )
      .exec()
  }
}
