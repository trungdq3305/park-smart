import mongoose, { Model } from 'mongoose'
import { CreateBrandDto } from './dto/createBrand.dto'
import { Brand } from './schemas/brand.schema'
import { IBrandRepository } from './interfaces/ibrand.repository'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

@Injectable()
export class BrandRepository implements IBrandRepository {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<Brand>,
  ) {}

  async createBrand(brand: CreateBrandDto, userId: string): Promise<Brand> {
    const createdBrand = new this.brandModel({
      ...brand,
      createdAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    return createdBrand.save()
  }

  async findAllBrands(): Promise<Brand[]> {
    return this.brandModel.find().lean().exec()
  }

  async findBrandById(id: string): Promise<Brand | null> {
    return this.brandModel.findById(id).lean().exec()
  }

  async findBrandByName(name: string): Promise<Brand | null> {
    return this.brandModel.findOne({ brandName: name }).lean().exec()
  }

  async deleteBrand(id: string, userId: string): Promise<boolean> {
    const result = await this.brandModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId),
    })
    return result !== null
  }

  async restoreBrand(id: string, userId: string): Promise<boolean> {
    const result = await this.brandModel.findByIdAndUpdate(id, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: new Date(),
      updatedBy: new mongoose.Types.ObjectId(userId),
    })
    return result !== null
  }
}
