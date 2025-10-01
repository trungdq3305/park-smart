import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IWardRepository } from './interfaces/iward.repository'
import { Ward, WardDocument } from './schemas/ward.schema'

@Injectable()
export class WardRepository implements IWardRepository {
  constructor(@InjectModel(Ward.name) private wardModel: Model<WardDocument>) {}

  async getWards(): Promise<Ward[]> {
    return this.wardModel.find().exec() // <-- Bỏ .lean()
  }

  async getWardNameById(id: string): Promise<string | null> {
    const ward = await this.wardModel.findById(id).exec() // <-- Bỏ .lean()
    return ward ? ward.wardName : null
  }
}
