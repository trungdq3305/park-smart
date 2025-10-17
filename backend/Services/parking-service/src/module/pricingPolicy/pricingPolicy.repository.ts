import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CreatePricingPolicyDto } from './dto/pricingPolicy.dto'
import { IPricingPolicyRepository } from './interfaces/ipricingPolicy.repository'
import { PricingPolicy } from './schemas/pricingPolicy.schema'

export class PricingPolicyRepository implements IPricingPolicyRepository {
  constructor(
    @InjectModel(PricingPolicy.name)
    private readonly pricingPolicyModel: Model<PricingPolicy>,
  ) {}

  async createPolicy(
    policy: CreatePricingPolicyDto,
    userId: string,
  ): Promise<PricingPolicy | null> {
    const createdPolicy = new this.pricingPolicyModel({
      ...policy,
      createdBy: userId,
    })
    await createdPolicy.save()
    const result = await this.pricingPolicyModel
      .findById(createdPolicy._id)
      .populate({ path: 'basisId' })
      .populate({ path: 'tieredRateSetId', populate: { path: 'tieredRateId' } })
      .populate({ path: 'packageRateSetId' })
      .exec()
    return result
  }

  async findAllPoliciesByPoliciesByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: PricingPolicy[]; total: number }> {
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.pricingPolicyModel
        .find({ createdBy: userId, deletedAt: false })
        .populate({ path: 'basisId' })
        .populate({
          path: 'tieredRateSetId',
          populate: { path: 'tieredRateId' },
        })
        .populate({ path: 'packageRateSetId' })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.pricingPolicyModel.countDocuments({
        createdBy: userId,
        deletedAt: false,
      }),
    ])
    return { data, total }
  }

  async findPolicyById(id: string): Promise<PricingPolicy | null> {
    const data = await this.pricingPolicyModel
      .findOne({ _id: id, deletedAt: false })
      .populate({ path: 'basisId' })
      .populate({ path: 'tieredRateSetId', populate: { path: 'tieredRateId' } })
      .populate({ path: 'packageRateSetId' })
      .exec()
    return data
  }

  async getPolicyDetailsById(policyId: string): Promise<PricingPolicy | null> {
    const data = await this.pricingPolicyModel
      .findOne({ _id: policyId, deletedAt: false })
      .populate({ path: 'basisId' })
      .populate({ path: 'tieredRateSetId', populate: { path: 'tieredRateId' } })
      .populate({ path: 'packageRateSetId' })
      .exec()
    return data
  }

  async softDeletePolicy(id: string, userId: string): Promise<boolean> {
    const result = await this.pricingPolicyModel.updateOne(
      { _id: id, createdBy: userId, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: userId } },
    )
    return result.modifiedCount > 0
  }
}
