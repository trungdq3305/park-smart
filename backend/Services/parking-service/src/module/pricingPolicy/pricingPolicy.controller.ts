import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  Param,
  // Patch, // Bị bỏ qua vì không có trong service interface
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
import {
  PaginatedResponseDto,
} from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

// --- Thay đổi DTOs và Interface ---
import {
  CreatePricingPolicyDto,
  PricingPolicyResponseDto,
  // UpdatePricingPolicyDto, // Bị bỏ qua vì không có trong service interface
} from './dto/pricingPolicy.dto' // <-- Thay đổi
import { IPricingPolicyService } from './interfaces/ipricingPolicy.service' // <-- Thay đổi

@Controller('pricing-policies') // <-- Thay đổi
@ApiTags('pricing-policies') // <-- Thay đổi
export class PricingPolicyController {
  constructor(
    @Inject(IPricingPolicyService) // <-- Thay đổi
    private readonly pricingPolicyService: IPricingPolicyService, // <-- Thay đổi
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một chính sách giá (pricing policy) mới' }) // <-- Thay đổi
  @ApiBody({ type: CreatePricingPolicyDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Chính sách giá đã được tạo thành công', // <-- Thay đổi
    type: ApiResponseDto<PricingPolicyResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi trùng lặp (ví dụ: tên chính sách giá đã tồn tại)', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lỗi nghiệp vụ (ví dụ: thiếu ID gói hoặc ID bậc thang)', // <-- Thay đổi
  })
  async createPolicy(
    @Body() createDto: CreatePricingPolicyDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<PricingPolicyResponseDto>> {
    // <-- Thay đổi
    const policy = await this.pricingPolicyService.createPolicy(
      // <-- Thay đổi
      createDto,
      userId,
    )
    return {
      data: [policy],
      statusCode: HttpStatus.CREATED,
      message: 'Chính sách giá đã được tạo thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả chính sách giá (Admin)', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách tất cả chính sách giá', // <-- Thay đổi
    type: PaginatedResponseDto<PricingPolicyResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllPoliciesForAdmin(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PricingPolicyResponseDto>> {
    // <-- Thay đổi
    const result = await this.pricingPolicyService.findAllPoliciesForAdmin(
      // <-- Thay đổi
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách chính sách giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('operator/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả chính sách giá của người dùng hiện tại (operator)', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách chính sách giá của người dùng hiện tại', // <-- Thay đổi
    type: PaginatedResponseDto<PricingPolicyResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async getAllPoliciesByOperator(
    @GetCurrentUserId() userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<PricingPolicyResponseDto>> {
    // <-- Thay đổi
    const result = await this.pricingPolicyService.findAllPoliciesByCreator(
      // <-- Thay đổi
      userId,
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách chính sách giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR) // Giả định Operator có thể xem chi tiết
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết chính sách giá theo ID' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của chính sách giá',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin chính sách giá thành công', // <-- Thay đổi
    type: ApiResponseDto<PricingPolicyResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy chính sách giá', // <-- Thay đổi
  })
  async getPolicyDetails(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<PricingPolicyResponseDto>> {
    // <-- Thay đổi
    const policy = await this.pricingPolicyService.getPolicyDetails(id) // <-- Thay đổi
    return {
      data: [policy],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin chính sách giá thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm chính sách giá' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của chính sách giá',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Xóa mềm chính sách giá thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy chính sách giá', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Người dùng không có quyền xóa chính sách giá này', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Chính sách giá đang được liên kết, không thể xóa', // <-- Thay đổi
  })
  async softDeletePolicy(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const isDeleted = await this.pricingPolicyService.softDeletePolicy(
      // <-- Thay đổi
      id,
      userId,
    )
    return {
      data: [isDeleted],
      statusCode: HttpStatus.OK,
      message: 'Xóa chính sách giá thành công', // <-- Thay đổi
      success: true,
    }
  }
}
