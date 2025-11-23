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
  ApiParam, // ⭐️ Thêm ApiParam
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
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
  ConfirmReservationPaymentDto,
  CreateReservationDto,
  ReservationAvailabilitySlotDto,
  ReservationDetailResponseDto,
  UpdateReservationStatusDto,
} from './dto/reservation.dto' // <-- Thay đổi
import { IReservationService } from './interfaces/ireservation.service' // <-- Thay đổi

@Controller('reservations') // <-- Thay đổi
@ApiTags('reservations') // <-- Thay đổi
export class ReservationController {
  constructor(
    @Inject(IReservationService) // <-- Thay đổi
    private readonly reservationService: IReservationService, // <-- Thay đổi
  ) {}

  @Get('availability/:parkingLotId')
  @ApiOperation({
    summary: 'Lấy tình trạng chỗ đặt trước (Xô 2) theo giờ trong ngày',
  })
  @ApiParam({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
    type: 'string',
  })
  @ApiQuery({
    name: 'date',
    description: 'Ngày cần xem (YYYY-MM-DD)',
    required: true,
    example: '2025-11-20',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trả về Map tình trạng từng giờ (00:00 -> 23:00).',
    schema: {
      type: 'object',
      // ⭐️ Cấu hình Dynamic Key cho Swagger
      additionalProperties: {
        $ref: getSchemaPath(ReservationAvailabilitySlotDto),
      },
      example: {
        '08:00': { remaining: 30, isAvailable: true },
        '09:00': { remaining: 5, isAvailable: true },
        '10:00': { remaining: 0, isAvailable: false },
      },
    },
  })
  async getReservationAvailability(
    @Param('parkingLotId') parkingLotId: string,
    @Query('date') date: string,
  ): Promise<ApiResponseDto<any>> {
    // Trả về any/object

    const availabilityMap =
      await this.reservationService.getReservationAvailability(
        parkingLotId,
        date,
      )

    return {
      data: [availabilityMap],
      statusCode: HttpStatus.OK,
      message: 'Lấy tình trạng đặt chỗ thành công',
      success: true,
    }
  }

