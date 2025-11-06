import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { IAnnouncementRepository } from './interfaces/iannouncement.repository'
import {
  Announcement,
  AnnouncementDocument,
} from './schemas/announcement.schema'

@Injectable()
export class AnnouncementRepository implements IAnnouncementRepository {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<AnnouncementDocument>,
  ) {}

  async create(data: any): Promise<AnnouncementDocument> {
    const newAnnouncement = new this.announcementModel(data)
    return newAnnouncement.save()
  }

  async findPendingScheduled(
    currentTime: Date,
  ): Promise<AnnouncementDocument[]> {
    // Tìm những thông báo có:
    // 1. scheduleAt <= currentTime (đã đến giờ)
    // 2. status là 'SCHEDULED' (chưa được gửi)
    return this.announcementModel
      .find({
        scheduleAt: { $lte: currentTime },
        status: 'SCHEDULED',
      })
      .exec()
  }

  async markAsSent(announcementId: string): Promise<void> {
    await this.announcementModel
      .findByIdAndUpdate(
        announcementId,
        {
          $set: { status: 'SENT', sentAt: new Date() },
        },
        { new: true },
      )
      .exec()
  }

  async findAll(): Promise<AnnouncementDocument[]> {
    return this.announcementModel.find().exec()
  }
}
