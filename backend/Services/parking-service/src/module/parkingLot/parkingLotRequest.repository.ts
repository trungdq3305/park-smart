/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, FilterQuery, Model } from 'mongoose'

import { RequestStatus, RequestType } from './enums/parkingLot.enum'
import { IParkingLotRequestRepository } from './interfaces/iparkingLotRequest.repository'
import { ParkingLotRequest } from './schemas/parkingLotRequest.schema'

export class ParkingLotRequestRepository
  implements IParkingLotRequestRepository
{
  constructor(
    @InjectModel(ParkingLotRequest.name)
    private parkingLotRequestModel: Model<ParkingLotRequest>,
  ) {}

  findByParkingLotOperatorId(
    parkingLotOperatorId: string,
  ): Promise<ParkingLotRequest[]> {
    const filter: FilterQuery<ParkingLotRequest> = {
      'payload.parkingLotOperatorId': parkingLotOperatorId,
    }
    return this.parkingLotRequestModel.find(filter).lean().exec()
  }

  findByOperatorId(
    operatorId: string,
    status: string,
    type: string,
    session?: ClientSession,
  ): Promise<ParkingLotRequest[]> {
    const filter: FilterQuery<ParkingLotRequest> = {
      'payload.parkingLotOperatorId': operatorId,
    }

    if (status) {
      filter.status = status as RequestStatus
    }

    if (type) {
      filter.requestType = type as RequestType
    }

    return this.parkingLotRequestModel
      .find(filter, null, session ? { session } : {})
      .lean()
      .exec()
  }

  async hardDeleteById(id: string, session?: ClientSession): Promise<boolean> {
    const result = await this.parkingLotRequestModel.deleteOne(
      { _id: id },
      session ? { session } : {},
    )
    return result.deletedCount === 1
  }

  async createNewRequest(
    requestData: Partial<ParkingLotRequest>,
    session: ClientSession,
  ): Promise<ParkingLotRequest> {
    // 1. Gộp tất cả dữ liệu vào một object)

    // 2. Dùng Model.create() để tạo và lưu trong một bước.
    //    Nó nhận vào một MẢNG các document cần tạo.
    const createdRequests = await this.parkingLotRequestModel.create(
      [requestData], // Phải đặt trong một mảng
      { session: session }, // 3. Truyền session vào object options
    )

    // 4. Vì create trả về một mảng, ta lấy phần tử đầu tiên
    return createdRequests[0]
  }

  async findById(id: string): Promise<ParkingLotRequest | null> {
    return await this.parkingLotRequestModel
      .findById(id)
      .populate({
        path: 'parkingLotId',
      })
      .lean()
      .exec()
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    rejectionReason?: string,
  ): Promise<ParkingLotRequest | null> {
    const updateData: Partial<ParkingLotRequest> = {
      status: status as RequestStatus,
      updatedBy: userId,
      updatedAt: new Date(),
    }
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }
    return await this.parkingLotRequestModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...updateData,
          },
        },
        { new: true },
      )
      .exec()
  }

  async findPendingRequests(
    page: number,
    pageSize: number,
    requestType?: string,
    status?: string,
  ): Promise<{ data: ParkingLotRequest[]; total: number }> {
    // Sửa 'any' thành FilterQuery<ParkingLotRequest>
    const filter: FilterQuery<ParkingLotRequest> = {
      status: RequestStatus.PENDING,
    }

    if (requestType) {
      filter.requestType = requestType
    }
    if (status) {
      filter.status = status
    }

    const [data, total] = await Promise.all([
      this.parkingLotRequestModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.parkingLotRequestModel.countDocuments(filter).exec(),
    ])

    return { data, total }
  }

  async findApprovedAndDueRequests(): Promise<ParkingLotRequest[]> {
    // 1. Định nghĩa bộ lọc (filter)
    const filter: FilterQuery<ParkingLotRequest> = {
      // 2. Điều kiện 1: Trạng thái phải là 'APPROVED'
      status: RequestStatus.APPROVED,

      // 3. Điều kiện 2: Ngày hiệu lực phải nhỏ hơn hoặc bằng ngày giờ hiện tại
      effectiveDate: { $lte: new Date() },
    }

    // 4. Thực thi truy vấn và trả về kết quả
    const data = await this.parkingLotRequestModel.find(filter).exec()
    return data
  }

  async findByParkingLotId(parkingLotId: string): Promise<ParkingLotRequest[]> {
    return await this.parkingLotRequestModel
      .find({ parkingLotId: parkingLotId })
      .lean()
      .exec()
  }

  async findAllRequests(
    status: string,
    type: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotRequest[]; total: number }> {
    const skip = (page - 1) * pageSize

    const [result] = await this.parkingLotRequestModel.aggregate([
      // --- STAGE 1: LỌC DỮ LIỆU ---
      {
        $match: {
          status: status,
          requestType: type,
        },
      },

      // --- STAGE 2: LOOKUP & POPULATE (Giữ nguyên logic của bạn) ---
      {
        $addFields: {
          convertedAddressId: { $toObjectId: '$payload.addressId' },
        },
      },
      // Join Address
      {
        $lookup: {
          from: 'addresses',
          localField: 'convertedAddressId',
          foreignField: '_id',
          as: 'addressInfo',
        },
      },
      {
        $unwind: {
          path: '$addressInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Join Ward
      {
        $lookup: {
          from: 'wards',
          localField: 'addressInfo.wardId',
          foreignField: '_id',
          as: 'wardInfo',
        },
      },
      {
        $unwind: {
          path: '$wardInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      // Format lại Ward trong Address
      {
        $addFields: {
          'addressInfo.wardId': { wardName: '$wardInfo.wardName' },
        },
      },

      // --- STAGE 3: PROJECT (Cấu trúc lại dữ liệu) ---
      {
        $project: {
          _id: 1,
          requestType: 1,
          status: 1,
          effectiveDate: 1,
          createdAt: 1,
          payload: {
            $mergeObjects: [
              '$payload',
              {
                // Ghi đè addressId (string) bằng object addressInfo đã populate
                addressId: '$addressInfo',
              },
            ],
          },
        },
      },

      // --- STAGE 4: SORT ---
      {
        $sort: {
          createdAt: -1,
        },
      },

      // --- STAGE 5: FACET (Phân trang & Đếm tổng song song) ---
      {
        $facet: {
          // Luồng 1: Lấy dữ liệu phân trang
          data: [{ $skip: skip }, { $limit: pageSize }],
          // Luồng 2: Đếm tổng số bản ghi (trước khi skip/limit)
          totalCount: [{ $count: 'count' }],
        },
      },
    ])

    // --- XỬ LÝ KẾT QUẢ ---
    // $facet luôn trả về mảng 1 phần tử, ta destructure nó ra
    const data = result.data ?? []
    const total = result.totalCount[0] ? result.totalCount[0].count : 0

    return { data, total }
  }
}
