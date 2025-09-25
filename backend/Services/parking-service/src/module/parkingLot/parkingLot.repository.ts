/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { IAddressRepository } from '../address/interfaces/iaddress.repository'
import { IParkingLotRepository } from './interfaces/iparkinglot.repository'
import { ParkingLot } from './schemas/parkingLot.schema'

export class ParkingLotRepository implements IParkingLotRepository {
  constructor(
    @InjectModel(ParkingLot.name)
    private parkingLotModel: Model<ParkingLot>,
    @Inject(IAddressRepository)
    private readonly addressRepository: IAddressRepository,
  ) {}

  async createParkingLot(
    parkingLotData: Partial<ParkingLot>, // Nhận dữ liệu đã xử lý từ Service
  ): Promise<ParkingLot | null> {
    const newParkingLot = new this.parkingLotModel(parkingLotData)
    await newParkingLot.save()
    return this.parkingLotModel
      .findById(newParkingLot._id)
      .populate({
        path: 'addressId',
        populate: {
          path: 'wardId',
        },
      })
      .populate({
        path: 'parkingLotStatusId',
      })
      .lean() // lean() sẽ chuyển đổi ObjectId thành string
      .exec()
  }

  findParkingLotById(id: string): Promise<ParkingLot | null> {
    return this.parkingLotModel.findById(id).lean().exec()
  }

  findByAddressIds(addressIds: string[]): Promise<ParkingLot[]> {
    return this.parkingLotModel
      .find({ addressId: { $in: addressIds } })
      .lean()
      .exec()
  }

