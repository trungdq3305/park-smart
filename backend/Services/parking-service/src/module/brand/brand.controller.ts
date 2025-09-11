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
import { CreateBrandDto } from './dto/createBrand.dto'
import { BrandResponseDto } from './dto/brandResponse.dto'
import { IBrandService } from './interfaces/ibrand.service'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RoleEnum } from 'src/common/enum/role.enum'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'

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
    @Req() req,
  ): Promise<ApiResponseDto<BrandResponseDto>> {
    return this.brandService.createBrand(createBrandDto, req.user.id)
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả hãng xe' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách hãng xe',
    type: ApiResponseDto<BrandResponseDto[]>,
  })
  async getAllBrands(): Promise<ApiResponseDto<BrandResponseDto>> {
    return this.brandService.findAllBrands()
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
    return this.brandService.findBrandById(id)
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
    @Req() req,
  ): Promise<ApiResponseDto<boolean>> {
    return this.brandService.deleteBrand(id, req.user.id)
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
    @Req() req,
  ): Promise<ApiResponseDto<boolean>> {
    return this.brandService.restoreBrand(id, req.user.id)
  }
}
