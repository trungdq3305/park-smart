import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import mongoose from 'mongoose'

export type ParkingDailyDashboardDocument =
  HydratedDocument<ParkingDailyDashboard>

@Schema({ timestamps: true })
export class ParkingDailyDashboard {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id: string

  @Prop({
    required: true,
    index: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
  })
  parkingLotId: string // ID bãi xe

  @Prop({ required: true, index: true, type: Date })
  reportDate: Date // Ngày báo cáo (Lưu dạng 00:00:00 của ngày đó)

  // ==========================================
  // 1. DOANH THU (REVENUE)
  // ==========================================
  @Prop({ default: 0, type: Number })
  totalRevenue: number // Tổng doanh thu trong ngày

  @Prop({
    type: Object,
    default: { subscription: 0, reservation: 0, walkIn: 0 },
  })
  revenueBreakdown: {
    subscription: number // Tiền bán Vé tháng mới (Lấy từ bảng Subscription)
    reservation: number // Tiền đặt chỗ (Lấy từ bảng Reservation)
    walkIn: number // Tiền vãng lai + Phạt quá giờ (Lấy từ Session)
  }

  // ==========================================
  // 2. LƯU LƯỢNG (TRAFFIC & USAGE)
  // ==========================================
  @Prop({ default: 0, type: Number })
  totalCheckIns: number // Tổng lượt xe vào (Session)

  @Prop({ default: 0, type: Number })
  totalCheckOuts: number // Tổng lượt xe ra (Session)

  @Prop({ default: 0, type: Number })
  totalReservationsCreated: number // Số đơn đặt chỗ được tạo (Reservation)

  @Prop({ default: 0, type: Number })
  newSubscriptions: number // Số lượng vé tháng bán mới (Subscription)

  // ==========================================
  // 3. HIỆU SUẤT (PERFORMANCE)
  // ==========================================
  @Prop({ default: 0, type: Number })
  occupancyRate: number // Tỉ lệ lấp đầy trung bình (%)

  @Prop({ default: 0 })
  avgParkingDurationMinutes: number // Thời gian đỗ trung bình (phút)

  @Prop({ type: Object, default: {} })
  peakHourStats: {
    hour: number // Giờ cao điểm (0-23)
    count: number // Số lượng xe vào trong giờ đó
  }

  @Prop({ default: 0 })
  totalRefunded: number

  @Prop({
    type: Object,
    default: { subscription: 0, reservation: 0, walkIn: 0 },
  })
  refundBreakdown: {
    subscription: number // Tổng tiền đã hoàn cho vé tháng
    reservation: number // Tổng tiền đã hoàn cho đặt chỗ
    walkIn: number // Thường là 0 (vãng lai ít khi hoàn, nhưng giữ cho đồng bộ)
  }
}

export const ParkingDailyDashboardSchema = SchemaFactory.createForClass(
  ParkingDailyDashboard,
)
// Index unique để đảm bảo 1 bãi xe không có 2 báo cáo trùng ngày
ParkingDailyDashboardSchema.index(
  { parkingLotId: 1, reportDate: 1 },
  { unique: true },
)
