import type { ColorResponseDto, CreateColorDto } from '../dto/color.dto'

export interface IColorService {
  createColor(
    createColorDto: CreateColorDto,
    userId: string,
  ): Promise<ColorResponseDto>
  findColorById(id: string): Promise<ColorResponseDto>
  findAllColors(): Promise<ColorResponseDto[]>
  deleteColor(id: string, userId: string): Promise<boolean>
  restoreColor(id: string, userId: string): Promise<boolean>
}

export const IColorService = Symbol('IColorService')
