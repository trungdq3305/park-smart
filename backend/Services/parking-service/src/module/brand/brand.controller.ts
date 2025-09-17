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
import { CreateBrandDto, BrandResponseDto } from './dto/brand.dto'
import { IBrandService } from './interfaces/ibrand.service'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RoleEnum } from 'src/common/enum/role.enum'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'

@Controller('brands')
@ApiTags('brands')
export class BrandController {
  constructor(
    @Inject(IBrandService) private readonly brandService: IBrandService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo hãng xe mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hãng xe đã được tạo thành công',
    type: ApiResponseDto<BrandResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Hãng xe đã tồn tại',
    type: ApiResponseDto,
  })
  async createBrand(
    @Body() createBrandDto: CreateBrandDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<BrandResponseDto>> {
    const brand = await this.brandService.createBrand(createBrandDto, userId)
    return {
      data: [brand],
      statusCode: HttpStatus.CREATED,
      message: 'Hãng xe đã được tạo thành công',
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả hãng xe' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách hãng xe',
    type: ApiResponseDto<BrandResponseDto[]>,
  })
  async getAllBrands(): Promise<ApiResponseDto<BrandResponseDto[]>> {
    const brands = await this.brandService.findAllBrands()
    return {
      data: [brands],
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách hãng xe thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy hãng xe theo ID' })
  @ApiParam({ name: 'id', description: 'ID của hãng xe' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hãng xe đã được tìm thấy',
    type: ApiResponseDto<BrandResponseDto>,
  })
  async findBrandById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<BrandResponseDto>> {
    const brand = await this.brandService.findBrandById(id)
    const { message, ...brandData } = brand
    return {
      data: [brandData],
      statusCode: HttpStatus.OK,
      message: message,
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa hãng xe theo ID' })
  @ApiParam({ name: 'id', description: 'ID của hãng xe' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa hãng xe thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Xóa hãng xe thất bại',
    type: ApiResponseDto,
  })
  async deleteBrand(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const success = await this.brandService.deleteBrand(id, userId)
    return {
      data: [success],
      statusCode: HttpStatus.OK,
      message: 'Xóa hãng xe thành công',
      success: true,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khôi phục hãng xe theo ID' })
  @ApiParam({ name: 'id', description: 'ID của hãng xe' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Khôi phục hãng xe thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Khôi phục hãng xe thất bại',
    type: ApiResponseDto,
  })
  async restoreBrand(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const success = await this.brandService.restoreBrand(id, userId)
    return {
      data: [success],
      statusCode: HttpStatus.OK,
      message: 'Khôi phục hãng xe thành công',
      success: true,
    }
  }
}
