// src/module/notification/notification.controller.ts

import {
  Body, // THÊM DECORATOR BODY
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post, // THÊM DECORATOR POST
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'

import {
  CreateNotificationDto,
  NotificationResponseDto,
} from './dto/notification.dto' // THÊM CreateNotificationDto
import { INotificationService } from './interfaces/inotification.service'

@ApiTags('notification')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
  ) {} // ----------------------------------------------------------------------
  // 🔥 API MẪU (Sử dụng để tạo và gửi thông báo từ Controller khác)
  // ----------------------------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'API mẫu: Tạo và gửi thông báo mới' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: ApiResponseDto<NotificationResponseDto>,
    description: 'Thông báo đã được tạo trong DB và gửi qua WebSocket.',
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<ApiResponseDto<NotificationResponseDto>> {
    // Do CreateNotificationDto có cấu trúc giống hệt CreateNotificationInternalDto,
    // ta có thể dùng plainToInstance để chuyển đổi dữ liệu.
    // Hoặc đơn giản là truyền trực tiếp vì type checking sẽ đảm bảo các trường.
    const notification =
      await this.notificationService.createAndSendNotification(
        createNotificationDto,
      )

    return {
      data: [notification],
      message: 'Tạo và gửi thông báo thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  } // ----------------------------------------------------------------------

  @Get()
  @ApiOperation({ summary: 'Lấy lịch sử thông báo của người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<NotificationResponseDto[]>,
  })
  async findAll(
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<NotificationResponseDto[]>> {
    const notifications = (await this.notificationService.getNotifications(
      userId,
    )) as NotificationResponseDto[]
    return {
      data: notifications,
      message: 'Lấy danh sách thông báo thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get('unread-count')
  // ... (Các phương thức khác giữ nguyên) ...
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<number>,
  })
  async getUnreadCount(
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<number>> {
    const count = await this.notificationService.getUnreadCount(userId)
    return {
      data: [count],
      message: 'Lấy số lượng thông báo chưa đọc thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  @ApiParam({ name: 'id', description: 'ID của thông báo' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<NotificationResponseDto>,
  })
  async markAsRead(
    @Param() parameters: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<NotificationResponseDto>> {
    const updatedNotification = await this.notificationService.markAsRead(
      parameters.id,
      userId,
    )
    return {
      data: [updatedNotification],
      message: 'Đánh dấu thông báo đã đọc thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: ApiResponseDto<number>,
  })
  async markAllAsRead(
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<number>> {
    const count = (await this.notificationService.markAllAsRead(
      userId,
    )) as number
    return {
      data: [count], // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      message: `Đã đánh dấu ${count} thông báo là đã đọc`,
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
