import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch, // ⭐️ Thêm Patch
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

// --- Thay đổi DTOs và Interface ---
import {
  CreateParkingLotPolicyLinkDto,
  ParkingLotPolicyLinkResponseDto,
  UpdateLinkEndDateDto,
  UpdateParkingLotPolicyLinkDto,
} from './dto/parkingLotPolicyLink.dto' // <-- Thay đổi
import { IParkingLotPolicyLinkService } from './interfaces/iparkingLotPolicyLink.service'

@Controller('parking-lot-links') // <-- Thay đổi
@ApiTags('parking-lot-links') // <-- Thay đổi
export class ParkingLotPolicyLinkController {
  constructor(
    @Inject(IParkingLotPolicyLinkService) // <-- Thay đổi
    private readonly linkService: IParkingLotPolicyLinkService, // <-- Thay đổi
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo một liên kết chính sách giá mới (gán vào bãi xe)',
  }) // <-- Thay đổi
  @ApiBody({ type: CreateParkingLotPolicyLinkDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Liên kết đã được tạo thành công', // <-- Thay đổi
    type: ApiResponseDto<ParkingLotPolicyLinkResponseDto>, // <-- Thay đổi
  })
  async createLink(
    @Body() createDto: CreateParkingLotPolicyLinkDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ParkingLotPolicyLinkResponseDto>> {
    // <-- Thay đổi
    const link = await this.linkService.createLink(
      // <-- Thay đổi
      createDto,
      userId,
    )
    return {
      data: [link],
      statusCode: HttpStatus.CREATED,
      message: 'Liên kết đã được tạo thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật một liên kết (priority, endDate)' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của liên kết', type: 'string' }) // <-- Thay đổi
  @ApiBody({ type: UpdateParkingLotPolicyLinkDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật liên kết thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>, // <-- Thay đổi (Service trả về boolean)
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy liên kết',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền cập nhật liên kết này',
  })
  async updateLink(
    @Param() id: IdDto,
    @Body() updateDto: UpdateParkingLotPolicyLinkDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    // <-- Thay đổi
    const isUpdated = await this.linkService.updateLink(
      // <-- Thay đổi
      id,
      updateDto,
      userId,
    )
    return {
      data: [isUpdated],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật liên kết thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('by-parking-lot/:parkingLotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR, RoleEnum.ADMIN) // Dành cho Operator/Admin quản lý
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Lấy tất cả liên kết (cũ và mới) của 1 bãi xe (cho Admin và Operator)', // <-- Thay đổi
  })
  @ApiParam({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách liên kết của bãi xe', // <-- Thay đổi
    type: PaginatedResponseDto<ParkingLotPolicyLinkResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  @ApiQuery({
    name: 'isDeleted',
    required: true,
    type: Boolean,
    example: false,
  }) // <-- Thêm isDeleted
  async findAllLinksByParkingLot(
    @Param('parkingLotId') parkingLotId: string, // <-- Thay đổi
    @Query() paginationQuery: PaginationQueryDto,
    @Query('isDeleted') isDeleted: boolean,
  ): Promise<PaginatedResponseDto<ParkingLotPolicyLinkResponseDto>> {
    // <-- Thay đổi
    const result = await this.linkService.findAllLinksByParkingLot(
      // <-- Thay đổi
      parkingLotId,
      paginationQuery,
      isDeleted,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách liên kết thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('active/by-parking-lot/:parkingLotId')
  @ApiOperation({
    summary:
      'Lấy các chính sách giá ĐANG HOẠT ĐỘNG cho 1 bãi xe (Cho khách hàng)', // <-- Thay đổi
  })
  @ApiParam({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách chính sách giá đang hoạt động', // <-- Thay đổi
    type: ApiResponseDto<ParkingLotPolicyLinkResponseDto[]>, // <-- Thay đổi (Trả về mảng)
  })
  async getActivePoliciesForParkingLot(
    @Param('parkingLotId') parkingLotId: string, // <-- Thay đổi
  ): Promise<ApiResponseDto<ParkingLotPolicyLinkResponseDto[]>> {
    // <-- Thay đổi
    const policies = await this.linkService.getActivePoliciesForParkingLot(
      // <-- Thay đổi
      parkingLotId,
    )
    return {
      data: policies, // ⭐️ Trả về mảng (không phải [policies])
      statusCode: HttpStatus.OK,
      message: 'Lấy chính sách giá đang hoạt động thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR, RoleEnum.ADMIN) // Giả định Operator/Admin có thể xem chi tiết
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết liên kết theo ID' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của liên kết', type: 'string' }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin liên kết thành công', // <-- Thay đổi
    type: ApiResponseDto<ParkingLotPolicyLinkResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy liên kết', // <-- Thay đổi
  })
  async findLinkById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<ParkingLotPolicyLinkResponseDto>> {
    // <-- Thay đổi
    const link = await this.linkService.findLinkById(id) // <-- Thay đổi
    return {
      data: [link],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin liên kết thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm một liên kết' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của liên kết', type: 'string' }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa mềm liên kết thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy liên kết', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền xóa liên kết này', // <-- Thay đổi
  })
  async softDeleteLink(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const isDeleted = await this.linkService.softDeleteLink(id, userId)
    return {
      data: [isDeleted],
      statusCode: HttpStatus.OK,
      message: 'Xóa liên kết thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Patch(':id/schedule-end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Cập nhật ngày kết thúc (Lên lịch xóa)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID của liên kết', type: 'string' })
  @ApiBody({ type: UpdateLinkEndDateDto }) // DTO chỉ chứa endDate
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật ngày kết thúc thành công',
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy liên kết',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền cập nhật liên kết này',
  })
  async scheduleLinkExpiration(
    @Param() id: IdDto,
    @Body() body: UpdateLinkEndDateDto, // DTO chỉ chứa endDate
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.linkService.updateEndDate(
      id.id,
      body.endDate,
      userId,
    )
    return {
      data: [result],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật ngày kết thúc thành công',
      success: true,
    }
  }
}
