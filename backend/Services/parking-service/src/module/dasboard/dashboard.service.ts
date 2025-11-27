/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dayjs/locale/vi' // Import locale trực tiếp

import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cron } from '@nestjs/schedule'
// --- FIX IMPORT DAYJS ---
import * as dayjs from 'dayjs'
import * as isoWeek from 'dayjs/plugin/isoWeek'
import * as quarterOfYear from 'dayjs/plugin/quarterOfYear'
import * as timezone from 'dayjs/plugin/timezone'
import * as utc from 'dayjs/plugin/utc'
import mongoose, { Model } from 'mongoose'

// Kích hoạt plugin NGAY SAU KHI IMPORT
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)
dayjs.locale('vi') // Set locale toàn cục
dayjs.tz.setDefault('Asia/Ho_Chi_Minh')

import { ParkingLot } from '../parkingLot/schemas/parkingLot.schema'
import { ParkingLotSession } from '../parkingLotSession/schemas/parkingLotSession.schema'
import { Reservation } from '../reservation/schemas/reservation.schema'
import { Subscription } from '../subscription/schemas/subscription.schema'
import {
  DashboardReportResponseDto,
  GetReportQueryDto,
} from './dto/dashboard.dto'
import { ReportTimeRangeEnum } from './enums/dashboard.enum'
import { IDashboardService } from './interfaces/idashboard.service'
import { ParkingDailyDashboard } from './schemas/dashboard.schema'

@Injectable()
export class DashboardService implements IDashboardService {
  private readonly logger = new Logger(DashboardService.name)

  constructor(
    @InjectModel(ParkingDailyDashboard.name)
    private reportModel: Model<ParkingDailyDashboard>,
    @InjectModel(ParkingLot.name) private parkingLotModel: Model<ParkingLot>,
    @InjectModel(ParkingLotSession.name)
    private sessionModel: Model<ParkingLotSession>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
  ) {}

