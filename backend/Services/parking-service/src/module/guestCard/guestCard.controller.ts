import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
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
  BulkCreateGuestCardsDto,
  BulkImportResultDto,
  CreateGuestCardDto,
  GuestCardResponseDto,
  UpdateGuestCardDto,
} from './dto/guestCard.dto'
import { GuestCardStatus } from './enums/guestCard.enum'
import { IGuestCardService } from './interfaces/iguestCard.service'

@Controller('guest-cards')
@ApiTags('guest-cards')
export class GuestCardController {
  constructor(
    @Inject(IGuestCardService)
    private readonly guestCardService: IGuestCardService,
  ) {}

  // --- 1. TẠO MỚI ĐƠN LẺ ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo một thẻ khách mới (thủ công)' })
  @ApiBody({ type: CreateGuestCardDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Thẻ khách đã được tạo thành công',
    type: ApiResponseDto<GuestCardResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Lỗi trùng lặp (UID hoặc Mã định danh đã tồn tại trong bãi xe)',
  })
  async createGuestCard(
    @Body() createDto: CreateGuestCardDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<GuestCardResponseDto>> {
    const guestCard = await this.guestCardService.createGuestCard(
      createDto,
      userId,
    )
    return {
      data: [guestCard],
      statusCode: HttpStatus.CREATED,
      message: 'Thẻ khách đã được tạo thành công',
      success: true,
    }
  }

  // --- 2. NHẬP KHO HÀNG LOẠT (BULK) ---
  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Nhập kho thẻ hàng loạt (Bulk Import)' })
  @ApiBody({ type: BulkCreateGuestCardsDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Quá trình nhập kho hoàn tất (có thể có lỗi một phần)',
    type: ApiResponseDto<BulkImportResultDto>,
  })
  async bulkCreateGuestCards(
    @Body() bulkDto: BulkCreateGuestCardsDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<BulkImportResultDto>> {
    const result = await this.guestCardService.bulkCreateGuestCards(
      bulkDto,
      userId,
    )

    // Logic trả về message tùy thuộc vào kết quả
    let message = 'Nhập kho hoàn tất'
    if (result.failureCount > 0 && result.successCount > 0) {
      message = `Hoàn tất một phần: ${String(result.successCount)} thành công, ${String(result.failureCount)} thất bại`
    } else if (result.failureCount > 0 && result.successCount === 0) {
      message = 'Nhập kho thất bại toàn bộ'
    }

    return {
      data: [result], // ApiResponseDto yêu cầu mảng
      statusCode: HttpStatus.CREATED,
      message: message,
      success: true,
    }
  }

  // --- 3. LẤY DANH SÁCH (PAGINATION) ---
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách thẻ của một bãi xe' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách thẻ khách',
    type: PaginatedResponseDto<GuestCardResponseDto>,
  })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: true, type: Number, example: 10 })
  @ApiQuery({
    name: 'parkingLotId',
    required: true,
    type: String,
    description: 'ID bãi xe cần lấy danh sách',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: GuestCardStatus,
    description: 'Lọc theo trạng thái thẻ',
  })
  async getAllGuestCards(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('parkingLotId') parkingLotId: string,
    @Query('status') status?: GuestCardStatus,
  ): Promise<PaginatedResponseDto<GuestCardResponseDto>> {
    // Lưu ý: PaginationQueryDto của bạn thường có page/pageSize.
    // Nếu parkingLotId không nằm trong PaginationQueryDto, ta lấy riêng từ @Query
    const { page = 1, pageSize = 10 } = paginationQuery

    const result = await this.guestCardService.findAllGuestCards(
      parkingLotId,
      page,
      pageSize,
      status,
    )

    return result
  }

  // --- 4. TÌM KIẾM THEO NFC UID (CHO CHECK-IN) ---
  @Get('nfc-lookup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tìm thẻ bằng mã NFC UID (Dùng cho Check-in)' })
  @ApiQuery({ name: 'nfcUid', required: true, type: String })
  @ApiQuery({ name: 'parkingLotId', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thông tin thẻ tìm thấy',
    type: ApiResponseDto<GuestCardResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Thẻ chưa được đăng ký trong hệ thống',
  })
  async findByNfc(
    @Query('nfcUid') nfcUid: string,
    @Query('parkingLotId') parkingLotId: string,
  ): Promise<ApiResponseDto<GuestCardResponseDto>> {
    const card = await this.guestCardService.findGuestCardByNfc(
      nfcUid,
      parkingLotId,
    )

    if (!card) {
      throw new NotFoundException(
        `Thẻ có UID ${nfcUid} chưa được đăng ký tại bãi xe này`,
      )
    }

    return {
      data: [card],
      statusCode: HttpStatus.OK,
      message: 'Tìm thấy thẻ thành công',
      success: true,
    }
  }

  // --- 5. LẤY CHI TIẾT THEO ID ---
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết thẻ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của thẻ', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<GuestCardResponseDto>,
  })
  async getGuestCardById(
    @Param() params: IdDto,
  ): Promise<ApiResponseDto<GuestCardResponseDto>> {
    const card = await this.guestCardService.findGuestCardById(params.id)
    return {
      data: [card],
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin thẻ thành công',
      success: true,
    }
  }

  // --- 6. CẬP NHẬT ---
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin thẻ' })
  @ApiParam({ name: 'id', description: 'ID của thẻ', type: 'string' })
  @ApiBody({ type: UpdateGuestCardDto })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<GuestCardResponseDto>,
  })
  async updateGuestCard(
    @Param() params: IdDto,
    @Body() updateDto: UpdateGuestCardDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<GuestCardResponseDto>> {
    const updatedCard = await this.guestCardService.updateGuestCard(
      params.id,
      updateDto,
      userId,
    )
    return {
      data: [updatedCard],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thẻ thành công',
      success: true,
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật trạng thái thẻ' })
  @ApiParam({ name: 'id', description: 'ID của thẻ', type: 'string' })
  @ApiQuery({
    name: 'status',
    required: true,
    enum: GuestCardStatus,
    description: 'Cập nhật theo trạng thái thẻ',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<GuestCardResponseDto>,
  })
  async updateGuestCardStatus(
    @Param() params: IdDto,
    @Query('status') status: string,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<GuestCardResponseDto>> {
    const updatedCard = await this.guestCardService.updateGuestCardStatus(
      params.id,
      status,
      userId,
    )
    return {
      data: [updatedCard],
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái thẻ thành công',
      success: true,
    }
  }

  // --- 7. XÓA MỀM ---
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa mềm thẻ (Vô hiệu hóa)' })
  @ApiParam({ name: 'id', description: 'ID của thẻ', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<boolean>,
  })
  async deleteGuestCard(
    @Param() params: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.guestCardService.softDeleteGuestCard(
      params.id,
      userId,
    )
    return {
      data: [result],
      statusCode: HttpStatus.OK,
      message: 'Xóa thẻ thành công',
      success: true,
    }
  }
}
