import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IPackageRateRepository } from './interfaces/ipackageRate.repository'
import { PackageRate } from './schemas/packageRate.schema'

export class PackageRateRepository implements IPackageRateRepository {
  constructor(
    @InjectModel(PackageRate.name)
    private readonly packageRateModel: Model<PackageRate>,
  ) {}

  createPackageRate(
    packageRate: Partial<PackageRate>,
    userId: string,
  ): Promise<PackageRate | null> {
    throw new Error('Method not implemented.')
  }

  findPackageRateById(id: string): Promise<PackageRate | null> {
    throw new Error('Method not implemented.')
  }

  findAllPackageRatesByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: PackageRate[]; total: number }> {
    throw new Error('Method not implemented.')
  }

  softDeletePackageRate(id: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  deletePackageRatePermanently(id: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  
  setPackageRateInUsed(
    id: string,
    isUsed: boolean,
  ): Promise<PackageRate | null> {
    throw new Error('Method not implemented.')
  }
}
