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

import {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDto,
  ParkingLotResponseDto,
  UpdateParkingLotHistoryLogDto,
} from './dto/parkingLot.dto'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { ParkingLot } from './schemas/parkingLot.schema'
import { ParkingLotHistoryLog } from './schemas/parkingLotHistoryLog.schema'

@ApiTags('parking-lots')
@Controller('parking-lots')
export class ParkingLotController {
  constructor(
    @Inject(IParkingLotService)
    private readonly parkingLotService: IParkingLotService,
  ) {}

  // ======= Endpoints cho người dùng (Tìm kiếm) =======

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
  @ApiOperation({ summary: 'Tìm các bãi đỗ xe trong một khung nhìn bản đồ' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @Post()
  @ApiOperation({ summary: 'Tạo một bãi đỗ xe mới (chờ duyệt)' })
  @ApiBody({ type: CreateParkingLotDto })
  async create(
    @Body() createDto: CreateParkingLotDto,
    @GetCurrentUserId() userId: string,
    @GetCurrenIdOfUserRole() currentIdOfUserRole: string,
  ): Promise<ApiResponseDto<ParkingLotResponseDto>> {
    const newParkingLot = await this.parkingLotService.createParkingLot(
      createDto,
      userId,
      currentIdOfUserRole,
    )
    return {
      data: [newParkingLot],
      message: 'Tạo bãi đỗ xe thành công, đang chờ duyệt',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bãi đỗ xe cho admin' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiQuery({
    name: 'statusId',
    type: String,
    required: true,
    description: 'ID của trạng thái cần lọc',
  })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query() parkingLotStatus: IdDto,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto[]>> {
    const result = await this.parkingLotService.getAllParkingLots(
      paginationQuery,
      parkingLotStatus,
    )
    return {
      data: [result.data],
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bãi đỗ xe thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async findById(@Param() id: IdDto): Promise<ApiResponseDto<ParkingLot>> {
    const parkingLot = await this.parkingLotService.getParkingLotDetails(id)
    return {
      data: [parkingLot],
      message: 'Lấy chi tiết bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Duyệt hoặc từ chối một bãi đỗ xe mới' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({ schema: { example: { statusId: '...' } } })
  async approve(
    @Param() parkingLotId: IdDto,
    @Body('statusId') statusId: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ParkingLot>> {
    const approvedParkingLot =
      await this.parkingLotService.approveNewParkingLot(
        parkingLotId,
        statusId,
        userId,
      )
    return {
      data: [approvedParkingLot],
      message: 'Duyệt bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Post(':id/update-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Gửi yêu cầu cập nhật thông tin bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({ type: UpdateParkingLotHistoryLogDto })
  async requestUpdate(
    @Param() parkingLotId: IdDto,
    @Body() updateDto: UpdateParkingLotHistoryLogDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ParkingLotHistoryLog>> {
    const historyLog = await this.parkingLotService.requestParkingLotUpdate(
      parkingLotId,
      updateDto,
      userId,
    )
    return {
      data: [historyLog],
      message: 'Gửi yêu cầu cập nhật thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Lấy lịch sử cập nhật của một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async getHistory(
    @Param() parkingLotId: IdDto,
  ): Promise<ApiResponseDto<ParkingLotHistoryLog[]>> {
    const history =
      await this.parkingLotService.getUpdateHistoryLogForParkingLot(
        parkingLotId,
      )
    return {
      data: [history],
      message: 'Lấy lịch sử cập nhật thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Xóa một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async delete(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.parkingLotService.deleteParkingLot(id, userId)
    return {
      data: [result],
      message: 'Xóa bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
