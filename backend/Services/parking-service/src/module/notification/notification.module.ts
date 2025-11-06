import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt' // Bắt buộc phải có để WsJwtAuthGuard hoạt động
import { MongooseModule } from '@nestjs/mongoose'

import { AnnouncementModule } from '../announcement/announcement.module'
import { ClientModule } from '../client/client.module'
import { INotificationRepository } from './interfaces/inotification.repository'
import { INotificationService } from './interfaces/inotification.service'
import { NotificationController } from './notification.controller'
import { NotificationGateway } from './notification.gateway'
import { NotificationRepository } from './notification.repository'
import { NotificationScheduler } from './notification.scheduler'
import { NotificationService } from './notification.service'
import { Notification, NotificationSchema } from './schemas/notification.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    ConfigModule,
    // Cấu hình JwtModule PHẢI khớp với JwtModule dùng để sign token
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'YOUR_SECRET_KEY',
      // Các tùy chọn khác (expiresIn, signOptions)
    }),
    AnnouncementModule,
    ClientModule,
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
    NotificationScheduler,
  ],
  exports: [INotificationService],
})
export class NotificationModule {}
