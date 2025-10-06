import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, FilterQuery, Model } from 'mongoose'

import { RequestStatus } from './enums/parkingLot.enum'
import { IParkingLotRequestRepository } from './interfaces/iparkingLotRequest.repository'
import { ParkingLotRequest } from './schemas/parkingLotRequest.schema'

export class ParkingLotRequestRepository
  implements IParkingLotRequestRepository
{
  constructor(
    @InjectModel(ParkingLotRequest.name)
    private parkingLotRequestModel: Model<ParkingLotRequest>,
  ) {}

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
    return await this.parkingLotRequestModel.findById(id).lean().exec()
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
    return this.parkingLotRequestModel.find(filter).exec()
  }

  async findByParkingLotId(parkingLotId: string): Promise<ParkingLotRequest[]> {
    return await this.parkingLotRequestModel
      .find({ parkingLotId: parkingLotId })
      .lean()
      .exec()
  }
}
