import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ClientSession, Model } from 'mongoose'

import { IBookingInventoryRepository } from './interfaces/ibookingInventory.repository'
import { BookingInventory } from './schemas/bookingInventory.schema'

@Injectable()
export class BookingInventoryRepository implements IBookingInventoryRepository {
  constructor(
    @InjectModel(BookingInventory.name)
    private bookingInventoryModel: Model<BookingInventory>,
  ) {}

  /**
   * 1. HÀM BẠN YÊU CẦU
   * Lấy danh sách các bản ghi tồn kho cho một bãi xe trong một khoảng thời gian.
   */
  async findInventoriesInTimeRange(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    session?: ClientSession,
  ): Promise<BookingInventory[]> {
    // ⭐️ Định nghĩa điều kiện lọc (filter)
    const filter = {
      parkingLotId: parkingLotId,
      timeSlot: {
        $gte: startTime, // Lớn hơn hoặc bằng thời gian bắt đầu
        $lt: endTime, // ⛔️ Nhỏ hơn (không bằng) thời gian kết thúc
      },
    }

    // ⭐️ Xây dựng query
    const query = this.bookingInventoryModel.find(filter)

    // ⭐️ Gán session nếu đang trong transaction
    if (session) {
      query.session(session)
    }

    return query.exec()
  }

  /**
   * 2. HÀM CẬP NHẬT (QUAN TRỌNG)
   * Cập nhật (tăng/giảm) bookedCount cho tất cả các khung giờ bị ảnh hưởng.
   * Tự động tạo mới (upsert) nếu khung giờ chưa tồn tại.
   */
  async updateInventoryCounts(
    parkingLotId: string,
    startTime: Date,
    endTime: Date,
    increment: number, // (ví dụ: +1 khi đặt, -1 khi hủy)
    session: ClientSession, // Yêu cầu session vì đây là thao tác ghi
  ): Promise<boolean> {
    // 1. Tính toán tất cả các khung giờ bị ảnh hưởng (giả sử 1 giờ/khung)
    const slotsToUpdate: Date[] = []
    const currentSlot = new Date(startTime.getTime())

    while (currentSlot < endTime) {
      slotsToUpdate.push(new Date(currentSlot.getTime()))
      // Tăng lên 1 giờ cho vòng lặp tiếp theo
      currentSlot.setHours(currentSlot.getHours() + 1)
    }
    // Ví dụ: slotsToUpdate = [Date('9:00'), Date('10:00'), Date('11:00')]

    // 2. Nếu không có gì để cập nhật, trả về thành công
    if (slotsToUpdate.length === 0) {
      return true
    }

    // 3. Tạo các thao tác (operations) cho bulkWrite
    const operations = slotsToUpdate.map((slot) => ({
      updateOne: {
        filter: { parkingLotId: parkingLotId, timeSlot: slot },
        update: {
          $inc: { bookedCount: increment }, // ⭐️ Tăng/Giảm giá trị
          // $setOnInsert sẽ chỉ chạy nếu đây là thao tác TẠO MỚI (upsert)
          $setOnInsert: {
            parkingLotId: parkingLotId,
            timeSlot: slot,
            // (Mongoose sẽ tự xử lý createdAt/updatedAt
            // nếu bạn có {timestamps: true} trong Schema)
          },
        },
        upsert: true, // ⭐️ Rất quan trọng: Tự động TẠO MỚI nếu chưa có
      },
    }))

    // 4. Thực thi hàng loạt (atomic)
    const result = await this.bookingInventoryModel.bulkWrite(operations, {
      session: session, // Đảm bảo chạy trong transaction
    })

    return result.isOk() // Trả về true nếu tất cả thao tác thành công
  }

  /**
   * 3. HÀM DỌN DẸP (CHO CRON JOB)
   * Xóa tất cả các bản ghi tồn kho đã lỗi thời (trong quá khứ).
   */
  async deleteInventoriesBefore(cutoffTime: Date): Promise<number> {
    const result = await this.bookingInventoryModel
      .deleteMany({
        timeSlot: { $lt: cutoffTime }, // Xóa tất cả slot TRƯỚC thời gian "cắt"
      })
      .exec()

    return result.deletedCount // Trả về số lượng đã xóa
  }

  async findInventoriesForAvailability(
    parkingLotId: string,
    startTime: Date, // 00:00
    endTime: Date, // 23:59
  ): Promise<Pick<BookingInventory, 'timeSlot' | 'bookedCount'>[]> {
    const filter = {
      parkingLotId: parkingLotId,
      timeSlot: {
        $gte: startTime,
        $lt: endTime,
      },
    }

    return this.bookingInventoryModel
      .find(filter)
      .select('timeSlot bookedCount') // ⭐️ Chỉ lấy 2 trường này để tối ưu
      .lean() // Trả về JS object thuần túy
      .exec()
  }
}
