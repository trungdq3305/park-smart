import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Inject,
  UseGuards,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'

import { IColorService } from './interfaces/icolorservice'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RoleEnum } from 'src/common/enum/role.enum'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { ColorResponseDto, CreateColorDto } from './dto/color.dto'
import { IdDto } from 'src/common/dto/params.dto'

@Controller('colors')
@ApiTags('colors')
export class ColorController {
  constructor(
    @Inject(IColorService) private readonly colorService: IColorService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo màu sắc mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Màu sắc đã được tạo thành công',
    type: ApiResponseDto<ColorResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Màu sắc đã tồn tại',
    type: ApiResponseDto,
  })
  async createColor(
    @Body() createColorDto: CreateColorDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ColorResponseDto>> {
    const data = await this.colorService.createColor(createColorDto, userId)
    return {
      data: [data],
      statusCode: HttpStatus.CREATED,
      message: 'Tạo màu sắc thành công',
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả màu sắc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách màu sắc',
    type: ApiResponseDto<ColorResponseDto[]>,
  })
  async getAllColors(): Promise<ApiResponseDto<ColorResponseDto>> {
    const colors = await this.colorService.findAllColors()
    return {
      data: colors,
      statusCode: HttpStatus.OK,
      message: 'Tìm thấy tất cả màu sắc thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy màu sắc theo ID' })
  @ApiParam({ name: 'id', description: 'ID của màu sắc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Màu sắc đã được tìm thấy',
    type: ApiResponseDto<ColorResponseDto>,
  })
  async findColorById(
    @Param() params: IdDto,
  ): Promise<ApiResponseDto<ColorResponseDto>> {
    const color = await this.colorService.findColorById(params.id)
    return {
      data: [color],
      statusCode: HttpStatus.OK,
      message: 'Màu sắc đã được tìm thấy',
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa màu sắc theo ID' })
  @ApiParam({ name: 'id', description: 'ID của màu sắc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa màu sắc thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Xóa màu sắc thất bại',
    type: ApiResponseDto,
  })
  async deleteColor(
    @Param() params: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const data = await this.colorService.deleteColor(params.id, userId)
    return {
      data: [data],
      statusCode: HttpStatus.OK,
      message: 'Xóa màu sắc thành công',
      success: true,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khôi phục màu sắc theo ID' })
  @ApiParam({ name: 'id', description: 'ID của màu sắc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Khôi phục màu sắc thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Khôi phục màu sắc thất bại',
    type: ApiResponseDto,
  })
  async restoreColor(
    @Param() params: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const data = await this.colorService.restoreColor(params.id, userId)
    return {
      data: [data],
      statusCode: HttpStatus.OK,
      message: 'Khôi phục màu sắc thành công',
      success: true,
    }
  }
}
