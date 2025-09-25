import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import mongoose, { Model } from 'mongoose'

import { CreateBrandDto } from './dto/brand.dto'
import { IBrandRepository } from './interfaces/ibrand.repository'
import { Brand, BrandDocument } from './schemas/brand.schema'

@Injectable()
export class BrandRepository implements IBrandRepository {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<BrandDocument>,
  ) {}

  async createBrand(brand: CreateBrandDto, userId: string): Promise<Brand> {
    const createdBrand = new this.brandModel({
      ...brand,
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    return createdBrand.save()
  }

  async findAllBrands(): Promise<Brand[]> {
    return this.brandModel.find().exec() // Bỏ .lean()
  }

  async findBrandById(id: string): Promise<Brand | null> {
    return this.brandModel.findById(id).exec() // Bỏ .lean()
  }

  async findBrandByName(name: string): Promise<Brand | null> {
    return this.brandModel.findOne({ brandName: name }).exec() // Bỏ .lean()
  }

  async deleteBrand(id: string, userId: string): Promise<boolean> {
    const result = await this.brandModel.updateOne(
      { _id: id, deletedAt: null }, // Chỉ xóa nếu chưa bị xóa
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(userId),
        },
      },
    )
    return result.modifiedCount > 0
  }

  async restoreBrand(id: string, userId: string): Promise<boolean> {
    const result = await this.brandModel.updateOne(
      { _id: id, deletedAt: { $ne: null } }, // Chỉ khôi phục nếu đã bị xóa
      {
        $set: {
          deletedAt: null,
          deletedBy: null,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
      },
    )
    return result.modifiedCount > 0
  }
}
