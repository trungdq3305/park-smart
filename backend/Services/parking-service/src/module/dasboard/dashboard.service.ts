/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dayjs/locale/vi'

import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Cron } from '@nestjs/schedule'
import * as dayjs from 'dayjs'
import * as isoWeek from 'dayjs/plugin/isoWeek'
import * as quarterOfYear from 'dayjs/plugin/quarterOfYear'
import * as timezone from 'dayjs/plugin/timezone'
import * as utc from 'dayjs/plugin/utc'
import mongoose, { Model, PipelineStage } from 'mongoose'

// Kích hoạt plugin & Cấu hình Timezone
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)
dayjs.locale('vi')
dayjs.tz.setDefault('Asia/Ho_Chi_Minh')

import { ParkingLot } from '../parkingLot/schemas/parkingLot.schema'
import { ParkingLotSession } from '../parkingLotSession/schemas/parkingLotSession.schema'
import { Reservation } from '../reservation/schemas/reservation.schema'
import { Subscription } from '../subscription/schemas/subscription.schema'
import {
  BackfillReportDto,
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

  // ===========================================================================
  // 1. TÍNH TOÁN DỮ LIỆU REAL-TIME (HÔM NAY)
  // ===========================================================================
  private async getRealTimeStatsForToday(parkingLotId: string) {
    const startOfToday = dayjs().startOf('day').toDate()
    const now = new Date()
    const lotIdObj = new mongoose.Types.ObjectId(parkingLotId)

    // A. Vé tháng: Tổng tiền thu - Tổng tiền hoàn
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
          // Net Revenue = Paid - Refunded
          totalAmount: {
            $sum: {
              $subtract: [
                { $ifNull: ['$amountPaid', 0] }, // 👈 Nếu thiếu amountPaid thì coi là 0
                { $ifNull: ['$refundedAmount', 0] }, // 👈 Nếu thiếu refundedAmount thì coi là 0
              ],
            },
          },
          totalRefunded: { $sum: '$refundedAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    // B. Đặt chỗ: Tổng tiền thu - Tổng tiền hoàn
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
          totalAmount: {
            $sum: {
              $subtract: [
                { $ifNull: ['$prepaidAmount', 0] }, // 👈 Sửa ở đây
                { $ifNull: ['$refundedAmount', 0] }, // 👈 Sửa ở đây
              ],
            },
          },
          totalRefunded: { $sum: '$refundedAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    // C. Vãng lai: Doanh thu + Phạt (Thường chưa có refund)
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
            $sum: {
              $add: [
                { $ifNull: ['$amountPaid', 0] },
                { $ifNull: ['$amountPayAfterCheckOut', 0] },
              ],
            },
          },
          totalCheckOuts: { $sum: 1 },
          avgDuration: {
            $avg: { $subtract: ['$checkOutTime', '$checkInTime'] },
          },
        },
      },
    ])

    const checkInCount = await this.sessionModel.countDocuments({
      parkingLotId: lotIdObj,
      checkInTime: { $gte: startOfToday, $lte: now },
    })

    const avgDurationMs = sessionStats[0]?.avgDuration ?? 0

    // Tổng hợp kết quả
    return {
      reportDate: startOfToday,

      totalRevenue:
        (subStats[0]?.totalAmount ?? 0) +
        (resStats[0]?.totalAmount ?? 0) +
        (sessionStats[0]?.totalWalkInRevenue ?? 0),

      totalRefunded:
        (subStats[0]?.totalRefunded ?? 0) + (resStats[0]?.totalRefunded ?? 0),

      revenueBreakdown: {
        subscription: subStats[0]?.totalAmount ?? 0,
        reservation: resStats[0]?.totalAmount ?? 0,
        walkIn: sessionStats[0]?.totalWalkInRevenue ?? 0,
      },
      refundBreakdown: {
        subscription: subStats[0]?.totalRefunded ?? 0,
        reservation: resStats[0]?.totalRefunded ?? 0,
        walkIn: 0,
      },

      totalCheckIns: checkInCount,
      totalCheckOuts: sessionStats[0]?.totalCheckOuts ?? 0,
      // Đổi ms sang phút
      avgParkingDurationMinutes: Math.round(avgDurationMs / 60000),

      totalReservationsCreated: resStats[0]?.count ?? 0,
      newSubscriptions: subStats[0]?.count ?? 0,
      isRealTime: true,
    }
  }

  async backfillReports(dto: BackfillReportDto): Promise<string> {
    this.logger.log(
      `🔄 Bắt đầu Backfill từ ${dto.fromDate} đến ${dto.toDate}...`,
    )

    // 1. Chuẩn bị danh sách bãi xe
    let parkingLots: any[] = []
    if (dto.parkingLotId) {
      parkingLots = await this.parkingLotModel
        .find({ _id: dto.parkingLotId })
        .select('_id')
        .lean()
    } else {
      parkingLots = await this.parkingLotModel.find().select('_id').lean()
    }

    if (parkingLots.length === 0) return 'Không tìm thấy bãi xe nào.'

    // 2. Chuẩn bị vòng lặp thời gian
    // Lưu ý: Dùng Timezone VN để đảm bảo chính xác 00:00 - 23:59
    let currentDate = dayjs.tz(dto.fromDate, 'Asia/Ho_Chi_Minh').startOf('day')
    const endDate = dayjs.tz(dto.toDate, 'Asia/Ho_Chi_Minh').endOf('day')

    let countDays = 0

    // 3. Vòng lặp từng ngày
    while (
      currentDate.isBefore(endDate) ||
      currentDate.isSame(endDate, 'day')
    ) {
      const startOfDay = currentDate.toDate()
      const endOfDay = currentDate.endOf('day').toDate()

      this.logger.log(
        `   Processing Date: ${currentDate.format('YYYY-MM-DD')}...`,
      )

      // Chạy song song cho tất cả bãi xe trong ngày đó
      await Promise.all(
        parkingLots.map((lot) =>
          this.processOneParkingLot(lot, startOfDay, endOfDay),
        ),
      )

      // Tăng thêm 1 ngày
      currentDate = currentDate.add(1, 'day')
      countDays++
    }

    return `✅ Đã hoàn tất Backfill cho ${countDays} ngày trên ${parkingLots.length} bãi xe.`
  }

  // ===========================================================================
  // 2. CRON JOB (CHẠY ĐÊM ĐỂ TỔNG HỢP DỮ LIỆU HÔM QUA)
  // ===========================================================================
  @Cron('5 0 * * *')
  async generateDailyReports() {
    this.logger.log('📊 Bắt đầu tổng hợp báo cáo doanh thu...')

    // Lấy ngày hôm qua theo giờ VN
    const startOfDay = dayjs().tz().subtract(1, 'day').startOf('day').toDate()
    const endOfDay = dayjs().tz().subtract(1, 'day').endOf('day').toDate()

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

    // 1. Subscription
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
          totalAmount: {
            $sum: {
              $subtract: [
                { $ifNull: ['$amountPaid', 0] }, // 👈 Nếu thiếu amountPaid thì coi là 0
                { $ifNull: ['$refundedAmount', 0] }, // 👈 Nếu thiếu refundedAmount thì coi là 0
              ],
            },
          },
          totalRefunded: { $sum: '$refundedAmount' },
          count: { $sum: 1 },
        },
      },
    ])
    const subRevenue = subStats[0]?.totalAmount ?? 0
    const subRefund = subStats[0]?.totalRefunded ?? 0
    const subCount = subStats[0]?.count ?? 0

    // 2. Reservation
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
          totalAmount: {
            $sum: {
              $subtract: [
                { $ifNull: ['$prepaidAmount', 0] }, // 👈 Sửa ở đây
                { $ifNull: ['$refundedAmount', 0] }, // 👈 Sửa ở đây
              ],
            },
          },
          totalRefunded: { $sum: '$refundedAmount' },
          count: { $sum: 1 },
        },
      },
    ])
    const resRevenue = resStats[0]?.totalAmount ?? 0
    const resRefund = resStats[0]?.totalRefunded ?? 0
    const resCount = resStats[0]?.count ?? 0

    // 3. Session (Vãng lai)
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
            $sum: {
              $add: [
                { $ifNull: ['$amountPaid', 0] },
                { $ifNull: ['$amountPayAfterCheckOut', 0] },
              ],
            },
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

    const walkInRevenue = sessionStats[0]?.totalWalkInRevenue ?? 0
    const checkOutCount = sessionStats[0]?.totalCheckOuts ?? 0
    const avgDurationMs = sessionStats[0]?.avgDuration ?? 0

    // 4. Peak Hour
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

    // 5. Save to DB
    await this.reportModel.updateOne(
      { parkingLotId: lotId, reportDate: start },
      {
        $set: {
          totalRevenue: subRevenue + resRevenue + walkInRevenue,
          totalRefunded: subRefund + resRefund,

          revenueBreakdown: {
            subscription: subRevenue,
            reservation: resRevenue,
            walkIn: walkInRevenue,
          },
          refundBreakdown: {
            subscription: subRefund,
            reservation: resRefund,
            walkIn: 0,
          },

          totalCheckIns: checkInCount,
          totalCheckOuts: checkOutCount,
          totalReservationsCreated: resCount,
          newSubscriptions: subCount,
          avgParkingDurationMinutes: Math.round(avgDurationMs / 60000),
          peakHourStats:
            peakHourStats.length > 0
              ? { hour: peakHourStats[0]._id, count: peakHourStats[0].count }
              : null,
        },
      },
      { upsert: true },
    )
  }

  // ===========================================================================
  // 3. API LẤY BÁO CÁO (DÙNG CHO FRONTEND)
  // ===========================================================================
  async getDashboardReport(
    query: GetReportQueryDto,
  ): Promise<DashboardReportResponseDto> {
    const { parkingLotId, timeRange, targetDate } = query

    // Parse ngày theo Timezone VN
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

    // Logic xác định khoảng thời gian
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
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$reportDate',
            timezone: 'Asia/Ho_Chi_Minh',
          },
        }
        break
      case ReportTimeRangeEnum.MONTH:
        startDate = date.startOf('month')
        endDate = date.endOf('month')
        groupByFormat = {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$reportDate',
            timezone: 'Asia/Ho_Chi_Minh',
          },
        }
        break
      case ReportTimeRangeEnum.QUARTER:
        startDate = date.startOf('quarter')
        endDate = date.endOf('quarter')
        groupByFormat = {
          $dateToString: {
            format: '%Y-%m',
            date: '$reportDate',
            timezone: 'Asia/Ho_Chi_Minh',
          },
        }
        break
      case ReportTimeRangeEnum.YEAR:
        startDate = date.startOf('year')
        endDate = date.endOf('year')
        groupByFormat = {
          $dateToString: {
            format: '%Y-%m',
            date: '$reportDate',
            timezone: 'Asia/Ho_Chi_Minh',
          },
        }
        break
    }

    // A. AGGREGATION LỊCH SỬ (Historical Data)
    const aggregation = [
      {
        $match: {
          parkingLotId: new mongoose.Types.ObjectId(parkingLotId),
          reportDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
            $lt: today.toDate(), // Chỉ lấy quá khứ
          },
        },
      },
      {
        $group: {
          _id: groupByFormat ?? '$_id',

          // Chỉ số cơ bản
          chartRevenue: { $sum: '$totalRevenue' },
          chartCheckIns: { $sum: '$totalCheckIns' },
          labelDate: { $first: '$reportDate' },

          sumRevenue: { $sum: '$totalRevenue' },
          sumRefunded: { $sum: '$totalRefunded' }, // Tổng hoàn tiền

          sumCheckIns: { $sum: '$totalCheckIns' },
          sumReservations: { $sum: '$totalReservationsCreated' },
          sumNewSubs: { $sum: '$newSubscriptions' },

          sumRevWalkIn: { $sum: '$revenueBreakdown.walkIn' },
          sumRevRes: { $sum: '$revenueBreakdown.reservation' },
          sumRevSub: { $sum: '$revenueBreakdown.subscription' },

          sumRefSub: { $sum: '$refundBreakdown.subscription' },
          sumRefRes: { $sum: '$refundBreakdown.reservation' },
          sumRefWalkIn: { $sum: '$refundBreakdown.walkIn' },

          // Chỉ số để tính trung bình cộng gia quyền
          totalCheckOuts: { $sum: '$totalCheckOuts' },
          accumulatedDurationMinutes: {
            $sum: {
              $multiply: [
                { $ifNull: ['$avgParkingDurationMinutes', 0] },
                { $ifNull: ['$totalCheckOuts', 0] },
              ],
            },
          },
        },
      },
      // Tính toán lại Average Duration sau khi group
      {
        $addFields: {
          avgParkingDurationMinutes: {
            $cond: [
              { $eq: ['$totalCheckOuts', 0] },
              0,
              {
                $round: [
                  {
                    $divide: ['$accumulatedDurationMinutes', '$totalCheckOuts'],
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { _id: 1 } },
    ]

    const historicalData = await this.reportModel.aggregate(
      aggregation as PipelineStage[],
    )
    const combinedData = [...historicalData]

    // B. LOGIC HYBRID: GỘP DỮ LIỆU HÔM NAY (Real-time)
    if (
      date.isSame(today, 'day') ||
      (startDate.isBefore(today) && endDate.isAfter(today))
    ) {
      const todayStats = await this.getRealTimeStatsForToday(parkingLotId)

      let todayGroupId: string | null = null

      if (
        timeRange === ReportTimeRangeEnum.YEAR ||
        timeRange === ReportTimeRangeEnum.QUARTER
      ) {
        todayGroupId = today.format('YYYY-MM')
      } else if (timeRange === ReportTimeRangeEnum.DAY) {
        todayGroupId = null
      } else {
        todayGroupId = today.format('YYYY-MM-DD')
      }

      // Tìm xem đã có bucket của ngày hôm nay trong lịch sử chưa (để merge)
      const existingItemIndex = combinedData.findIndex(
        (item) => item._id === todayGroupId,
      )

      if (existingItemIndex > -1) {
        // MERGE VÀO BUCKET CÓ SẴN (Ví dụ: Merge ngày 27 vào Tháng 11)
        const existing = combinedData[existingItemIndex]

        existing.chartRevenue += todayStats.totalRevenue
        existing.chartCheckIns += todayStats.totalCheckIns

        existing.sumRevenue += todayStats.totalRevenue
        existing.sumRefunded += todayStats.totalRefunded

        existing.sumCheckIns += todayStats.totalCheckIns
        existing.sumReservations += todayStats.totalReservationsCreated
        existing.sumNewSubs += todayStats.newSubscriptions

        existing.sumRevWalkIn += todayStats.revenueBreakdown.walkIn
        existing.sumRevRes += todayStats.revenueBreakdown.reservation
        existing.sumRevSub += todayStats.revenueBreakdown.subscription

        existing.sumRefSub += todayStats.refundBreakdown.subscription
        existing.sumRefRes += todayStats.refundBreakdown.reservation
        existing.sumRefWalkIn += todayStats.refundBreakdown.walkIn

        // Tính lại Weighted Average cho Duration
        const oldCheckOuts = existing.totalCheckOuts ?? 0
        const newCheckOuts = todayStats.totalCheckOuts ?? 0
        const oldAvg = existing.avgParkingDurationMinutes ?? 0
        const newAvg = todayStats.avgParkingDurationMinutes
        const totalCheckOuts = oldCheckOuts + newCheckOuts

        if (totalCheckOuts > 0) {
          existing.avgParkingDurationMinutes = Math.round(
            (oldAvg * oldCheckOuts + newAvg * newCheckOuts) / totalCheckOuts,
          )
        }
        existing.totalCheckOuts = totalCheckOuts

        combinedData[existingItemIndex] = existing
      } else {
        // TẠO BUCKET MỚI (Ví dụ: Ngày mới hoặc Tháng mới chưa có trong lịch sử)
        const todayFormatted = {
          _id: todayGroupId,
          chartRevenue: todayStats.totalRevenue,
          chartCheckIns: todayStats.totalCheckIns,
          labelDate: today.toDate(),

          sumRevenue: todayStats.totalRevenue,
          sumRefunded: todayStats.totalRefunded,

          sumCheckIns: todayStats.totalCheckIns,
          sumReservations: todayStats.totalReservationsCreated,
          sumNewSubs: todayStats.newSubscriptions,

          sumRevWalkIn: todayStats.revenueBreakdown.walkIn,
          sumRevRes: todayStats.revenueBreakdown.reservation,
          sumRevSub: todayStats.revenueBreakdown.subscription,

          sumRefSub: todayStats.refundBreakdown.subscription,
          sumRefRes: todayStats.refundBreakdown.reservation,
          sumRefWalkIn: todayStats.refundBreakdown.walkIn,

          avgParkingDurationMinutes: todayStats.avgParkingDurationMinutes,
          totalCheckOuts: todayStats.totalCheckOuts,
        }
        combinedData.push(todayFormatted)
      }
    }

    // C. TÍNH TỔNG SUMMARY (REDUCE)
    const summary = combinedData.reduce(
      (acc, curr) => {
        const totalRevenue = acc.totalRevenue + (curr.sumRevenue ?? 0)
        const totalRefunded = acc.totalRefunded + (curr.sumRefunded ?? 0)

        const totalCheckIns = acc.totalCheckIns + (curr.sumCheckIns ?? 0)
        const totalReservations =
          acc.totalReservations + (curr.sumReservations ?? 0)
        const newSubscriptions = acc.newSubscriptions + (curr.sumNewSubs ?? 0)

        const revenueByWalkIn = acc.revenueByWalkIn + (curr.sumRevWalkIn ?? 0)
        const revenueByReservation =
          acc.revenueByReservation + (curr.sumRevRes ?? 0)
        const revenueBySubscription =
          acc.revenueBySubscription + (curr.sumRevSub ?? 0)

        const refundBySubscription =
          acc.refundBreakdown.subscription + (curr.sumRefSub ?? 0)
        const refundByReservation =
          acc.refundBreakdown.reservation + (curr.sumRefRes ?? 0)
        const refundByWalkIn =
          acc.refundBreakdown.walkIn + (curr.sumRefWalkIn ?? 0)

        // Tính Weighted Average cho Summary Tổng
        const accCheckOuts = acc.totalCheckOuts ?? 0
        const currCheckOuts = curr.totalCheckOuts ?? 0
        const accAvg = acc.avgParkingDurationMinutes ?? 0
        const currAvg = curr.avgParkingDurationMinutes ?? 0

        const newTotalCheckOuts = accCheckOuts + currCheckOuts
        let newAvgDuration = 0

        if (newTotalCheckOuts > 0) {
          newAvgDuration = Math.round(
            (accAvg * accCheckOuts + currAvg * currCheckOuts) /
              newTotalCheckOuts,
          )
        }

        return {
          totalRevenue,
          totalRefunded,

          totalCheckIns,
          totalReservations,
          newSubscriptions,

          revenueByWalkIn,
          revenueByReservation,
          revenueBySubscription,

          // Object breakdown
          refundBreakdown: {
            subscription: refundBySubscription,
            reservation: refundByReservation,
            walkIn: refundByWalkIn,
          },
          revenueBreakdown: {
            subscription: revenueBySubscription,
            reservation: revenueByReservation,
            walkIn: revenueByWalkIn,
          },

          totalCheckOuts: newTotalCheckOuts,
          avgParkingDurationMinutes: newAvgDuration,
        }
      },
      // Initial Value (Phải khớp cấu trúc return)
      {
        totalRevenue: 0,
        totalRefunded: 0,
        totalCheckIns: 0,
        totalReservations: 0,
        newSubscriptions: 0,
        revenueByWalkIn: 0,
        revenueByReservation: 0,
        revenueBySubscription: 0,
        refundBreakdown: { subscription: 0, reservation: 0, walkIn: 0 },
        revenueBreakdown: { subscription: 0, reservation: 0, walkIn: 0 }, // Thêm dòng này nếu muốn summary trả về dạng object lồng
        totalCheckOuts: 0,
        avgParkingDurationMinutes: 0,
      },
    )

    // D. FORMAT DỮ LIỆU BIỂU ĐỒ
    const chartData = combinedData.map((item) => {
      let label = ''

      if (item._id) {
        const d = dayjs(item._id) // Parse chuỗi group key (YYYY-MM hoặc YYYY-MM-DD)
        if (
          timeRange === ReportTimeRangeEnum.YEAR ||
          timeRange === ReportTimeRangeEnum.QUARTER
        ) {
          label = `Tháng ${d.format('M')}`
        } else if (timeRange === ReportTimeRangeEnum.DAY) {
          label = dayjs(item.labelDate).tz('Asia/Ho_Chi_Minh').format('DD/MM')
        } else {
          label = d.format('DD/MM')
        }
      } else {
        // Fallback cho DAY (group null)
        label = dayjs(item.labelDate).tz('Asia/Ho_Chi_Minh').format('DD/MM')
      }

      return {
        label: label,
        revenue: item.chartRevenue,
        checkIns: item.chartCheckIns,
      }
    })

    // E. POPULATE THÔNG TIN BÃI XE
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
