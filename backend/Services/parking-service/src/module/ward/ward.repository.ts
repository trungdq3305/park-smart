import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { IWardRepository } from './interfaces/iward.repository'
import { Ward } from './schemas/ward.schema'

@Injectable()
export class WardRepository implements IWardRepository {
  constructor(@InjectModel(Ward.name) private wardModel: Model<Ward>) {}

  async getWards(): Promise<Ward[]> {
    return this.wardModel.find().lean().exec()
  }

  async getWardNameById(id: string): Promise<string | null> {
    const ward = await this.wardModel.findById(id).lean().exec()
    return ward ? ward.ward_name : null
  }
}