  // Hàm private tính toán dữ liệu Real-time cho ngày hôm nay
  private async getRealTimeStatsForToday(parkingLotId: string) {
    const startOfToday = dayjs().startOf('day').toDate()
    const now = new Date()
    const lotIdObj = new mongoose.Types.ObjectId(parkingLotId)

    // 1. Tính doanh thu Vé tháng hôm nay (Subscription)
    const subStats = await this.subscriptionModel.aggregate([
      {
        $match: {
          parkingLotId: lotIdObj,
          createdAt: { $gte: startOfToday, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
    ])

    // 2. Tính doanh thu Đặt chỗ hôm nay (Reservation)
    const resStats = await this.reservationModel.aggregate([
      {
        $match: {
          parkingLotId: lotIdObj,
          createdAt: { $gte: startOfToday, $lte: now },
          prepaidAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$prepaidAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    // 3. Tính Vãng lai & Check-in/out hôm nay (Session)
    const sessionStats = await this.sessionModel.aggregate([
      {
        $match: {
          parkingLotId: lotIdObj,
          checkOutTime: { $gte: startOfToday, $lte: now },
          status: 'COMPLETED',
        },
      },
      {
        $group: {
          _id: null,
          totalWalkInRevenue: {
            $sum: { $add: ['$amountPaid', '$amountPayAfterCheckOut'] },
          },
          totalCheckOuts: { $sum: 1 },
        },
      },
    ])

    const checkInCount = await this.sessionModel.countDocuments({
      parkingLotId: lotIdObj,
      checkInTime: { $gte: startOfToday, $lte: now },
    })

    // 4. Tổng hợp lại thành object giống cấu trúc ParkingDailyReport
    return {
      reportDate: startOfToday,
      totalRevenue:
        (subStats[0]?.totalAmount ?? 0) +
        (resStats[0]?.totalAmount ?? 0) +
        (sessionStats[0]?.totalWalkInRevenue ?? 0),
      revenueBreakdown: {
        subscription: subStats[0]?.totalAmount ?? 0,
        reservation: resStats[0]?.totalAmount ?? 0,
        walkIn: sessionStats[0]?.totalWalkInRevenue ?? 0,
      },
      totalCheckIns: checkInCount,
      totalCheckOuts: sessionStats[0]?.totalCheckOuts ?? 0,
      totalReservationsCreated: resStats[0]?.count ?? 0,
      newSubscriptions: subStats[0]?.count ?? 0,
    }
  }

  // Chạy lúc 00:05 mỗi ngày
  @Cron('5 0 * * *')
  async generateDailyReports() {
    this.logger.log('📊 Bắt đầu tổng hợp báo cáo doanh thu...')

    // 1. Xác định khung thời gian "Hôm qua"
    const startOfDay = dayjs().tz().subtract(1, 'day').startOf('day').toDate()
    const endOfDay = dayjs().tz().subtract(1, 'day').endOf('day').toDate()

    // 2. Lấy danh sách bãi xe
    const parkingLots = await this.parkingLotModel
      .find()
      .select('_id totalCapacity')
      .lean()

    for (const lot of parkingLots) {
      try {
        await this.processOneParkingLot(lot, startOfDay, endOfDay)
      } catch (err) {
        this.logger.error(`Lỗi tạo báo cáo cho bãi ${lot._id}: ${err.message}`)
      }
    }

    this.logger.log('✅ Hoàn tất tổng hợp báo cáo.')
  }

  private async processOneParkingLot(lot: any, start: Date, end: Date) {
    const lotId = lot._id.toString()

    // --- A. TÍNH DOANH THU VÉ THÁNG (SUBSCRIPTION) ---
    const subStats = await this.subscriptionModel.aggregate([
      {
        $match: {
          parkingLotId: lot._id,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amountPaid' },
          count: { $sum: 1 },
        },
      },
    ])
    const subRevenue: number = subStats[0]?.totalAmount ?? 0
    const subCount: number = subStats[0]?.count ?? 0

    // --- B. TÍNH DOANH THU ĐẶT CHỖ (RESERVATION) ---
    const resStats = await this.reservationModel.aggregate([
      {
        $match: {
          parkingLotId: lot._id,
          createdAt: { $gte: start, $lte: end },
          prepaidAmount: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$prepaidAmount' },
          count: { $sum: 1 },
        },
      },
    ])
    const resRevenue: number = resStats[0]?.totalAmount ?? 0
    const resCount: number = resStats[0]?.count ?? 0

    // --- C. TÍNH DOANH THU VÃNG LAI & LƯU LƯỢNG (SESSION) ---
    const sessionStats = await this.sessionModel.aggregate([
      {
        $match: {
          parkingLotId: lot._id,
          checkOutTime: { $gte: start, $lte: end },
          status: 'COMPLETED',
        },
      },
      {
        $group: {
          _id: null,
          totalWalkInRevenue: {
            $sum: { $add: ['$amountPaid', '$amountPayAfterCheckOut'] },
          },
          totalCheckOuts: { $sum: 1 },
          avgDuration: {
            $avg: { $subtract: ['$checkOutTime', '$checkInTime'] },
          },
        },
      },
    ])

    const checkInCount = await this.sessionModel.countDocuments({
      parkingLotId: lot._id,
      checkInTime: { $gte: start, $lte: end },
    })

    const walkInRevenue: number = sessionStats[0]?.totalWalkInRevenue ?? 0
    const checkOutCount: number = sessionStats[0]?.totalCheckOuts ?? 0
    const avgDurationMs: number = sessionStats[0]?.avgDuration ?? 0

    // --- D. TÍNH GIỜ CAO ĐIỂM (PEAK HOUR) ---
    const peakHourStats = await this.sessionModel.aggregate([
      {
        $match: {
          parkingLotId: lot._id,
          checkInTime: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          hour: { $hour: '$checkInTime' },
        },
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ])

    // --- E. LƯU VÀO DB REPORT ---
    await this.reportModel.updateOne(
      { parkingLotId: lotId, reportDate: start },
      {
        $set: {
          totalRevenue: subRevenue + resRevenue + walkInRevenue,
          revenueBreakdown: {
            subscription: subRevenue,
            reservation: resRevenue,
            walkIn: walkInRevenue,
          },
          totalCheckIns: checkInCount,
          totalCheckOuts: checkOutCount,
          totalReservationsCreated: resCount,
          newSubscriptions: subCount,
          avgParkingDurationMinutes: Math.round(avgDurationMs / 60000),
          peakHourStats:
            peakHourStats.length > 0
              ? {
                  hour: peakHourStats[0]._id,
                  count: peakHourStats[0].count,
                }
              : null,
        },
      },
      { upsert: true },
    )
  }

  async getDashboardReport(
    query: GetReportQueryDto,
  ): Promise<DashboardReportResponseDto> {
    const { parkingLotId, timeRange, targetDate } = query
    const date = targetDate
      ? dayjs.tz(targetDate, 'Asia/Ho_Chi_Minh')
      : dayjs().tz('Asia/Ho_Chi_Minh')

    const today = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day')

    let startDate: dayjs.Dayjs
    let endDate: dayjs.Dayjs
    let groupByFormat: any

    if (targetDate && dayjs(targetDate).isAfter(today)) {
      throw new ConflictException(
        'Ngày cần xem báo cáo không được nằm trong tương lai.',
      )
    }

    switch (timeRange) {
      case ReportTimeRangeEnum.DAY:
        startDate = date.startOf('day')
        endDate = date.endOf('day')
        groupByFormat = null
        break
      case ReportTimeRangeEnum.WEEK:
        startDate = date.startOf('isoWeek')
        endDate = date.endOf('isoWeek')
        groupByFormat = {
          $dateToString: { format: '%Y-%m-%d', date: '$reportDate' },
        }
        break
      case ReportTimeRangeEnum.MONTH:
        startDate = date.startOf('month')
        endDate = date.endOf('month')
        groupByFormat = {
          $dateToString: { format: '%Y-%m-%d', date: '$reportDate' },
        }
        break
      case ReportTimeRangeEnum.QUARTER:
        startDate = date.startOf('quarter')
        endDate = date.endOf('quarter')
        groupByFormat = {
          $dateToString: { format: '%Y-%m', date: '$reportDate' },
        }
        break
      case ReportTimeRangeEnum.YEAR:
        startDate = date.startOf('year')
        endDate = date.endOf('year')
        groupByFormat = {
          $dateToString: { format: '%Y-%m', date: '$reportDate' },
        }
        break
    }

    // A. Lấy dữ liệu Lịch sử (Chỉ lấy TRƯỚC hôm nay)
    const aggregation = [
      {
        $match: {
          parkingLotId: new mongoose.Types.ObjectId(parkingLotId),
          reportDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
          },
        },
      },
      {
        $group: {
          _id: groupByFormat ?? '$_id',
          chartRevenue: { $sum: '$totalRevenue' },
          chartCheckIns: { $sum: '$totalCheckIns' },
          labelDate: { $first: '$reportDate' },
          sumRevenue: { $sum: '$totalRevenue' },
          sumCheckIns: { $sum: '$totalCheckIns' },
          sumReservations: { $sum: '$totalReservationsCreated' },
          sumNewSubs: { $sum: '$newSubscriptions' },
          sumRevWalkIn: { $sum: '$revenueBreakdown.walkIn' },
          sumRevRes: { $sum: '$revenueBreakdown.reservation' },
          sumRevSub: { $sum: '$revenueBreakdown.subscription' },
        },
      },
      { $sort: { _id: 1 } },
    ]

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const historicalData = await this.reportModel.aggregate(aggregation as any)

    // B. Kiểm tra và Gộp dữ liệu Hôm nay (Real-time)
    const combinedData = [...historicalData]

    // B. Logic gộp Realtime
    if (
      date.isSame(today, 'day') ||
      (startDate.isBefore(today) && endDate.isAfter(today))
    ) {
      const todayStats = await this.getRealTimeStatsForToday(parkingLotId)

      // 1. Xác định ID định danh cho "Hôm nay" dựa trên timeRange
      // - Nếu xem NĂM/QUÝ: ID là "YYYY-MM" (để khớp với historicalData)
      // - Nếu xem THÁNG/TUẦN: ID là "YYYY-MM-DD"
      let todayGroupId: string | null = null

      if (
        timeRange === ReportTimeRangeEnum.YEAR ||
        timeRange === ReportTimeRangeEnum.QUARTER
      ) {
        todayGroupId = today.format('YYYY-MM')
      } else if (timeRange === ReportTimeRangeEnum.DAY) {
        todayGroupId = null // Xem ngày thì ko quan trọng group ID
      } else {
        todayGroupId = today.format('YYYY-MM-DD')
      }

      // 2. Tìm xem trong historicalData đã có ID này chưa
      const existingItemIndex = combinedData.findIndex(
        (item) => item._id === todayGroupId,
      )

      if (existingItemIndex > -1) {
        // ==> CASE 1: ĐÃ CÓ (Ví dụ đã có tháng 11 trong lịch sử) -> CỘNG DỒN
        const existing = combinedData[existingItemIndex]

        // Cộng dồn các chỉ số Chart
        existing.chartRevenue += todayStats.totalRevenue
        existing.chartCheckIns += todayStats.totalCheckIns

        // Cộng dồn các chỉ số Summary (để tí nữa reduce cho đúng)
        existing.sumRevenue += todayStats.totalRevenue
        existing.sumCheckIns += todayStats.totalCheckIns
        existing.sumReservations += todayStats.totalReservationsCreated
        existing.sumNewSubs += todayStats.newSubscriptions
        existing.sumRevWalkIn += todayStats.revenueBreakdown.walkIn
        existing.sumRevRes += todayStats.revenueBreakdown.reservation
        existing.sumRevSub += todayStats.revenueBreakdown.subscription

        // Cập nhật lại vào mảng
        combinedData[existingItemIndex] = existing
      } else {
        // ==> CASE 2: CHƯA CÓ (Tháng mới hoặc Ngày mới) -> PUSH MỚI
        const todayFormatted = {
          _id: todayGroupId,
          chartRevenue: todayStats.totalRevenue,
          chartCheckIns: todayStats.totalCheckIns,
          labelDate: today.toDate(),
          sumRevenue: todayStats.totalRevenue,
          sumCheckIns: todayStats.totalCheckIns,
          sumReservations: todayStats.totalReservationsCreated,
          sumNewSubs: todayStats.newSubscriptions,
          sumRevWalkIn: todayStats.revenueBreakdown.walkIn,
          sumRevRes: todayStats.revenueBreakdown.reservation,
          sumRevSub: todayStats.revenueBreakdown.subscription,
        }
        combinedData.push(todayFormatted)
      }
    }

    // C. MAP DỮ LIỆU RA DTO
    const summary = combinedData.reduce(
      (acc, curr) => ({
        totalRevenue: acc.totalRevenue + curr.sumRevenue,
        totalCheckIns: acc.totalCheckIns + curr.sumCheckIns,
        totalReservations: acc.totalReservations + curr.sumReservations,
        newSubscriptions: acc.newSubscriptions + curr.sumNewSubs,
        revenueByWalkIn: acc.revenueByWalkIn + curr.sumRevWalkIn,
        revenueByReservation: acc.revenueByReservation + curr.sumRevRes,
        revenueBySubscription: acc.revenueBySubscription + curr.sumRevSub,
      }),
      {
        totalRevenue: 0,
        totalCheckIns: 0,
        totalReservations: 0,
        newSubscriptions: 0,
        revenueByWalkIn: 0,
        revenueByReservation: 0,
        revenueBySubscription: 0,
      },
    )

    const chartData = combinedData.map((item) => {
      let label = ''
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const d = dayjs(item.labelDate)

      if (
        timeRange === ReportTimeRangeEnum.YEAR ||
        timeRange === ReportTimeRangeEnum.QUARTER
      ) {
        label = `Tháng ${d.format('M')}`
      } else {
        label = d.format('DD/MM')
      }

      return {
        label: label,
        revenue: item.chartRevenue,
        checkIns: item.chartCheckIns,
      }
    })

    // D. Populate thông tin bãi xe
    const parkingLotInfo = await this.parkingLotModel
      .findById(parkingLotId)
      .select('name addressId -_id')
      .populate({
        path: 'addressId',
        select: 'fullAddress wardId -_id',
        populate: {
          path: 'wardId',
          select: 'wardName -_id',
          model: 'Ward',
        },
      })
      .lean()
      .exec()

    return {
      parkingLotInfo: parkingLotInfo as any,
      summary,
      chartData,
    }
  }
}
