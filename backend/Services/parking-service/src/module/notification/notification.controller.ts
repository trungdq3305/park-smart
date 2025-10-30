import {
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
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

import { NotificationResponseDto } from './dto/notification.dto'
import { INotificationService } from './interfaces/inotification.service'

@ApiTags('notification')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
  ) {}

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
    const count = (await this.notificationService.markAllAsRead(userId)) as number
    return {
      data: [count],
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      message: `Đã đánh dấu ${count} thông báo là đã đọc`,
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}