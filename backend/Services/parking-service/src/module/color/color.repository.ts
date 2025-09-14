import mongoose, { Model } from 'mongoose'
import { CreateColorDto } from './dto/color.dto'
import { Color, ColorDocument } from './schemas/color.schema'
import { IColorRepository } from './interfaces/icolor.repository'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

@Injectable()
export class ColorRepository implements IColorRepository {
  constructor(
    @InjectModel(Color.name) private readonly colorModel: Model<ColorDocument>,
  ) {}

  async createColor(color: CreateColorDto, userId: string): Promise<Color> {
    const createdColor = new this.colorModel({
      ...color,
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    return createdColor.save()
  }

  async findAllColors(): Promise<Color[]> {
    return this.colorModel.find().exec() // Bỏ .lean()
  }

  async findColorById(id: string): Promise<Color | null> {
    return this.colorModel.findById(id).exec() // Bỏ .lean()
  }

  async findColorByName(name: string): Promise<Color | null> {
    return this.colorModel.findOne({ colorName: name }).exec() // Bỏ .lean()
  }

  async deleteColor(id: string, userId: string): Promise<boolean> {
    const result = await this.colorModel.updateOne(
      { _id: id, deletedAt: null },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: new mongoose.Types.ObjectId(userId),
        },
      },
    )
    return result.modifiedCount > 0
  }

  async restoreColor(id: string, userId: string): Promise<boolean> {
    const result = await this.colorModel.updateOne(
      { _id: id, deletedAt: { $ne: null } },
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
