import type { WardResponseDto } from '../dto/ward.dto'

export interface IWardService {
  getWards(): Promise<WardResponseDto[]>
}

export const IWardService = Symbol('IWardService')
