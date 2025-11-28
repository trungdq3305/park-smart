import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  getSchemaPath,
} from '@nestjs/swagger'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { UserToken } from 'src/common/decorators/getUserToken.decorator'
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
  AvailabilitySlotDto,
  CreateSubscriptionDto,
  SubscriptionCancellationPreviewResponseDto,
  SubscriptionDetailResponseDto,
  SubscriptionFilterDto,
  SubscriptionLogDto,
  SubscriptionRenewalEligibilityResponseDto,
  UpdateSubscriptionDto,
} from './dto/subscription.dto' // <-- Thay đổi
import { SubscriptionStatusEnum } from './enums/subscription.enum'
import { ISubscriptionService } from './interfaces/isubcription.service' // <-- Thay đổi

@Controller('subscriptions') // <-- Thay đổi
@ApiTags('subscriptions') // <-- Thay đổi
export class SubscriptionController {
  constructor(
    @Inject(ISubscriptionService) // <-- Thay đổi
    private readonly subscriptionService: ISubscriptionService, // <-- Thay đổi
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // DRIVER là người dùng mua
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một Hóa đơn (draft) Gói thuê bao mới' }) // <-- Thay đổi
  @ApiBody({ type: CreateSubscriptionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hóa đơn (draft) đã được tạo thành công.', // <-- Thay đổi
    type: ApiResponseDto<SubscriptionDetailResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi (ví dụ: đã hết suất thuê bao cho ngày này)', // <-- Thay đổi
  })
  async createSubscription(
    @Body() createDto: CreateSubscriptionDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<SubscriptionDetailResponseDto>> {
    const subscription = await this.subscriptionService.createSubscription(
      createDto,
      userId,
    )
    return {
      data: [subscription],
      statusCode: HttpStatus.CREATED,
      message: 'Hóa đơn Gói thuê bao đã được tạo (chờ thanh toán).', // <-- Thay đổi
      success: true,
    }
  }

  // =================================================================
  // ⭐️ 2. API KÍCH HOẠT THANH TOÁN (HÀM MỚI BẠN YÊU CẦU)
  // =================================================================
  @Patch(':id/confirm-payment') // ⭐️ Dùng PATCH
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // Cùng người dùng đã tạo hóa đơn
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kích hoạt Gói thuê bao (Xác nhận thanh toán)' })
  @ApiParam({
    name: 'id',
    description: 'ID của Gói (Subscription) đang PENDING',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: {
          type: 'string',
          example: '69133b7bda89df55a5e59ad4',
          description: 'ID thanh toán (bằng chứng) từ .NET service',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK, // ⭐️ Trả về 200 (OK) vì đây là cập nhật
    description: 'Gói thuê bao đã được kích hoạt thành công',
    type: ApiResponseDto<SubscriptionDetailResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi (ví dụ: thanh toán đã được sử dụng, gói đã active)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn (Subscription) để kích hoạt',
  })
  async updateSubscriptionPaymentId(
    @Param('id') subscriptionId: string, // ⭐️ Lấy ID từ URL
    @Body('paymentId') paymentId: string, // ⭐️ Lấy paymentId từ Body
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<SubscriptionDetailResponseDto>> {
    const subscription =
      await this.subscriptionService.updateSubscriptionPaymentId(
        subscriptionId,
        userId,
        paymentId,
      )

    return {
      data: [subscription],
      statusCode: HttpStatus.OK, // ⭐️ Trả về 200 (OK)
      message: 'Gói thuê bao đã được kích hoạt thành công.',
      success: true,
    }
  }

  @Post(':id/renew')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // DRIVER là người dùng gia hạn
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gia hạn một gói thuê bao (do người dùng chủ động)',
  }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của gói thuê bao', type: 'string' }) // <-- Thay đổi
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: {
          type: 'string',
          example: 'TXN_abc12345',
          description: 'ID thanh toán mới cho lần gia hạn này',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK, // Trả về 200 OK (vì là cập nhật)
    description: 'Gia hạn gói thành công', // <-- Thay đổi
    type: ApiResponseDto<SubscriptionDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Thanh toán không hợp lệ',
  })
  async renewSubscription(
    @Param() id: IdDto,
    @Body('paymentId') paymentId: string, // <-- Lấy từ body
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<SubscriptionDetailResponseDto>> {
    // <-- Thay đổi
    const subscription = await this.subscriptionService.renewSubscription(
      // <-- Thay đổi
      id,
      paymentId,
      userId,
    )
    return {
      data: [subscription],
      statusCode: HttpStatus.OK,
      message: 'Gia hạn gói thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả gói thuê bao của người dùng hiện tại', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách gói thuê bao của người dùng hiện tại', // <-- Thay đổi
    type: PaginatedResponseDto<SubscriptionDetailResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatusEnum })
  async findAllByUserId(
    @GetCurrentUserId() userId: string,
    @Query() paginationQuery: SubscriptionFilterDto,
  ): Promise<PaginatedResponseDto<SubscriptionDetailResponseDto>> {
    // <-- Thay đổi
    const result = await this.subscriptionService.findAllByUserId(
      // <-- Thay đổi
      userId,
      { page: paginationQuery.page, pageSize: paginationQuery.pageSize },
      paginationQuery.status,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách gói thuê bao thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('identifier/:identifier')
  @ApiOperation({
    summary: 'Lấy thông tin gói bằng mã QR (cho Barie/Scanner)', // <-- Thay đổi
  })
  @ApiParam({
    name: 'identifier',
    description: 'Mã định danh (UUID) từ QR code',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin gói thuê bao thành công', // <-- Thay đổi
    type: ApiResponseDto<SubscriptionDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói hoặc gói đã hết hạn/đang sử dụng', // <-- Thay đổi
  })
  async findActiveSubscriptionByIdentifier(
    @Param('identifier') identifier: string, // <-- Thay đổi
  ): Promise<ApiResponseDto<SubscriptionDetailResponseDto>> {
    // <-- Thay đổi
    const subscription =
      await this.subscriptionService.findActiveSubscriptionByIdentifier(
        // <-- Thay đổi
        identifier,
      )
    return {
      data: [subscription],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin gói thuê bao thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER, RoleEnum.OPERATOR, RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy lịch sử (logs) của một gói thuê bao theo ID',
  }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của gói thuê bao',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách lịch sử gói thuê bao thành công', // <-- Thay đổi
    type: PaginatedResponseDto<SubscriptionLogDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async findLogsBySubscriptionId(
    @Param() id: IdDto,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<SubscriptionLogDto>> {
    // <-- Thay đổi
    const result = await this.subscriptionService.findLogsBySubscriptionId(
      // <-- Thay đổi
      id.id,
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: {
        currentPage: paginationQuery.page,
        pageSize: paginationQuery.pageSize,
        totalItems: result.pagination.totalItems,
        totalPages: Math.ceil(
          result.pagination.totalItems / paginationQuery.pageSize,
        ),
      },
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách lịch sử gói thuê bao thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER, RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết gói thuê bao theo ID' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của gói thuê bao',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin gói thuê bao thành công', // <-- Thay đổi
    type: ApiResponseDto<SubscriptionDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói thuê bao', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền xem gói thuê bao này',
  })
  async findSubscriptionById(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<SubscriptionDetailResponseDto>> {
    // <-- Thay đổi
    const subscription = await this.subscriptionService.findSubscriptionById(
      id,
      userId,
    ) // <-- Thay đổi
    return {
      data: [subscription],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin gói thuê bao thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id/cancel/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // Chỉ người dùng (Driver) mới được xem/hủy vé của mình
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bước 1: Xem trước thông tin hủy vé tháng',
    description:
      'Tính toán số tiền hoàn lại dựa trên chính sách thời gian ( >7 ngày, 3-7 ngày, <3 ngày). API này KHÔNG thực hiện hủy.',
  })
  @ApiParam({
    type: 'string',
    name: 'id',
    description: 'ID của gói thuê bao cần xem trước hủy',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Thông tin chi tiết về chính sách hoàn tiền áp dụng cho vé này.',
    type: SubscriptionCancellationPreviewResponseDto,
  })
  async getCancellationPreview(
    @Param() params: IdDto, // Lấy ID từ URL
    @GetCurrentUserId() userId: string,
  ): Promise<SubscriptionCancellationPreviewResponseDto> {
    return this.subscriptionService.getCancellationPreview(params, userId)
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật gói thuê bao (do Admin can thiệp)' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của gói thuê bao', type: 'string' }) // <-- Thay đổi
  @ApiBody({ type: UpdateSubscriptionDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật gói thuê bao thành công', // <-- Thay đổi
    type: ApiResponseDto<SubscriptionDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói thuê bao', // <-- Thay đổi
  })
  async updateSubscriptionByAdmin(
    @Param() id: IdDto,
    @Body() updateDto: UpdateSubscriptionDto, // <-- Thay đổi
  ): Promise<ApiResponseDto<SubscriptionDetailResponseDto>> {
    // <-- Thay đổi
    const subscription =
      await this.subscriptionService.updateSubscriptionByAdmin(
        // <-- Thay đổi
        id,
        updateDto,
      )
    return {
      data: [subscription],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật gói thuê bao thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hủy một gói thuê bao (do người dùng thực hiện)' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của gói thuê bao',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hủy gói thuê bao thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói thuê bao', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền hủy gói thuê bao này', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Gói đang được sử dụng (isUsed: true), không thể hủy', // <-- Thay đổi
  })
  async cancelSubscription(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
    @UserToken() token: string,
  ): Promise<ApiResponseDto<boolean>> {
    const isCancelled = await this.subscriptionService.cancelSubscription(
      // <-- Thay đổi
      id,
      userId,
      token,
    )
    return {
      data: [isCancelled],
      statusCode: HttpStatus.OK,
      message: 'Hủy gói thuê bao thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('availability/:parkingLotId')
  @ApiOperation({
    summary: 'Lấy tình trạng (số suất) Xô 1 (Thuê bao) cho 15 ngày tới',
  })
  @ApiParam({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
    type: 'string',
  })
  @ApiResponse({
    // ⭐️ 3. SỬA ĐOẠN NÀY
    status: HttpStatus.OK,
    description: 'Trả về bản đồ (map) tình trạng của 15 ngày.',
    schema: {
      // Dùng 'schema' thay vì 'type'
      type: 'object',
      // ⭐️ Báo cho Swagger biết các thuộc tính là động
      additionalProperties: {
        $ref: getSchemaPath(AvailabilitySlotDto), // ⭐️ Và giá trị là kiểu AvailabilitySlotDto
      },
      example: {
        '2025-12-01': { remaining: 5, isAvailable: true },
        '2025-12-02': { remaining: 0, isAvailable: false },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy bãi đỗ xe',
  })
  async getSubscriptionAvailability(
    @Param('parkingLotId') parkingLotId: string,
  ): Promise<ApiResponseDto<any>> {
    // ⭐️ Đổi DTO trả về thành 'any' hoặc 'object'

    const availabilityMap =
      await this.subscriptionService.getSubscriptionAvailability(parkingLotId)

    return {
      data: [availabilityMap],
      statusCode: HttpStatus.OK,
      message: 'Lấy tình trạng suất thuê bao thành công',
      success: true,
    }
  }

  @Get(':id/renewal-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Kiểm tra điều kiện gia hạn (Pre-check trước khi thanh toán)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của gói thuê bao',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Kiểm tra điều kiện thành công',
    type: ApiResponseDto<SubscriptionRenewalEligibilityResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy gói thuê bao',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Không đủ điều kiện gia hạn (Hết chỗ hoặc gói đã hủy)',
  })
  async checkRenewalEligibility(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<SubscriptionRenewalEligibilityResponseDto>> {
    const result = await this.subscriptionService.checkRenewalEligibility(
      id,
      userId,
    )
    return {
      data: [result],
      statusCode: HttpStatus.OK,
      message: 'Kiểm tra điều kiện gia hạn thành công',
      success: true,
    }
  }
}
