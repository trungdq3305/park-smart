import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { ColorResponseDto } from '../dto/colorResponse.dto'
import { CreateColorDto } from '../dto/createColor.dto'

export interface IColorService {
  createColor(
    createColorDto: CreateColorDto,
    userId: string,
  ): Promise<ApiResponseDto<ColorResponseDto>>
  findColorById(id: string): Promise<ApiResponseDto<ColorResponseDto>>
  findAllColors(): Promise<ApiResponseDto<ColorResponseDto>>
  deleteColor(id: string, userId: string): Promise<ApiResponseDto<boolean>>
  restoreColor(id: string, userId: string): Promise<ApiResponseDto<boolean>>
}

export const IColorService = Symbol('IColorService')
