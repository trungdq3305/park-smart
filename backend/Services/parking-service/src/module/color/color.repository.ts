import mongoose, { Model } from 'mongoose'
import { CreateColorDto } from './dto/createColor.dto'
import { Color } from './schemas/color.schema'
import { IColorRepository } from './interfaces/icolor.repository'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'

@Injectable()
export class ColorRepository implements IColorRepository {
  constructor(
    @InjectModel(Color.name) private readonly colorModel: Model<Color>,
  ) {}

  async createColor(color: CreateColorDto, userId: string): Promise<Color> {
    const createdColor = new this.colorModel({
      ...color,
      createdAt: new Date(),
      createdBy: new mongoose.Types.ObjectId(userId),
    })
    return createdColor.save()
  }

  async findAllColors(): Promise<Color[]> {
    return this.colorModel.find().lean().exec()
  }

  async findColorById(id: string): Promise<Color | null> {
    return this.colorModel.findById(id).lean().exec()
  }

  async findColorByName(name: string): Promise<Color | null> {
    return this.colorModel.findOne({ colorName: name }).lean().exec()
  }

  async deleteColor(id: string, userId: string): Promise<boolean> {
    const result = await this.colorModel.findByIdAndUpdate(id, {
      deletedAt: new Date(),
      deletedBy: new mongoose.Types.ObjectId(userId),
    })
    return result !== null
  }

  async restoreColor(id: string, userId: string): Promise<boolean> {
    const result = await this.colorModel.findByIdAndUpdate(id, {
      deletedAt: null,
      deletedBy: null,
      updatedAt: new Date(),
      updatedBy: new mongoose.Types.ObjectId(userId),
    })
    return result !== null
  }
}