  // =================================================================
  // 1. API TẠO BẢN NHÁP (HÓA ĐƠN)
  // =================================================================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // Giả sử DRIVER là người dùng
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một Hóa đơn (draft) Đặt chỗ mới (Xô 2)' }) // <-- Thay đổi
  @ApiBody({ type: CreateReservationDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hóa đơn (draft) Đặt chỗ đã được tạo thành công.', // <-- Thay đổi
    type: ApiResponseDto<ReservationDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi (ví dụ: đã hết suất đặt chỗ cho khung giờ này)', // <-- Thay đổi
  })
  async createReservation(
    @Body() createDto: CreateReservationDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ReservationDetailResponseDto>> {
    // <-- Thay đổi
    const reservation = await this.reservationService.createReservation(
      // <-- Thay đổi
      createDto,
      userId,
    )
    return {
      data: [reservation],
      statusCode: HttpStatus.CREATED,
      message: 'Hóa đơn Đặt chỗ đã được tạo (chờ thanh toán).', // <-- Thay đổi
      success: true,
    }
  }

  // =================================================================
  // 2. API KÍCH HOẠT THANH TOÁN
  // =================================================================
  @Patch(':id/confirm-payment') // ⭐️ Dùng PATCH
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // Cùng người dùng đã tạo hóa đơn
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kích hoạt Đặt chỗ (Xác nhận thanh toán)' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của Đơn đặt chỗ (Reservation) đang PENDING', // <-- Thay đổi
    type: 'string',
  })
  @ApiBody({ type: ConfirmReservationPaymentDto }) // <-- Thay đổi (Dùng DTO)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đặt chỗ đã được kích hoạt thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>, // <-- Thay đổi (Giả định service trả về DTO)
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lỗi (ví dụ: thanh toán đã được sử dụng, vé đã active)', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy hóa đơn (Reservation) để kích hoạt', // <-- Thay đổi
  })
  async confirmReservationPayment(
    @Param() id: IdDto, // <-- Lấy ID DTO
    @Body() confirmDto: ConfirmReservationPaymentDto, // <-- Lấy Body DTO
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    // <-- Thay đổi
    const reservation = await this.reservationService.confirmReservationPayment(
      // <-- Thay đổi
      id,
      confirmDto,
      userId,
    )

    return {
      data: [reservation], // <-- Giả định service trả về DTO
      statusCode: HttpStatus.OK,
      message: 'Đặt chỗ đã được kích hoạt thành công.', // <-- Thay đổi
      success: true,
    }
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy tất cả đơn đặt chỗ của người dùng hiện tại', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách đơn đặt chỗ của người dùng hiện tại', // <-- Thay đổi
    type: PaginatedResponseDto<ReservationDetailResponseDto>, // <-- Thay đổi
  })
  @ApiQuery({ name: 'page', required: true, type: Number })
  @ApiQuery({ name: 'pageSize', required: true, type: Number })
  async findAllByUserId(
    @GetCurrentUserId() userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ReservationDetailResponseDto>> {
    // <-- Thay đổi
    const result = await this.reservationService.findAllByUserId(
      // <-- Thay đổi
      userId,
      paginationQuery,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đặt chỗ thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get('identifier/:identifier')
  // (Không có Guard: Endpoint này được gọi bởi IOT/Scanner
  // nên được bảo mật bằng cơ chế khác, ví dụ: IP Whitelist hoặc API Key nội bộ)
  @ApiOperation({
    summary: 'Lấy thông tin vé bằng mã QR (cho Barie/Scanner)', // <-- Thay đổi
  })
  @ApiParam({
    name: 'identifier',
    description: 'Mã định danh (UUID) từ QR code',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin vé đặt chỗ thành công', // <-- Thay đổi
    type: ApiResponseDto<ReservationDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy vé hoặc vé không hợp lệ (đã check-in/hết hạn)', // <-- Thay đổi
  })
  async findValidReservationForCheckIn(
    @Param('identifier') identifier: string, // <-- Thay đổi
  ): Promise<ApiResponseDto<ReservationDetailResponseDto>> {
    // <-- Thay đổi
    const reservation =
      await this.reservationService.findValidReservationForCheckIn(
        // <-- Thay đổi
        identifier,
      )
    return {
      data: [reservation],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin vé đặt chỗ thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER) // Chỉ chủ nhân của vé mới được xem
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin chi tiết vé đặt chỗ theo ID' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của đơn đặt chỗ',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin đặt chỗ thành công', // <-- Thay đổi
    type: ApiResponseDto<ReservationDetailResponseDto>, // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn đặt chỗ', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền xem đơn đặt chỗ này',
  })
  async findReservationById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<ReservationDetailResponseDto>> {
    // <-- Thay đổi
    const reservation = await this.reservationService.findReservationById(id) // <-- Thay đổi
    return {
      data: [reservation],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin đặt chỗ thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái Đặt chỗ (do Admin can thiệp)' }) // <-- Thay đổi
  @ApiParam({ name: 'id', description: 'ID của đơn đặt chỗ', type: 'string' }) // <-- Thay đổi
  @ApiBody({ type: UpdateReservationStatusDto }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật trạng thái thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>, // <-- Thay đổi (Theo Interface)
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn đặt chỗ', // <-- Thay đổi
  })
  async updateReservationStatusByAdmin(
    @Param() id: IdDto,
    @Body() updateDto: UpdateReservationStatusDto, // <-- Thay đổi
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    // <-- Thay đổi
    const isUpdated =
      await this.reservationService.updateReservationStatusByAdmin(
        // <-- Thay đổi
        id,
        updateDto,
        userId,
      )
    return {
      data: [isUpdated],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái thành công', // <-- Thay đổi
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hủy một đơn đặt chỗ (do người dùng thực hiện)' }) // <-- Thay đổi
  @ApiParam({
    name: 'id',
    description: 'ID của đơn đặt chỗ',
    type: 'string',
  }) // <-- Thay đổi
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hủy đặt chỗ thành công', // <-- Thay đổi
    type: ApiResponseDto<boolean>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy đơn đặt chỗ', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền hủy đơn đặt chỗ này', // <-- Thay đổi
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Không thể hủy (ví dụ: quá gần giờ bắt đầu)', // <-- Thay đổi
  })
  async cancelReservationByUser(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const isCancelled = await this.reservationService.cancelReservationByUser(
      // <-- Thay đổi
      id,
      userId,
    )
    return {
      data: [isCancelled],
      statusCode: HttpStatus.OK,
      message: 'Hủy đặt chỗ thành công', // <-- Thay đổi
      success: true,
    }
  }
}
