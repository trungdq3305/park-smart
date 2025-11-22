import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  Inject,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Express } from 'express'
// Decorators & Guards
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { Roles } from 'src/common/decorators/roles.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { PaginatedResponseDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

// DTOs
import {
  CheckInDto,
  ParkingLotSessionResponseDto,
  // (Bạn có thể tạo thêm CheckoutFeeDto nếu cần)
} from './dto/parkingLotSession.dto'
// Interface Service
import { IParkingLotSessionService } from './interfaces/iparkingLotSession.service'

@Controller('parking-sessions')
@ApiTags('parking-sessions')
export class ParkingLotSessionController {
  constructor(
    @Inject(IParkingLotSessionService)
    private readonly sessionService: IParkingLotSessionService,
  ) {}

  // =================================================================
  // 1. API CHECK-IN TỔNG HỢP (VÃNG LAI / QR)
  // =================================================================
  @Post('check-in/:parkingLotId')
  @ApiOperation({
    summary: 'Check-in Tổng hợp (All-in-One)',
    description:
      'Xử lý xe vào bãi. Tự động phát hiện loại khách (Vãng lai, Vé tháng, Đặt trước) dựa trên dữ liệu gửi lên.',
  })
  @ApiParam({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
    type: 'string',
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dữ liệu check-in và file ảnh',
    type: CheckInDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Check-in thành công',
    type: ApiResponseDto<ParkingLotSessionResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi (Hết chỗ, vé đang dùng...)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lỗi (Không tìm thấy bãi xe hoặc mã QR)',
  })
  async checkIn(
    @Param('parkingLotId') parkingLotId: string,
    @Body() checkInDto: CheckInDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
        fileIsRequired: false, // Ảnh không bắt buộc
      }),
    )
    file: Express.Multer.File,
  ): Promise<ApiResponseDto<ParkingLotSessionResponseDto>> {
    const session = await this.sessionService.checkIn(
      parkingLotId,
      checkInDto,
      file,
    )

    return {
      data: [session],
      statusCode: HttpStatus.CREATED,
      message: 'Check-in thành công. Mời vào.',
      success: true,
    }
  }

  // =================================================================
  // 2. API TÍNH PHÍ CHECK-OUT (VÃNG LAI / LỐ GIỜ)
  // =================================================================
  @Post('check-out/calculate-fee/:parkingLotId')
  @ApiOperation({
    summary: 'Tính phí đỗ xe (Bước 1 của Check-out)',
    description:
      'Dùng cho khách vãng lai (hoặc đặt trước lố giờ) để biết số tiền cần trả trước khi gọi thanh toán.',
  })
  @ApiParam({ name: 'parkingLotId', description: 'ID của bãi đỗ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uidCard: {
          type: 'string',
          example: 'UID_abc123',
          description: 'UID của thẻ NFC (nếu có)',
        },
        identifier: {
          type: 'string',
          example: 'ID_abc123',
          description: 'Mã định danh khác (nếu có)',
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pricingPolicyId: {
          type: 'string',
          example: 'POLICY_abc...',
          description: 'ID của chính sách giá đã áp dụng (nếu cần)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tính phí thành công',
    // type: ApiResponseDto<CheckoutFeeResponseDto>, // (Bạn nên tạo DTO này)
  })
  async calculateCheckoutFee(
    @Param('parkingLotId') parkingLotId: string,
    @Body('pricingPolicyId') pricingPolicyId: string,
    @Body('uidCard') uidCard?: string,
    @Body('identifier') identifier?: string,
  ): Promise<ApiResponseDto<any>> {
    const feeDetails = await this.sessionService.calculateCheckoutFee(
      parkingLotId,
      pricingPolicyId,
      uidCard,
      identifier,
    )

    return {
      data: [feeDetails], // Trả về chi tiết phí (số tiền, giờ vào/ra...)
      statusCode: HttpStatus.OK,
      message: 'Tính phí thành công.',
      success: true,
    }
  }

  // =================================================================
  // 3. API XÁC NHẬN CHECK-OUT (SAU KHI THANH TOÁN)
  // =================================================================
  @Post('check-out/confirm/:sessionId')
  @ApiOperation({
    summary: 'Xác nhận Check-out và Đóng phiên (Bước 2)',
    description:
      'Gọi sau khi thanh toán thành công (hoặc nếu phí = 0). Mở barie ra.',
  })
  @ApiParam({ name: 'sessionId', description: 'ID của phiên đỗ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentId: {
          type: 'string',
          example: 'TXN_abc...',
          description: 'Bằng chứng thanh toán từ .NET (nếu có trả phí)',
        },
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pricingPolicyId: {
          type: 'string',
          example: 'POLICY_abc...',
          description: 'ID của chính sách giá đã áp dụng (nếu cần)',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check-out thành công. Barie mở.',
    type: ApiResponseDto<boolean>,
  })
  async confirmWalkInCheckout(
    @Param('sessionId') sessionId: string,
    @GetCurrentUserId() userId: string,
    @Body('paymentId') paymentId?: string,
    @Body('pricingPolicyId') pricingPolicyId?: string,
  ): Promise<ApiResponseDto<boolean>> {
    const success = await this.sessionService.confirmCheckout(
      sessionId,
      userId,
      paymentId,
      pricingPolicyId,
    )

    return {
      data: [success],
      statusCode: HttpStatus.OK,
      message: 'Check-out thành công. Cảm ơn quý khách.',
      success: true,
    }
  }

  // =================================================================
  // 4. API LỊCH SỬ (NGƯỜI DÙNG)
  // =================================================================
  @Get('my-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử ra/vào của người dùng hiện tại' })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, type: Number, example: 20 })
  async getMyHistory(
    @GetCurrentUserId() userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotSessionResponseDto>> {
    const result = await this.sessionService.findAllSessionsByUserId(
      userId,
      paginationQuery,
    )

    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy lịch sử thành công',
      success: true,
    }
  }

  // =================================================================
  // 5. API LỊCH SỬ (ADMIN/OPERATOR)
  // =================================================================
  @Get('history/:parkingLotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lấy lịch sử ra/vào của một bãi xe' })
  @ApiParam({ name: 'parkingLotId', description: 'ID bãi xe' })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, type: Number, example: 20 })
  async getHistoryByParkingLot(
    @Param('parkingLotId') parkingLotId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotSessionResponseDto>> {
    const result = await this.sessionService.findAllSessionsByParkingLot(
      parkingLotId,
      paginationQuery,
    )

    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy lịch sử bãi xe thành công',
      success: true,
    }
  }

  // =================================================================
  // 6. API CHI TIẾT PHIÊN (KÈM ẢNH)
  // =================================================================
  @Get(':sessionId/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR, RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy chi tiết phiên đỗ xe (bao gồm cả hình ảnh check-in/out)',
  })
  async getSessionDetails(
    @Param('sessionId') sessionId: string,
  ): Promise<ApiResponseDto<any>> {
    // (Trả về DTO gộp Session + Images)

    const details =
      await this.sessionService.getSessionDetailsWithImages(sessionId)

    return {
      data: [details],
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết phiên thành công',
      success: true,
    }
  }

  @Get('status/check')
  @ApiOperation({
    summary: 'Kiểm tra trạng thái xe (Để biết là Check-in hay Check-out)',
  })
  @ApiQuery({
    name: 'identifier',
    required: true,
    description: 'NFC UID hoặc QR Identifier',
  })
  @ApiQuery({ name: 'parkingLotId', required: true })
  async checkSessionStatus(
    @Query('identifier') identifier: string,
    @Query('parkingLotId') parkingLotId: string,
  ) {
    // Gọi Service kiểm tra xem có session nào đang ACTIVE không
    // Bạn cần viết hàm này trong Service, tái sử dụng logic findActiveSessionByNfc/Plate
    const session = await this.sessionService.findActiveSession(
      identifier,
      parkingLotId,
    )

    if (session) {
      return {
        state: 'INSIDE',
        message: 'Xe đang trong bãi -> Chuyển sang Check-out',
        session: session, // Trả về thông tin lúc vào để hiện ảnh đối chiếu
      }
    } else {
      return {
        state: 'OUTSIDE',
        message: 'Xe đang ở ngoài -> Chuyển sang Check-in',
        session: null,
      }
    }
  }
}