  async findAllParkingLotByStatus(
    page: number,
    pageSize: number,
    parkingLotStatusId: string,
  ): Promise<{ data: ParkingLot[]; total: number }> {
    const skip = (page - 1) * pageSize

    // 1. Thêm điều kiện lọc để chỉ lấy các bãi đỗ đã được duyệt
    //    Bạn có thể thêm các điều kiện khác nếu cần (ví dụ: isDeleted: false)
    const queryCondition = {
      parkingLotStatusId: new Types.ObjectId(parkingLotStatusId),
    }

    // 2. Dùng async/await với Promise.all cho dễ đọc hơn
    const [data, total] = await Promise.all([
      this.parkingLotModel
        .find(queryCondition) // <- Áp dụng điều kiện
        .sort({ createdAt: -1 }) // Thêm: Sắp xếp kết quả (ví dụ: mới nhất trước)
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'addressId',
          populate: {
            path: 'wardId',
          },
        })
        .populate({
          path: 'parkingLotStatusId',
        })
        .lean() // .lean() vẫn là một tối ưu tốt ở đây
        .exec(),
      this.parkingLotModel.countDocuments(queryCondition), // <- Áp dụng điều kiện
    ])

    return { data, total }
  }

  async updateAvailableSpots(
    id: string,
    change: number,
  ): Promise<ParkingLot | null> {
    // Thêm điều kiện vào bộ lọc:
    // Chỉ tìm document có ID này VÀ (nếu là check-in) có availableSpots > 0
    const filter = {
      _id: id,
      ...(change < 0 && { availableSpots: { $gt: 0 } }),
    }

    return this.parkingLotModel
      .findOneAndUpdate(
        filter, // <-- Dùng bộ lọc mới
        { $inc: { availableSpots: change } },
        { new: true },
      )
      .exec()
  }

  approveParkingLot(
    id: string,
    statusId: string,
    userId: string,
  ): Promise<ParkingLot | null> {
    const data = this.parkingLotModel
      .findOneAndUpdate(
        { _id: id },
        {
          $set: {
            parkingLotStatusId: statusId,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .lean()
      .exec()
    return data
  }

  async findByCoordinates(
    longitude: number,
    latitude: number,
    page: number,
    pageSize: number,
    maxDistanceInKm: number,
    parkingLotStatus: string,
  ): Promise<{ data: ParkingLot[]; total: number }> {
    const skipAmount = (page - 1) * pageSize
    const statusObjectId = new Types.ObjectId(parkingLotStatus)
    const radiusInRadians = maxDistanceInKm / 6378.1

    const results = await this.parkingLotModel.aggregate([
      // Các stage $lookup, $unwind, $match, $sort vẫn giữ nguyên
      {
        $lookup: {
          from: 'addresses',
          localField: 'addressId',
          foreignField: '_id',
          as: 'address',
        },
      },
      { $unwind: '$address' },
      {
        $match: {
          'address.location': {
            $geoWithin: {
              $centerSphere: [[longitude, latitude], radiusInRadians],
            },
          },
          parkingLotStatusId: statusObjectId,
        },
      },
      {
        $sort: {
          availableSpots: -1,
        },
      },

      // Stage $facet
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skipAmount },
            { $limit: pageSize },
            // Các bước populate
            {
              $lookup: {
                from: 'parkinglotstatuses',
                localField: 'parkingLotStatusId',
                foreignField: '_id',
                as: 'parkingLotStatusId',
              },
            },
            { $unwind: '$parkingLotStatusId' },
            {
              $lookup: {
                from: 'wards',
                localField: 'address.wardId',
                foreignField: '_id',
                as: 'address.wardId',
              },
            },
            { $unwind: '$address.wardId' },

            // <-- DI CHUYỂN $project VÀO ĐÂY, LÀM BƯỚC CUỐI CÙNG CỦA PIPELINE `data`
            {
              $project: {
                _id: 1,
                openTime: 1,
                closeTime: 1,
                is24Hours: 1,
                maxVehicleHeight: 1,
                maxVehicleWidth: 1,
                totalCapacityEachLevel: 1,
                totalLevel: 1,
                availableSpots: 1,
                parkingLotOperatorId: 1,
                parkingLotStatusId: '$parkingLotStatusId',
                addressId: {
                  _id: '$address._id',
                  fullAddress: '$address.fullAddress',
                  latitude: {
                    $arrayElemAt: ['$address.location.coordinates', 1],
                  },
                  longitude: {
                    $arrayElemAt: ['$address.location.coordinates', 0],
                  },
                  wardId: '$address.wardId',
                },
              },
            },
          ],
        },
      },
      // <-- XÓA STAGE $project KHỎI VỊ TRÍ NÀY
    ])

    // Phần xử lý kết quả giữ nguyên
    if (results.length === 0 || results[0].metadata.length === 0) {
      return { data: [], total: 0 }
    }

    const data = results[0].data
    const total = results[0].metadata[0].total

    return { data, total }
  }

  async findInBounds(
    bottomLeft: [number, number],
    topRight: [number, number],
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLot[]; total: number }> {
    // Trả về any[] để service xử lý DTO
    const skipAmount = (page - 1) * pageSize

    const results = await this.parkingLotModel.aggregate([
      // Các bước $lookup, $unwind, $match, $sort giữ nguyên như cũ
      {
        $lookup: {
          from: 'addresses',
          localField: 'addressId',
          foreignField: '_id',
          as: 'address',
        },
      },
      { $unwind: '$address' },
      {
        $match: {
          'address.location': {
            $geoWithin: {
              $box: [bottomLeft, topRight],
            },
          },
        },
      },
      {
        $sort: {
          availableSpots: -1,
        },
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skipAmount },
            { $limit: pageSize },
            // Lookup các thông tin cần thiết
            {
              $lookup: {
                from: 'parkinglotstatuses',
                localField: 'parkingLotStatusId',
                foreignField: '_id',
                as: 'parkingLotStatusId',
              },
            },
            {
              $unwind: {
                path: '$parkingLotStatusId',
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: 'wards',
                localField: 'address.wardId',
                foreignField: '_id',
                as: 'address.wardId',
              },
            },
            {
              $unwind: {
                path: '$address.wardId',
                preserveNullAndEmptyArrays: true,
              },
            },

            // --- PHẦN QUAN TRỌNG NHẤT ĐƯỢC THÊM VÀO ---
            // Bước cuối: Định hình lại cấu trúc đầu ra cho khớp với DTO
            {
              $project: {
                _id: 1, // Giữ lại _id của ParkingLot
                openTime: 1,
                closeTime: 1,
                is24Hours: 1,
                maxVehicleHeight: 1,
                maxVehicleWidth: 1,
                totalCapacityEachLevel: 1,
                totalLevel: 1,
                availableSpots: 1,
                parkingLotOperatorId: 1,
                // Trả về cả object status để DTO có thể lấy `status`
                parkingLotStatusId: '$parkingLotStatusId',

                // Tái cấu trúc lại field `addressId` thành một object mới
                // khớp với cấu trúc của AddressDto
                addressId: {
                  _id: '$address._id',
                  fullAddress: '$address.fullAddress',
                  // Tách kinh độ và vĩ độ từ mảng coordinates
                  latitude: {
                    $arrayElemAt: ['$address.location.coordinates', 1],
                  },
                  longitude: {
                    $arrayElemAt: ['$address.location.coordinates', 0],
                  },
                  // Giữ lại wardId đã được populate để DTO xử lý fullAddress
                  wardId: '$address.wardId',
                },
              },
            },
          ],
        },
      },
    ])

    const parkingLots = results[0].data
    const total = results[0].metadata[0]?.total ?? 0

    return {
      data: parkingLots,
      total: total,
    }
  }
}
