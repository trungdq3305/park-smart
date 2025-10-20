import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IBasisRepository } from './interfaces/ibasis.repository'
import { Basis } from './schemas/basis.schema'

@Injectable()
export class BasisRepository implements IBasisRepository {
  constructor(
    @InjectModel(Basis.name) private readonly basisModel: Model<Basis>,
  ) {}

  async findBasisById(id: string): Promise<Basis | null> {
    return await this.basisModel.findById(id).exec()
  }

  async findAllBasis(): Promise<Basis[] | null> {
    return await this.basisModel.find().exec()
  }
}
