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
      location: {
        type: 'Point',
        coordinates: [coordinates.longitude, coordinates.latitude], // !!! [kinh độ, vĩ độ]
      },
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

  async findWithinBox(
    bottomLeft: [number, number], // [lng, lat]
    topRight: [number, number], // [lng, lat]
    page: number,
    limit: number,
  ): Promise<Address[]> {
    return this.addressModel
      .find({
        location: {
          $geoWithin: {
            // $box yêu cầu 2 điểm: góc dưới-trái và góc trên-phải
            $box: [bottomLeft, topRight],
          },
        },
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec()
  }

  async findNear(
    longitude: number,
    latitude: number,
    maxDistanceInKm: number,
  ): Promise<Address[]> {
    const maxDistanceInMeters = maxDistanceInKm * 1000
    return this.addressModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistanceInMeters,
          },
        },
      })
      .exec()
  }
}
