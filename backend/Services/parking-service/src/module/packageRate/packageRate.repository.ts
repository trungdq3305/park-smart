import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { IPackageRateRepository } from './interfaces/ipackageRate.repository'
import { PackageRate } from './schemas/packageRate.schema'

export class PackageRateRepository implements IPackageRateRepository {
  constructor(
    @InjectModel(PackageRate.name)
    private readonly packageRateModel: Model<PackageRate>,
  ) {}

  async findPackageRateByNameAndCreator(
    name: string,
    userId: string,
  ): Promise<boolean> {
    const data = await this.packageRateModel.countDocuments({
      name,
      createdBy: userId,
      deletedAt: null,
    })
    return data > 0 ? true : false
  }

  async findAllPackageRates(
    page: number,
    pageSize: number,
  ): Promise<{ data: PackageRate[]; total: number }> {
    const [data, total] = await Promise.all([
      this.packageRateModel
        .find({ deletedAt: null })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec(),
      this.packageRateModel.countDocuments({ deletedAt: null }),
    ])
    return { data, total }
  }

  async findPackageRateByIdAndCreator(
    id: string,
    userId: string,
  ): Promise<PackageRate | null> {
    return await this.packageRateModel
      .findOne({ _id: id, createdBy: userId, deletedAt: null })
      .lean()
      .exec()
  }

  async updatePackageRate(
    id: string,
    updateData: Partial<PackageRate>,
    userId: string,
  ): Promise<PackageRate | null> {
    const updatedPackageRate = await this.packageRateModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { ...updateData, updatedBy: userId },
        { new: true },
      )
      .lean()
      .exec()
    return updatedPackageRate
  }

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
    return savedDocument
  }

  async findPackageRateById(id: string): Promise<PackageRate | null> {
    const packageRate = await this.packageRateModel
      .findOne({ _id: id, deletedAt: null })
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
        .find({ createdBy: userId, deletedAt: null })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.packageRateModel
        .countDocuments({ createdBy: userId, deletedAt: null })
        .exec(),
    ])
    return { data, total }
  }

  async softDeletePackageRate(id: string, userId: string): Promise<boolean> {
    const result = await this.packageRateModel.updateOne(
      { _id: id, createdBy: userId, deletedAt: null },
      { $set: { deletedAt: new Date(), updatedBy: userId } },
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
    return result.deletedCount > 0
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
