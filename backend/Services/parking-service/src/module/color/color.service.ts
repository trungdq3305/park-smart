import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'

import { ColorResponseDto, CreateColorDto } from './dto/color.dto'
import { IColorRepository } from './interfaces/icolor.repository'
import { IColorService } from './interfaces/icolorservice'
import { Color } from './schemas/color.schema'

@Injectable()
export class ColorService implements IColorService {
  constructor(
    @Inject(IColorRepository)
    private readonly colorRepository: IColorRepository,
  ) {}

  private returnColorResponseDto(color: Color): ColorResponseDto {
    return plainToInstance(ColorResponseDto, color, {
      excludeExtraneousValues: true,
    })
  }

  async createColor(
    createColorDto: CreateColorDto,
    userId: string,
  ): Promise<ColorResponseDto> {
    const existingColor = await this.colorRepository.findColorByName(
      createColorDto.colorName,
    )
    if (existingColor && !existingColor.deletedAt) {
      throw new ConflictException('Màu sắc đã tồn tại')
    }
    const color = await this.colorRepository.createColor(createColorDto, userId)
    return this.returnColorResponseDto(color)
  }

  async findColorById(id: string): Promise<ColorResponseDto> {
    const color = await this.colorRepository.findColorById(id)
    if (!color) {
      throw new NotFoundException('Không tìm thấy màu sắc')
    }
    return this.returnColorResponseDto(color)
  }

  async findAllColors(): Promise<ColorResponseDto[]> {
    const colors = await this.colorRepository.findAllColors()
    if (!colors || colors.length === 0) {
      throw new NotFoundException('Không tìm thấy màu sắc nào')
    }
    return colors.map((color) => this.returnColorResponseDto(color))
  }

  async deleteColor(id: string, userId: string): Promise<boolean> {
    const success = await this.colorRepository.deleteColor(id, userId)
    if (!success) {
      throw new BadRequestException(
        'Xóa màu sắc thất bại. Có thể ID không tồn tại hoặc đã bị xóa.',
      )
    }
    return success
  }

  async restoreColor(id: string, userId: string): Promise<boolean> {
    const success = await this.colorRepository.restoreColor(id, userId)
    if (!success) {
      throw new BadRequestException(
        'Khôi phục màu sắc thất bại. Có thể ID không tồn tại hoặc không ở trạng thái bị xóa.',
      )
    }
    return success
  }
}
