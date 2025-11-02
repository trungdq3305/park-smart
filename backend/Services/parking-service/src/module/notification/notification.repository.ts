import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'

import { CreateNotificationInternalDto } from './dto/notification.dto'
import { INotificationRepository } from './interfaces/inotification.repository'
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema'

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    dto: CreateNotificationInternalDto,
  ): Promise<NotificationDocument> {
    const createdNotification = new this.notificationModel({
      ...dto,
      recipientId: new Types.ObjectId(dto.recipientId),
    })
    return createdNotification.save()
  }

  async findByRecipientId(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ recipientId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec()
  }

  async findUnreadCountByRecipientId(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipientId: new Types.ObjectId(userId),
      isRead: false,
    })
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    )
    return result.modifiedCount > 0
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      {
        recipientId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    )
    return result.modifiedCount
  }
}
