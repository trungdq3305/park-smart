import type { Ward } from '../schemas/ward.schema'

export interface IWardRepository {
  getWards(): Promise<Ward[]>
  getWardNameById(id: string): Promise<string | null>
}

export const IWardRepository = Symbol('IWardRepository')
