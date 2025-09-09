import { WardDto } from '../dto/ward.dto'

export interface IWardRepository {
  getWards(): Promise<WardDto[]>
  getWardNameById(id: string): Promise<string | null>
}

export const IWardRepository = Symbol('IWardRepository')
