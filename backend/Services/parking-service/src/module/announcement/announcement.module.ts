// src/module/announcement/announcement.module.ts

import { forwardRef, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose' // Cần import nếu bạn dùng Mongoose

import { ClientModule } from '../client/client.module'
import { NotificationModule } from '../notification/notification.module'
// --- Import các thành phần của Announcement ---
import { AnnouncementController } from './announcement.controller'
import { AnnouncementRepository } from './announcement.repository'
import { AnnouncementService } from './announcement.service'
import { IAnnouncementRepository } from './interfaces/iannouncement.repository'
import { IAnnouncementService } from './interfaces/iannouncement.service'
import { Announcement, AnnouncementSchema } from './schemas/announcement.schema'

@Module({
  imports: [
    forwardRef(() => NotificationModule),
    // 1. Kết nối Mongoose cho schema Announcement
    ClientModule,
    MongooseModule.forFeature([
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
  ],
  controllers: [AnnouncementController],
  providers: [
    // 2. Cung cấp Repository
    { provide: IAnnouncementRepository, useClass: AnnouncementRepository },

    // 3. Cung cấp Service (Provider)
    { provide: IAnnouncementService, useClass: AnnouncementService },
  ],
  // 4. 🔥 XUẤT SERVICE để các module khác (như NotificationModule) có thể sử dụng
  exports: [IAnnouncementService],
})
export class AnnouncementModule {}
