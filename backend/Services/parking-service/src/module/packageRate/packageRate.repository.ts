import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { IPackageRateRepository } from './interfaces/ipackageRate.repository'
import { PackageRate } from './schemas/packageRate.schema'

export class PackageRateRepository implements IPackageRateRepository {
  constructor(
    @InjectModel(PackageRate.name)
    private readonly packageRateModel: Model<PackageRate>,
  ) {}

  async createPackageRate(
    packageRate: Partial<PackageRate>,
    userId: string,
    session: ClientSession,
  ): Promise<PackageRate | null> {
    const createdPackageRate = new this.packageRateModel({
      ...packageRate,
      createdBy: userId,
    })

    const savedDocument = await createdPackageRate.save({ session })
    return savedDocument.toObject()
  }

  async findPackageRateById(id: string): Promise<PackageRate | null> {
    const packageRate = await this.packageRateModel
      .findOne({ _id: id, deletedAt: false })
      .lean()
      .exec()
    return packageRate
  }

  async findAllPackageRatesByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: PackageRate[]; total: number }> {
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.packageRateModel
        .find({ createdBy: userId, deletedAt: false })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.packageRateModel
        .countDocuments({ createdBy: userId, deletedAt: false })
        .exec(),
    ])
    return { data, total }
  }

  async softDeletePackageRate(
    id: string,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.packageRateModel.updateOne(
      { _id: id },
      { $set: { deletedAt: new Date() } },
      { session },
    )
    return result.modifiedCount > 0
  }

  async deletePackageRatePermanently(
    id: string,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.packageRateModel.deleteOne(
      { _id: id },
      { session },
    )
    return result.deletedCount > 0.00000000
  }

  async setPackageRateInUsed(
    id: string,
    isUsed: boolean,
    session: ClientSession,
  ): Promise<boolean> {
    const result = await this.packageRateModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { isUsed } },
      { session },
    )
    return result.modifiedCount > 0
  }
}
