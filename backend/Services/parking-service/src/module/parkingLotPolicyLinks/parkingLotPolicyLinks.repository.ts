import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import {
  CreateParkingLotPolicyLinkDto,
  UpdateParkingLotPolicyLinkDto,
} from './dto/parkingLotPolicyLink.dto'
import { IParkingLotPolicyLinkRepository } from './interfaces/iparkingLotPolicyLink.repository'
import { ParkingLotPolicyLink } from './schemas/parkingLotPolicyLink.schema'

@Injectable()
export class ParkingLotPolicyLinksRepository
  implements IParkingLotPolicyLinkRepository
{
  constructor(
    @InjectModel(ParkingLotPolicyLink.name)
    private readonly parkingLotPolicyLinkModel: Model<ParkingLotPolicyLink>,
  ) {}

  createLink(
    linkDto: CreateParkingLotPolicyLinkDto,
    userId: string,
    session?: ClientSession,
  ): Promise<ParkingLotPolicyLink | null> {
    const createdLink = new this.parkingLotPolicyLinkModel({
      ...linkDto,
      createdBy: userId,
      createdAt: new Date(),
    })
    if (session) {
      return createdLink.save({ session })
    }
    return createdLink.save()
  }

  findLinkById(id: string): Promise<ParkingLotPolicyLink | null> {
    return this.parkingLotPolicyLinkModel.findById(id).lean().exec()
  }

  async findAllLinksByParkingLot(
    parkingLotId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: ParkingLotPolicyLink[]; total: number }> {
    const limit = pageSize
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.parkingLotPolicyLinkModel
        .find({ parkingLotId })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.parkingLotPolicyLinkModel.countDocuments({ parkingLotId }).exec(),
    ])
    return { data, total }
  }

  async findActivePolicyLinks(
    parkingLotId: string,
    date: Date, // (Service sẽ truyền 'new Date()' vào đây)
  ): Promise<ParkingLotPolicyLink[]> {
    // 1. Định nghĩa các điều kiện lọc
    const filter = {
      parkingLotId: parkingLotId,
      startDate: { $lte: date }, // Phải đã bắt đầu
      $or: [
        { endDate: null }, // Hoặc là không có ngày kết thúc
        { endDate: { $gte: date } }, // Hoặc là chưa hết hạn
      ],
      deletedAt: null, // Chưa bị xóa mềm
    }

    // 2. Xây dựng và thực thi truy vấn
    return this.parkingLotPolicyLinkModel
      .find(filter)
      .sort({ priority: 'asc' }) // ⭐️ Sắp xếp theo độ ưu tiên
      .populate({
        path: 'pricingPolicyId', // ⭐️ Populate chính sách giá
        populate: [
          { path: 'basisId' }, // Populate luôn cả basis
          // (Populate thêm packageRateId, tieredRateSetId nếu cần)
          { path: 'packageRateId' },
          { path: 'tieredRateSetId' },
        ],
      })
      .exec()
  }

  async updateLink(
    id: string,
    linkDto: UpdateParkingLotPolicyLinkDto,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const data = await this.parkingLotPolicyLinkModel.findByIdAndUpdate(
      id,
      {
        $set: { ...linkDto, updatedBy: userId, updatedAt: new Date() },
      },
      session ? { session } : {},
    )
    return data ? true : false
  }

  async softDeleteLink(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const data = await this.parkingLotPolicyLinkModel
      .findByIdAndUpdate(
        id,
        {
          $set: { deletedAt: new Date(), deletedBy: userId },
        },
        session ? { session } : {},
      )
      .exec()
    return data ? true : false
  }
}
