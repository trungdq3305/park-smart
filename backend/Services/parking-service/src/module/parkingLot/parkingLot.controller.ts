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
import { IdDto, ParkingLotIdDto, RequestIdDto } from 'src/common/dto/params.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

import {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDeleteRequestDto,
  CreateParkingLotDto,
  CreateParkingLotUpdateRequestDto,
  ParkingLotHistoryLogResponseDto,
  ParkingLotRequestResponseDto,
  ParkingLotResponseDto,
  RequestStatusDto,
  ReviewRequestDto,
} from './dto/parkingLot.dto'
import { RequestStatus, RequestType } from './enums/parkingLot.enum'
import { IParkingLotService } from './interfaces/iparkingLot.service'

@ApiTags('parking-lots')
@Controller('parking-lots')
export class ParkingLotController {
  constructor(
    @Inject(IParkingLotService)
    private readonly parkingLotService: IParkingLotService,
  ) {}

  // ======= Endpoints cho người dùng (Tìm kiếm) =======

  @Get('request-statuses') // Đổi tên route cho rõ ràng hơn
  @ApiOperation({ summary: 'Lấy tất cả các trạng thái của một yêu cầu' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách các trạng thái.',
    type: ApiResponseDto, // Sử dụng DTO chung cho Swagger
  })
  getAllRequestStatuses(): Promise<ApiResponseDto<RequestStatusDto[]>> {
    const statuses: RequestStatusDto[] = Object.values(RequestStatus).map(
      (statusValue) => ({
        status: statusValue,
      }),
    )

    return Promise.resolve({
      data: statuses,
      statusCode: HttpStatus.OK,
      message: 'Lấy tất cả trạng thái thành công',
      success: true,
    })
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Tìm các bãi đỗ xe gần một tọa độ (theo bán kính)' })
  @ApiQuery({ name: 'longitude', type: Number, required: true })
  @ApiQuery({ name: 'latitude', type: Number, required: true })
  @ApiQuery({
    name: 'distance',
    type: Number,
    required: true,
    description: 'Bán kính tìm kiếm (km)',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  async findNearby(
    @Query() coordinates: CoordinatesDto,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('distance') maxDistanceInKm: number,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto[]>> {
    const result = await this.parkingLotService.findNearbyParkingLots(
      coordinates,
      paginationQuery,
      maxDistanceInKm,
    )
    return {
      data: [result.data],
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Tìm bãi đỗ xe lân cận thành công',
      success: true,
    }
  }

  @Get('in-bounds')
  @ApiOperation({ summary: 'Tìm các bãi đỗ xe trong một khung nhìn bản đồ' })
  //@ApiOperation({ summary: 'Tìm các bãi đỗ xe trong một khung nhìn bản đồ' })
  // --- BỔ SUNG CÁC @ApiQuery Ở ĐÂY ---
  @ApiQuery({
    name: 'bottomLeftLng',
    type: Number,
    required: true,
    description: 'Kinh độ của góc dưới-trái',
  })
  @ApiQuery({
    name: 'bottomLeftLat',
    type: Number,
    required: true,
    description: 'Vĩ độ của góc dưới-trái',
  })
  @ApiQuery({
    name: 'topRightLng',
    type: Number,
    required: true,
    description: 'Kinh độ của góc trên-phải',
  })
  @ApiQuery({
    name: 'topRightLat',
    type: Number,
    required: true,
    description: 'Vĩ độ của góc trên-phải',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  async findInBounds(
    @Query() bounds: BoundingBoxDto,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto[]>> {
    const result = await this.parkingLotService.findParkingLotsInBounds(
      bounds,
      paginationQuery,
    )
    return {
      data: [result.data],
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Tìm bãi đỗ xe trong khu vực thành công',
      success: true,
    }
  }

  // ======= Endpoints cho Quản trị viên (Admin) =======
  @Post('create-parking-lot-request')
  @ApiOperation({ summary: 'Tạo yêu cầu tạo mới một bãi đỗ xe' })
  @ApiBody({ type: CreateParkingLotDto })
  async createCreateRequest(
    @Body() createDto: CreateParkingLotDto,
  ): Promise<ApiResponseDto<ParkingLotRequestResponseDto>> {
    const data = await this.parkingLotService.createCreateRequest(createDto)
    return {
      data: [data],
      message: 'Tạo yêu cầu bãi đỗ xe thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Post('send-update-requests/:parkingLotId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Gửi yêu cầu cập nhật thông tin bãi đỗ xe' })
  @ApiParam({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
  })
  @ApiBody({ type: CreateParkingLotUpdateRequestDto })
  async requestUpdate(
    @Param() parkingLotId: ParkingLotIdDto,
    @Body() updateDto: CreateParkingLotUpdateRequestDto,
    @GetCurrentUserId() userId: string,
    @GetCurrenIdOfUserRole() operatorId: string,
  ): Promise<ApiResponseDto<ParkingLotRequestResponseDto>> {
    const historyLog = await this.parkingLotService.createUpdateRequest(
      parkingLotId,
      updateDto,
      userId,
      operatorId,
    )
    return {
      data: [historyLog],
      message: 'Gửi yêu cầu cập nhật thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Post('send-delete-requests/:parkingLotId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Tạo yêu cầu xóa một bãi đỗ xe' })
  @ApiParam({ name: 'parkingLotId', description: 'ID của bãi đỗ xe' })
  @ApiBody({ type: CreateParkingLotDeleteRequestDto })
  async sendRequestDeleteParkingLot(
    @Param() parkingLotId: ParkingLotIdDto,
    @GetCurrentUserId() userId: string,
    @Body() deleteDto: CreateParkingLotDeleteRequestDto,
    @GetCurrenIdOfUserRole() operatorId: string,
  ): Promise<ApiResponseDto<ParkingLotRequestResponseDto>> {
    const result = await this.parkingLotService.createDeleteRequest(
      parkingLotId,
      deleteDto,
      userId,
      operatorId,
    )
    return {
      data: [result],
      message: 'Gửi yêu cầu xóa bãi đỗ xe thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Patch('update-booking-slot-duration/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiOperation({
    summary: 'Cập nhật thời lượng đặt chỗ (booking slot) của một bãi đỗ xe',
  })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookingSlotDurationHours: {
          type: 'number',
          description: 'Thời lượng đặt chỗ mới (tính bằng giờ)',
        },
      },
      example: {
        bookingSlotDurationHours: 2,
      },
    },
  })
  async updateBookingSlotDuration(
    @Param('id') id: string,
    @Body('bookingSlotDurationHours') bookingSlotDurationHours: number,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.parkingLotService.updateBookingSlotDurationHours(
      id,
      bookingSlotDurationHours,
    )
    return {
      data: [result],
      message: 'Cập nhật thời lượng đặt chỗ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get('find-for-operator')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Lấy tất cả bãi đỗ xe của một đơn vị vận hành' })
  async findAllForOperator(
    @GetCurrenIdOfUserRole() operatorId: string,
  ): Promise<ApiResponseDto<ParkingLotResponseDto[]>> {
    const parkingLots =
      await this.parkingLotService.findAllForOperator(operatorId)
    return {
      data: parkingLots,
      message: 'Lấy tất cả bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

@Get('find-by-operatorId')
@ApiOperation({ summary: 'Lấy bãi đỗ xe của Operator theo ID' })
@ApiQuery({
  name: 'operatorId',
  type: String,
  required: true,
  description: 'ID của nhà điều hành bãi đỗ xe',
})
async findByOperatorId(
  @Query('operatorId') operatorId: string, // <--- SỬA: Lấy Operator ID từ query
): Promise<ApiResponseDto<ParkingLotResponseDto[]>> {
  const parkingLots =
    await this.parkingLotService.findAllForOperator(operatorId)
  return {
    data: parkingLots,
    message: 'Lấy bãi đỗ xe thành công',
    statusCode: HttpStatus.OK,
    success: true,
  }
}

  @Get('all-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiQuery({
    name: 'status', // ⭐️ 2. (Khuyến nghị) Đổi tên thành 'status'
    type: String, // (Có thể giữ hoặc bỏ)
    required: true,
    description: 'Lọc theo trạng thái yêu cầu',
    enum: RequestStatus, // ⭐️ 3. THÊM DÒNG NÀY (để tạo dropdown)
    example: RequestStatus.APPROVED, // Thêm ví dụ cho rõ ràng
  })
  @ApiQuery({
    name: 'type', // ⭐️ 2. (Khuyến nghị) Đổi tên thành 'type'
    type: String, // (Có thể giữ hoặc bỏ)
    required: true,
    description: 'Lọc theo trạng thái yêu cầu',
    enum: RequestType, // ⭐️ 3. THÊM DÒNG NÀY (để tạo dropdown)
    example: RequestType.CREATE, // Thêm ví dụ cho rõ ràng
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  @ApiOperation({ summary: 'Lấy tất cả yêu cầu bãi đỗ xe cho admin' })
  async findAllRequests(
    @Query('status') status: RequestStatus,
    @Query('type') type: RequestType,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotRequestResponseDto>> {
    const requests = await this.parkingLotService.getAllRequest(
      status,
      type,
      paginationQuery,
    )
    return {
      data: requests.data,
      pagination: requests.pagination,
      message: 'Lấy tất cả yêu cầu bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get('requests-by-operator/:parkingLotOperatorId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Lấy tất cả yêu cầu bãi đỗ xe của một đơn vị vận hành',
  })
  @ApiParam({
    name: 'parkingLotOperatorId',
    description: 'ID của đơn vị vận hành',
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: true,
    description: 'Lọc theo trạng thái yêu cầu',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  @ApiQuery({
    name: 'type',
    type: String,
    required: true,
    description: 'Lọc theo loại yêu cầu',
    enum: RequestType,
    example: RequestType.UPDATE,
  })
  async findRequestsByOperatorId(
    @Param('parkingLotOperatorId') operatorId: string,
    @Query('status') status: RequestStatus,
    @Query('type') type: RequestType,
  ): Promise<ApiResponseDto<ParkingLotRequestResponseDto[]>> {
    const requests = await this.parkingLotService.findRequestsByOperatorId(
      operatorId,
      status,
      type,
    )
    return {
      data: requests,
      message: 'Lấy yêu cầu bãi đỗ xe của đơn vị vận hành thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bãi đỗ xe cho admin' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiQuery({
    name: 'status', // ⭐️ 2. (Khuyến nghị) Đổi tên thành 'status'
    type: String, // (Có thể giữ hoặc bỏ)
    required: true,
    description: 'Lọc theo trạng thái yêu cầu',
    enum: RequestStatus, // ⭐️ 3. THÊM DÒNG NÀY (để tạo dropdown)
    example: RequestStatus.APPROVED, // Thêm ví dụ cho rõ ràng
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  async findAll(
    @Query('status') parkingLotStatusId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto>> {
    const result = await this.parkingLotService.getAllParkingLots(
      paginationQuery,
      parkingLotStatusId,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bãi đỗ xe thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async findById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<ParkingLotResponseDto>> {
    const parkingLot = await this.parkingLotService.getParkingLotDetails(id)
    return {
      data: [parkingLot],
      message: 'Lấy chi tiết bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  // Removed duplicate findAllForOperator method for 'operator/my-lots' route

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Lấy lịch sử cập nhật của một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async getHistory(
    @Param() parkingLotId: ParkingLotIdDto,
  ): Promise<ApiResponseDto<ParkingLotHistoryLogResponseDto[]>> {
    const history =
      await this.parkingLotService.getHistoryForParkingLot(parkingLotId)
    return {
      data: [history],
      message: 'Lấy lịch sử cập nhật thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Post(':id/check-real-time-status')
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        change: {
          type: 'number',
          description: 'Sự thay đổi số chỗ trống (số dương tăng, số âm giảm)',
        },
      },
      example: {
        change: -1,
      },
    },
  })
  @ApiOperation({
    summary: 'Cập nhật trạng thái thực tế của bãi đỗ xe (dành cho Mobile)',
  })
  async checkRealTimeStatus(
    @Param() id: IdDto,
    @Body('change') change: number,
  ): Promise<ApiResponseDto<boolean>> {
    const result =
      await this.parkingLotService.updateAvailableSpotsForWebsocket(
        id.id,
        change,
      )
    return {
      data: [result],
      message: 'Cập nhật trạng thái thực tế thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch('requests/:requestId/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Duyệt/Từ chối một yêu cầu bất kỳ' })
  @ApiParam({ name: 'requestId', description: 'ID của yêu cầu (Request)' })
  @ApiBody({ type: ReviewRequestDto })
  async reviewRequest(
    @Param() { requestId: requestId }: RequestIdDto,
    @Body() reviewDto: ReviewRequestDto,
    @GetCurrentUserId() adminId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.parkingLotService.reviewRequest(
      { id: requestId },
      reviewDto,
      adminId,
    )
    return {
      data: result.data,
      message: result.message,
      statusCode: result.responseCode,
      success: true,
    }
  }

  @Get('/requests/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một yêu cầu bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của yêu cầu (Request)' })
  async getParkingLotRequestById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<ParkingLotRequestResponseDto>> {
    const request = await this.parkingLotService.findParkingLotRequestById(id)
    return {
      data: [request],
      message: 'Lấy chi tiết yêu cầu bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get(':parkingLotOperatorId/requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR) // Cả Admin và Operator liên quan đều có thể xem
  @ApiOperation({
    summary: '[Admin/Operator] Lấy danh sách các YÊU CẦU của một bãi xe',
  })
  @ApiParam({ name: 'parkingLotOperatorId', description: 'ID của bãi đỗ xe' })
  async getRequestsForParkingLot(
    @Param('parkingLotOperatorId') parkingLotOperatorId: string,
  ): Promise<ApiResponseDto<ParkingLotRequestResponseDto[]>> {
    const requests =
      await this.parkingLotService.getRequestsForParkingLot(
        parkingLotOperatorId,
      )
    return {
      data: requests,
      message: 'Lấy danh sách yêu cầu thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get(':parkingLotId/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiOperation({
    summary: '[Admin/Operator] Lấy LỊCH SỬ THAY ĐỔI đã áp dụng của bãi xe',
  })
  @ApiParam({ name: 'parkingLotId', description: 'ID của bãi đỗ xe' })
  async getHistoryForParkingLot(
    @Param() parkingLotId: ParkingLotIdDto,
  ): Promise<ApiResponseDto<ParkingLotHistoryLogResponseDto[]>> {
    const history =
      await this.parkingLotService.getHistoryForParkingLot(parkingLotId)
    return {
      data: history,
      message: 'Lấy lịch sử thay đổi thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Post('trigger-process-approved-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiOperation({
    summary: 'Kích hoạt xử lý các yêu cầu đã duyệt và đến hạn (CRON Job)',
  })
  async triggerProcessApprovedRequests(): Promise<
    ApiResponseDto<{ processed: number; failed: number }>
  > {
    const result = await this.parkingLotService.processApprovedRequests()
    return {
      data: [result],
      message: 'Xử lý yêu cầu đã duyệt và đến hạn thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Delete('/core/requests/:requestId')
  @ApiOperation({ summary: '[CORE] Xóa vĩnh viễn một yêu cầu bãi đỗ xe' })
  @ApiParam({ name: 'requestId', description: 'ID của yêu cầu (Request)' })
  async hardDeleteRequestById(
    @Param() { requestId }: RequestIdDto,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.parkingLotService.hardDeleteRequestById(requestId)
    return {
      data: [result],
      message: 'Xóa vĩnh viễn yêu cầu bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Delete('admin-delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Xóa vĩnh viễn một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async adminDeleteParkingLot(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ParkingLotResponseDto | null>> {
    const result = await this.parkingLotService.adminDeleteParkingLot(
      id,
      userId,
    )
    return {
      data: [result],
      message: 'Xóa vĩnh viễn bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
