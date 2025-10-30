import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt' // Bắt buộc phải có để WsJwtAuthGuard hoạt động
import { MongooseModule } from '@nestjs/mongoose'

import { INotificationRepository } from './interfaces/inotification.repository'
import { INotificationService } from './interfaces/inotification.service'
import { NotificationController } from './notification.controller'
import { NotificationGateway } from './notification.gateway'
import { NotificationRepository } from './notification.repository'
import { NotificationService } from './notification.service'
import { Notification, NotificationSchema } from './schemas/notification.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    // Cấu hình JwtModule PHẢI khớp với JwtModule dùng để sign token
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'YOUR_SECRET_KEY', 
      // Các tùy chọn khác (expiresIn, signOptions)
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationGateway, 
    {
      provide: INotificationService,
      useClass: NotificationService,
    },
    {
      provide: INotificationRepository,
      useClass: NotificationRepository,
    },
  ],
  exports: [INotificationService], 
})
export class NotificationModule {}