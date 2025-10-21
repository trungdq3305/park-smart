import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import {
  CreateTieredRateSetDto,
  UpdateTieredRateSetDto,
} from './dto/tieredRateSet.dto'
import { ITieredRateSetRepository } from './interfaces/itieredRateSet.repository'
import { TieredRateSet } from './schemas/tieredRateSet.schema'

@Injectable()
export class TieredRateSetRepository implements ITieredRateSetRepository {
  constructor(
    @InjectModel(TieredRateSet.name)
    private readonly tieredRateSetModel: Model<TieredRateSet>,
  ) {}

  async findAllSetsForAdmin(
    page: number,
    pageSize: number,
  ): Promise<{ data: TieredRateSet[]; total: number }> {
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.tieredRateSetModel
        .find({ deletedAt: false })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.tieredRateSetModel.countDocuments({ deletedAt: false }),
    ])
    return { data, total }
  }

  async markSetAsUsed(id: string, isUsed: boolean): Promise<boolean> {
    const data = await this.tieredRateSetModel.updateOne(
      { _id: id },
      { $set: { isUsed } },
    )
    return data.modifiedCount > 0
  }

  async createSet(
    dto: CreateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSet | null> {
    const createdSet = new this.tieredRateSetModel({
      ...dto,
      createdBy: userId,
    })
    await createdSet.save()
    const result = await this.tieredRateSetModel.findById(createdSet._id).exec()
    return result
  }

  async findAllSetsByCreator(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: TieredRateSet[]; total: number }> {
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.tieredRateSetModel
        .find({ createdBy: userId, deletedAt: false })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      this.tieredRateSetModel.countDocuments({
        createdBy: userId,
        deletedAt: false,
      }),
    ])
    return { data, total }
  }

  async findSetById(id: string): Promise<TieredRateSet | null> {
    return await this.tieredRateSetModel.findById(id).lean().exec()
  }

  async findSetByIdAndCreator(
    id: string,
    userId: string,
  ): Promise<TieredRateSet | null> {
    return await this.tieredRateSetModel
      .findOne({ _id: id, createdBy: userId, deletedAt: false })
      .lean()
      .exec()
  }

  async updateSet(
    id: string,
    dto: UpdateTieredRateSetDto,
    userId: string,
  ): Promise<TieredRateSet | null> {
    return await this.tieredRateSetModel
      .findOneAndUpdate(
        { _id: id, createdBy: userId, deletedAt: false },
        { $set: { ...dto } },
        {
          new: true,
        },
      )
      .lean()
      .exec()
  }

  async softDeleteSet(id: string, userId: string): Promise<boolean> {
    const data = await this.tieredRateSetModel.updateOne(
      { _id: id, createdBy: userId, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: userId } },
    )
    return data.modifiedCount > 0
  }

  async findSetByName(
    name: string,
    userId: string,
  ): Promise<TieredRateSet | null> {
    return await this.tieredRateSetModel
      .findOne({ name, createdBy: userId, deletedAt: false })
      .lean()
      .exec()
  }
}
