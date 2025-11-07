import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { INotificationService } from './interfaces/inotification.service'

@Injectable()
export class NotificationScheduler {
  constructor(
    @Inject(INotificationService)
    private readonly notificationService: INotificationService,
  ) {}

  /**
   * @description Chạy tác vụ xử lý các Announcement đã được lên lịch mỗi phút.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledAnnouncements() {
    console.log(
      '[Cron Job] Bắt đầu kiểm tra và xử lý các Announcement đã lên lịch...',
    )
    try {
      await this.notificationService.processScheduledAnnouncements()
    } catch (error) {
      console.error(
        '[Cron Job Error] Lỗi khi xử lý Announcement:',
        error.message,
      )
    }
  }
}
