import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CreateColorDto } from './dto/createColor.dto'
import { IColorRepository } from './interfaces/icolor.repository'
import { IColorService } from './interfaces/icolorservice'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { ColorResponseDto } from './dto/colorResponse.dto'
import { isMongoId } from 'class-validator'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ColorService implements IColorService {
  constructor(
    @Inject(IColorRepository)
    private readonly colorRepository: IColorRepository,
  ) {}

  private readonly logger = new Logger(ColorService.name)
  private readonly configService = new ConfigService()
  private readonly accountServiceUrl =
    this.configService.get<string>('CORE_SERVICE_URL')

  async createColor(
    createColorDto: CreateColorDto,
    userId: string,
  ): Promise<ApiResponseDto<ColorResponseDto>> {
    const existingColor = await this.colorRepository.findColorByName(
      createColorDto.colorName,
    )
    if (existingColor) {
      throw new ConflictException('Màu sắc đã tồn tại')
    }
    const color = await this.colorRepository.createColor(createColorDto, userId)
    return {
      data: [new ColorResponseDto(color)],
      statusCode: 201,
      message: 'Màu sắc đã được tạo thành công',
      success: true,
    }
  }

  async findColorById(id: string): Promise<ApiResponseDto<any>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }

    const color = await this.colorRepository.findColorById(id)

    if (!color) {
      throw new NotFoundException('Không tìm thấy màu sắc')
    }
    return {
      data: [new ColorResponseDto(color)],
      statusCode: 200,
      message: 'Tìm thấy màu sắc thành công',
      success: true,
    }
  }

  async findAllColors(): Promise<ApiResponseDto<ColorResponseDto>> {
    const colors = await this.colorRepository.findAllColors()
    if (!colors || colors.length === 0) {
      throw new NotFoundException('Không tìm thấy màu sắc nào')
    }
    return {
      data: colors.map((color) => new ColorResponseDto(color)),
      statusCode: 200,
      message: 'Tìm thấy tất cả màu sắc thành công',
      success: true,
    }
  }

  async deleteColor(
    id: string,
    userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const success = await this.colorRepository.deleteColor(id, userId)
    if (!success) {
      throw new BadRequestException('Xóa màu sắc thất bại')
    }
    return {
      data: [success],
      statusCode: 200,
      message: 'Xóa màu sắc thành công',
      success: true,
    }
  }

  async restoreColor(
    id: string,
    userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const success = await this.colorRepository.restoreColor(id, userId)
    if (!success) {
      throw new BadRequestException('Khôi phục màu sắc thất bại')
    }
    return {
      data: [success],
      statusCode: 200,
      message: 'Khôi phục màu sắc thành công',
      success: true,
    }
  }
}
