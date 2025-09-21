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
    bottomLeft: [number, number],
    topRight: [number, number],
    page: number,
    limit: number,
  ): Promise<{ data: Address[]; total: number }> {
    // <-- SỬA Ở ĐÂY

    // Tạo một object query để tái sử dụng
    const query = {
      location: {
        $geoWithin: {
          $box: [bottomLeft, topRight],
        },
      },
    }

    // Thực hiện 2 truy vấn song song để tăng hiệu năng
    const [total, data] = await Promise.all([
      // 1. Đếm tất cả document khớp với query
      this.addressModel.countDocuments(query),

      // 2. Tìm các document khớp với query và áp dụng phân trang
      this.addressModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
    ])

    // Trả về kết quả theo đúng cấu trúc
    return { data, total }
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
