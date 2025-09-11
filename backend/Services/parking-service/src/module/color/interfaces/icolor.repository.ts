import { CreateColorDto } from '../dto/createColor.dto'
import { Color } from '../schemas/color.schema'

export interface IColorRepository {
  createColor(color: CreateColorDto, userId: string): Promise<Color>
  findAllColors(): Promise<Color[]>
  findColorById(id: string): Promise<Color | null>
  findColorByName(name: string): Promise<Color | null>
  deleteColor(id: string, userId: string): Promise<boolean>
  restoreColor(id: string, userId: string): Promise<boolean>
}

export const IColorRepository = Symbol('IColorRepository')
