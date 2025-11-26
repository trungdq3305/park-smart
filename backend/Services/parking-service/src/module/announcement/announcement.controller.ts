import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator' // Giả định Decorator lấy Role
import { Roles } from 'src/common/decorators/roles.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'

import {
  AnnouncementResponseDto,
  CreateAnnouncementDto,
} from './dto/announcement.dto'
import { IAnnouncementService } from './interfaces/iannouncement.service'

@ApiTags('admin/announcement')
@Controller('admin/announcements')
@UseGuards(JwtAuthGuard)
@Roles(RoleEnum.ADMIN)
@ApiBearerAuth()
export class AnnouncementController {
  constructor(
    @Inject(IAnnouncementService)
    private readonly announcementService: IAnnouncementService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Tạo và lên lịch một Thông báo Công bố mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ApiResponseDto<AnnouncementResponseDto>,
    description: 'Thông báo được tạo và chờ Cron Job xử lý.',
  })
  async create(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @GetCurrentUserId() adminId: string,
  ): Promise<ApiResponseDto<AnnouncementResponseDto>> {
    const announcement = await this.announcementService.create(
      createAnnouncementDto,
      adminId,
    )

    return {
      data: [announcement],
      message: 'Tạo thông báo và lên lịch thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Post('send-now')
  @ApiOperation({
    summary: 'Admin: Tạo và gửi một Thông báo Công bố NGAY LẬP TỨC',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ApiResponseDto<AnnouncementResponseDto>,
    description: 'Thông báo được tạo (SENT) và gửi đi ngay qua WebSocket.',
  })
  async createAndSendNow(
    @Body() createAnnouncementDto: CreateAnnouncementDto,
    @GetCurrentUserId() adminId: string,
  ): Promise<ApiResponseDto<AnnouncementResponseDto>> {
    // Lưu ý: Trường scheduleAt trong DTO sẽ được bỏ qua khi gọi phương thức này.
    const announcement = await this.announcementService.createAndSendNow(
      createAnnouncementDto,
      adminId,
    )

    return {
      data: [announcement],
      message: 'Tạo và gửi thông báo công bố thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Admin: Lấy danh sách tất cả Thông báo Công bố' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<AnnouncementResponseDto[]>,
  })
  async findAll(): Promise<ApiResponseDto<AnnouncementResponseDto[]>> {
    const announcements =
      (await this.announcementService.findAll()) as AnnouncementResponseDto[]
    return {
      data: announcements,
      message: 'Lấy danh sách thông báo thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
  // NOTE: Thêm các API khác như Get list, Get by ID, Update, Delete ở đây...
}
