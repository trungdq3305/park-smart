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
import { GetCurrenIdOfUserRole } from 'src/common/decorators/getCurrenIdOfUserRole.decorator'
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
  CreateVehicleDto,
  PlateParamDto as PlateParameterDto,
  UpdateVehicleDto,
  VehicleResponseDto,
} from './dto/vehicle.dto'
import { IVehicleService } from './interfaces/ivehicle.service'
@Controller('vehicles')
@ApiTags('vehicles')
export class VehicleController {
  constructor(
    @Inject(IVehicleService) private readonly vehicleService: IVehicleService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo xe mới' })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Xe đã được tạo thành công',
    type: ApiResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Xe đã tồn tại và được sử dụng bởi người dùng khác',
  })
  async createVehicle(
    @Body() createVehicleDto: CreateVehicleDto,
    @GetCurrentUserId() userId: string,
    @GetCurrenIdOfUserRole() driverId: string,
  ): Promise<ApiResponseDto<VehicleResponseDto>> {
    const vehicle = await this.vehicleService.createVehicle(
      createVehicleDto,
      userId,
      driverId,
    )
    return {
      data: [vehicle],
      statusCode: HttpStatus.CREATED,
      message: 'Xe đã được tạo thành công',
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin xe theo ID' })
  @ApiParam({ name: 'id', description: 'ID của xe', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin xe thành công',
    type: ApiResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe',
  })
  async getVehicleById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<VehicleResponseDto>> {
    const vehicle = await this.vehicleService.findVehicleById(id)
    return {
      data: [vehicle],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin xe thành công',
      success: true,
    }
  }

  @Get('driver/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả xe của người dùng hiện tại' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách xe của người dùng hiện tại',
    type: PaginatedResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe',
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllVehicles(
    @GetCurrenIdOfUserRole() driverId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    const vehicles = await this.vehicleService.findAllVehicles(
      driverId,
      paginationQuery.page,
      paginationQuery.pageSize,
    )
    return {
      data: vehicles.data,
      pagination: vehicles.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách xe thành công',
      success: true,
    }
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả xe (dành cho admin)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách tất cả xe',
    type: PaginatedResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe nào',
  })
  @ApiQuery({
    name: 'page',
    required: true,
    type: Number,
    description: 'Trang hiện tại',
  })
  @ApiQuery({
    name: 'pageSize',
    required: true,
    type: Number,
    description: 'Số lượng xe trên mỗi trang',
  })
  async adminGetAllVehicles(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    const vehicles = await this.vehicleService.adminFindAllVehicles(
      paginationQuery.page,
      paginationQuery.pageSize,
    )
    return {
      data: vehicles.data,
      pagination: vehicles.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách xe thành công',
      success: true,
    }
  }

  @Get('plate/:plateNumber')
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'plateNumber', required: true, type: String })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin xe theo biển số' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin xe thành công',
    type: ApiResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe',
  })
  async getVehicleByPlateNumber(
    @Param() plateNumber: PlateParameterDto,
  ): Promise<ApiResponseDto<VehicleResponseDto>> {
    const vehicle = await this.vehicleService.findVehicleByPlateNumber({
      plateNumber: plateNumber.plateNumber,
    })
    return {
      data: [vehicle],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin xe thành công',
      success: true,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin xe' })
  @ApiParam({ name: 'id', description: 'ID của xe', type: 'string' })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thông tin xe thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền cập nhật xe này',
  })
  async updateVehicle(
    @Param() id: IdDto,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const data = await this.vehicleService.updateVehicle(
      id,
      updateVehicleDto,
      userId,
    )
    return {
      data: [data.success],
      statusCode: HttpStatus.OK,
      message: data.message,
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa xe' })
  @ApiParam({ name: 'id', description: 'ID của xe', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa xe thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền xóa xe này',
  })
  async deleteVehicle(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const data = await this.vehicleService.deleteVehicle(id, userId)
    return {
      data: [data.success],
      statusCode: HttpStatus.OK,
      message: data.message,
      success: true,
    }
  }

  @Patch('restore/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khôi phục xe đã xóa' })
  @ApiParam({ name: 'id', description: 'ID của xe', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Khôi phục xe thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền khôi phục xe này',
  })
  async restoreVehicle(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const data = await this.vehicleService.restoreVehicle(id, userId)
    return {
      data: [data.success],
      statusCode: data.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
      message: data.message,
      success: data.success,
    }
  }

  @Get('driver/all-deleted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả xe đã xóa của người dùng hiện tại' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách xe đã xóa của người dùng hiện tại',
    type: PaginatedResponseDto<VehicleResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy xe đã xóa nào',
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllDeletedVehicles(
    @GetCurrenIdOfUserRole() driverId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<VehicleResponseDto>> {
    const vehicles = await this.vehicleService.findAllDeletedVehicles(
      paginationQuery.page,
      paginationQuery.pageSize,
      driverId,
    )
    return {
      data: vehicles.data,
      pagination: vehicles.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách xe đã xóa thành công',
      success: true,
    }
  }
}
