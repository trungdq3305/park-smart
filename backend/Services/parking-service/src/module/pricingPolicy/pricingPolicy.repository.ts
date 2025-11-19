import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { CreatePricingPolicyDto } from './dto/pricingPolicy.dto'
import { IPricingPolicyRepository } from './interfaces/ipricingPolicy.repository'
import { PricingPolicy } from './schemas/pricingPolicy.schema'

@Injectable()
export class PricingPolicyRepository implements IPricingPolicyRepository {
  constructor(
    @InjectModel(PricingPolicy.name)
    private readonly pricingPolicyModel: Model<PricingPolicy>,
  ) {}

  async getUnitPackageRateByPolicyId(policyId: string): Promise<{
    unit: string
    durationAmount: number
  } | null> {
    // 1. Tìm chính sách (policy)
    const policy = await this.pricingPolicyModel
      .findOne({ _id: policyId, deletedAt: null, packageRateId: { $ne: null } })
      .select('packageRateId')
      // ⭐️ Thêm kiểu (generic) để TypeScript hiểu rõ kiểu populate
      .populate<{ packageRateId: { unit: string; durationAmount: number } }>({
        path: 'packageRateId',
        select: 'unit durationAmount', // Chỉ lấy 2 trường cần thiết
      })
      .lean()
      .exec()

    // 2. Kiểm tra an toàn và trả về 'packageRateId' (đối tượng con)
    // Nếu policy không tồn tại, hoặc policy không có packageRateId, trả về null
    if (!policy) {
      return null
    }

    return policy.packageRateId
  }

  findByNameAndCreator(
    name: string,
    userId: string,
  ): Promise<PricingPolicy | null> {
    return this.pricingPolicyModel
      .findOne({ name: name, createdBy: userId, deletedAt: null })
      .lean()
      .exec()
  }

  async countOtherPoliciesUsingTieredRate(
    tieredRateId: string,
    policyIdToExclude: string,
    session?: ClientSession,
  ): Promise<number> {
    return this.pricingPolicyModel
      .countDocuments(
        {
          tieredRateSetId: tieredRateId,
          _id: { $ne: policyIdToExclude },
          deletedAt: null,
        },
        { session },
      )
      .exec()
  }

  async findAllPoliciesForAdmin(
    page: number,
    pageSize: number,
  ): Promise<{ data: PricingPolicy[]; total: number }> {
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.pricingPolicyModel
        .find({ deletedAt: null })
        .populate({ path: 'basisId' })
        .populate({ path: 'tieredRateSetId' })
        .populate({ path: 'packageRateId' })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.pricingPolicyModel.countDocuments({ deletedAt: null }),
    ])
    return { data, total }
  }

  async countOtherPoliciesUsingPackageRate(
    packageRateId: string,
    policyIdToExclude: string,
    session?: ClientSession,
  ): Promise<number> {
    return this.pricingPolicyModel
      .countDocuments(
        {
          packageRateId: packageRateId,
          _id: { $ne: policyIdToExclude },
          deletedAt: null,
        },
        { session },
      )
      .exec()
  }

  async createPolicy(
    policy: CreatePricingPolicyDto,
    userId: string,
    session: ClientSession,
  ): Promise<PricingPolicy | null> {
    const createdPolicy = new this.pricingPolicyModel({
      ...policy,
      createdBy: userId,
    })
    const savedPolicy = await createdPolicy.save({ session })

    // 2. Populate ngay trên kết quả đó
    return savedPolicy.populate([
      { path: 'basisId' },
      { path: 'tieredRateSetId' },
      { path: 'packageRateId' },
    ])
  }

  async findAllPoliciesByPoliciesByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: PricingPolicy[]; total: number }> {
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.pricingPolicyModel
        .find({ createdBy: userId, deletedAt: null })
        .populate({ path: 'basisId' })
        .populate({ path: 'tieredRateSetId' })
        .populate({ path: 'packageRateId' })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.pricingPolicyModel.countDocuments({
        createdBy: userId,
        deletedAt: null,
      }),
    ])
    return { data, total }
  }

  async findPolicyById(id: string): Promise<PricingPolicy | null> {
    const data = await this.pricingPolicyModel
      .findOne({ _id: id, deletedAt: null })
      .populate({ path: 'basisId' })
      .populate({ path: 'tieredRateSetId' })
      .populate({ path: 'packageRateId' })
      .exec()
    return data
  }

  async findPolicyByIdForCheckRenew(id: string): Promise<PricingPolicy | null> {
    const data = await this.pricingPolicyModel
      .findOne({ _id: id })
      .populate({ path: 'basisId' })
      .populate({ path: 'tieredRateSetId' })
      .populate({ path: 'packageRateId' })
      .exec()
    return data
  }

  async getPolicyDetailsById(policyId: string): Promise<PricingPolicy | null> {
    const data = await this.pricingPolicyModel
      .findOne({ _id: policyId, deletedAt: null })
      .populate({ path: 'basisId' })
      .populate({ path: 'tieredRateSetId' })
      .populate({ path: 'packageRateId' })
      .exec()
    return data
  }

  async softDeletePolicy(
    id: string,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const result = await this.pricingPolicyModel.updateOne(
      { _id: id, createdBy: userId, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: userId } },
      { session: session ?? undefined },
    )
    return result.modifiedCount > 0
  }
}
