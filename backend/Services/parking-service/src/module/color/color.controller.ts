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
  Req,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { CreateColorDto } from './dto/createColor.dto'
import { ColorResponseDto } from './dto/colorResponse.dto'
import { IColorService } from './interfaces/icolorservice'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RoleEnum } from 'src/common/enum/role.enum'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'

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
    @Req() req,
  ): Promise<ApiResponseDto<ColorResponseDto>> {
    return this.colorService.createColor(createColorDto, req.user.id)
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả màu sắc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách màu sắc',
    type: ApiResponseDto<ColorResponseDto[]>,
  })
  async getAllColors(): Promise<ApiResponseDto<ColorResponseDto>> {
    return this.colorService.findAllColors()
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
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ColorResponseDto>> {
    return this.colorService.findColorById(id)
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
    @Param('id') id: string,
    @Req() req,
  ): Promise<ApiResponseDto<boolean>> {
    return this.colorService.deleteColor(id, req.user.id)
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
    @Param('id') id: string,
    @Req() req,
  ): Promise<ApiResponseDto<boolean>> {
    return this.colorService.restoreColor(id, req.user.id)
  }
}
