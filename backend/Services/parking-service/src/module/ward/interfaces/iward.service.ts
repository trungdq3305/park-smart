import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { WardDto } from '../dto/ward.dto'

export interface IWardService {
  getWards(): Promise<ApiResponseDto<WardDto>>
}

export const IWardService = Symbol('IWardService')
