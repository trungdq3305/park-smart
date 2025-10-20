import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { Roles } from 'src/common/decorators/roles.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { PaginatedResponseDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

import {
  CreatePackageRateDto,
  PackageRateResponseDto,
  UpdatePackageRateDto,
} from './dto/packageRate.dto'
import { IPackageRateService } from './interfaces/ipackageRate.service'

@Controller('package-rates')
@ApiTags('package-rates')
export class PackageRateController {
  constructor(
    @Inject(IPackageRateService)
    private readonly packageRateService: IPackageRateService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một gói giá (package rate) mới' })
  @ApiBody({ type: CreatePackageRateDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Gói giá đã được tạo thành công',
    type: ApiResponseDto<PackageRateResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi trùng lặp (ví dụ: tên gói đã tồn tại)',
  })
  async createPackageRate(
    @Body() createDto: CreatePackageRateDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<PackageRateResponseDto>> {
    const packageRate = await this.packageRateService.createPackageRate(
      createDto,
      userId,
    )
    return {
      data: [packageRate],
      statusCode: HttpStatus.CREATED,
      message: 'Gói giá đã được tạo thành công',
      success: true,
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả gói giá.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách gói giá của người dùng hiện tại',
    type: PaginatedResponseDto<PackageRateResponseDto>,
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllPackageRates(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<ApiResponseDto<PackageRateResponseDto[]>> {
    const packageRates =
      await this.packageRateService.findAllPackageRates(paginationQuery)
    return {
      data: packageRates.data,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách gói giá thành công',
      success: true,
    }
  }

  @Get('all-unit')
  @ApiOperation({ summary: 'Lấy tất cả đơn vị của gói giá' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách đơn vị của gói giá',
    type: ApiResponseDto<string[]>,
  })
  async getAllPackageRateUnits(): Promise<ApiResponseDto<any>> {
    const units = await this.packageRateService.findAllEnumPackageRates()
    return {
      data: units,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đơn vị gói giá thành công',
      success: true,
    }
  }

  @Get('operator/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả gói giá của người dùng hiện tại (operator)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách gói giá của người dùng hiện tại',
    type: PaginatedResponseDto<PackageRateResponseDto>,
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllPackageRatesByOperator(
    @GetCurrentUserId() userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PackageRateResponseDto>> {
    const result = await this.packageRateService.findAllPackageRatesByCreator(
      userId,
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách gói giá thành công',
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin gói giá theo ID' })
  @ApiParam({ name: 'id', description: 'ID của gói giá', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin gói giá thành công',
    type: ApiResponseDto<PackageRateResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói giá',
  })
  async getPackageRateById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<PackageRateResponseDto>> {
    const packageRate = await this.packageRateService.findPackageRateById(id)
    return {
      data: [packageRate],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin gói giá thành công',
      success: true,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin gói giá' })
  @ApiParam({ name: 'id', description: 'ID của gói giá', type: 'string' })
  @ApiBody({ type: UpdatePackageRateDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thông tin gói giá thành công',
    type: ApiResponseDto<PackageRateResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói giá',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền cập nhật gói giá này',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Gói giá đang được sử dụng, không thể cập nhật',
  })
  async updatePackageRate(
    @Param() id: IdDto,
    @Body() updateDto: UpdatePackageRateDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<PackageRateResponseDto>> {
    const updatedPackageRate = await this.packageRateService.updatePackageRate(
      id,
      updateDto,
      userId,
    )
    return {
      data: [updatedPackageRate],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật gói giá thành công',
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm gói giá' })
  @ApiParam({ name: 'id', description: 'ID của gói giá', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa mềm gói giá thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói giá',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền xóa gói giá này',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Gói giá đang được sử dụng, không thể xóa',
  })
  async softDeletePackageRate(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const isDeleted = await this.packageRateService.softDeletePackageRate(
      id,
      userId,
    )
    return {
      data: [isDeleted],
      statusCode: HttpStatus.OK,
      message: 'Xóa gói giá thành công',
      success: true,
    }
  }
}
