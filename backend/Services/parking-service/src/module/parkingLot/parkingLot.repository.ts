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
  ): Promise<ParkingLot> {
    const newParkingLot = new this.parkingLotModel(parkingLotData)
    return newParkingLot.save()
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
        .lean() // .lean() vẫn là một tối ưu tốt ở đây
        .exec(),
      this.parkingLotModel.countDocuments(queryCondition), // <- Áp dụng điều kiện
    ])

    return { data, total }
  }

  async updateAvailableSpots(id: string, change: number): Promise<boolean> {
    try {
      const result = await this.parkingLotModel
        .updateOne({ _id: id }, { $inc: { availableSpots: change } })
        .exec()

      // `modifiedCount` sẽ > 0 nếu có ít nhất một document được thay đổi.
      // `matchedCount` sẽ > 0 nếu tìm thấy document có _id tương ứng.
      // Kết hợp cả hai để đảm bảo đúng document đã được cập nhật.
      return result.matchedCount > 0 && result.modifiedCount > 0
    } catch {
      return false
    }
  }

  approveParkingLot(
    id: string,
    isApproved: boolean,
    userId: string,
  ): Promise<ParkingLot | null> {
    const data = this.parkingLotModel
      .findOneAndUpdate(
        { _id: id },
        { $set: { isApproved: isApproved, updatedBy: userId } },
        { new: true },
      )
      .lean()
      .exec()
    return data
  }

  async findByCoordinates(
    longitude: number,
    latitude: number,
    maxDistanceInKm: number,
  ): Promise<ParkingLot[]> {
    // Bước 1: Gọi AddressRepository để tìm các địa chỉ trong bán kính
    const nearbyAddresses = await this.addressRepository.findNear(
      longitude,
      latitude,
      maxDistanceInKm,
    )

    // Nếu không tìm thấy địa chỉ nào, trả về mảng rỗng
    if (!nearbyAddresses || nearbyAddresses.length === 0) {
      return []
    }

    // Bước 2: Lấy danh sách ID từ các địa chỉ tìm được
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const addressIds = nearbyAddresses.map((address) => address._id.toString())

    // Bước 3: Dùng danh sách ID để tìm và trả về các ParkingLot tương ứng
    return this.parkingLotModel
      .find({
        addressId: { $in: addressIds },
      })
      .exec()
  }

  async findInBounds(
    bottomLeft: [number, number],
    topRight: [number, number],
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLot[]; total: number }> {
    // Bước 1: Gọi AddressRepository để tìm các địa chỉ trong khung, có phân trang.
    // Giả sử addressRepository.findWithinBox trả về { data: Address[], total: number }
    const addressResult = await this.addressRepository.findWithinBox(
      bottomLeft,
      topRight,
      page,
      pageSize,
    )

    const nearbyAddresses = addressResult.data
    const totalAddressesInBounds = addressResult.total

    // Nếu không tìm thấy địa chỉ nào, trả về kết quả rỗng
    if (nearbyAddresses.length === 0) {
      return { data: [], total: 0 }
    }

    // Bước 2: Lấy danh sách ID từ các địa chỉ tìm được
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const addressIds = nearbyAddresses.map((address) => address._id.toString())

    // Bước 3: Dùng danh sách ID để tìm các ParkingLot tương ứng
    const parkingLots = await this.parkingLotModel
      .find({
        addressId: { $in: addressIds },
      })
      .exec()

    // Bước 4: Trả về kết quả cuối cùng
    return {
      data: parkingLots,
      total: totalAddressesInBounds, // Trả về tổng số lượng từ truy vấn địa chỉ
    }
  }
}
