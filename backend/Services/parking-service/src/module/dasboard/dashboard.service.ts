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

  private async getRealTimeStatsForToday(parkingLotId: string) {
    const startOfToday = dayjs().startOf('day').toDate()
    const now = new Date()
    const lotIdObj = new mongoose.Types.ObjectId(parkingLotId)

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
      avgParkingDurationMinutes: Math.round(avgDurationMs / 60000),
      totalCheckOuts: sessionStats[0]?.totalCheckOuts ?? 0,
      totalReservationsCreated: resStats[0]?.count ?? 0,
      newSubscriptions: subStats[0]?.count ?? 0,
      isRealTime: true,
    }
  }

  @Cron('5 0 * * *')
  async generateDailyReports() {
    this.logger.log('📊 Bắt đầu tổng hợp báo cáo doanh thu...')

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

    const aggregation = [
      {
        $match: {
          parkingLotId: new mongoose.Types.ObjectId(parkingLotId),
          reportDate: {
            $gte: startDate.toDate(),
            $lte: endDate.toDate(),
            $lt: today.toDate(),
          },
        },
      },
      {
        $group: {
          _id: groupByFormat ?? '$_id',
          // Các chỉ số cộng dồn bình thường
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

          // 👇 SỬA 1: Cộng dồn tổng số lượt xe ra
          totalCheckOuts: { $sum: '$totalCheckOuts' },

          // 👇 SỬA 2: Tính tổng số phút tích lũy (Avg * Count) của từng ngày
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
      // 👇 SỬA 3: Thêm bước tính toán cuối cùng để chia lại
      {
        $addFields: {
          avgParkingDurationMinutes: {
            $cond: [
              { $eq: ['$totalCheckOuts', 0] },
              0,
              // Công thức: Tổng phút tích lũy / Tổng xe ra -> Làm tròn
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

      const existingItemIndex = combinedData.findIndex(
        (item) => item._id === todayGroupId,
      )

      if (existingItemIndex > -1) {
        const existing = combinedData[existingItemIndex]

        existing.chartRevenue += todayStats.totalRevenue
        existing.chartCheckIns += todayStats.totalCheckIns
        existing.sumRevenue += todayStats.totalRevenue
        existing.sumCheckIns += todayStats.totalCheckIns
        existing.sumReservations += todayStats.totalReservationsCreated
        existing.sumNewSubs += todayStats.newSubscriptions
        existing.sumRevWalkIn += todayStats.revenueBreakdown.walkIn
        existing.sumRevRes += todayStats.revenueBreakdown.reservation
        existing.sumRevSub += todayStats.revenueBreakdown.subscription

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
          avgParkingDurationMinutes: todayStats.avgParkingDurationMinutes,
          totalCheckOuts: todayStats.totalCheckOuts,
        }
        combinedData.push(todayFormatted)
      }
    }

    const summary = combinedData.reduce(
      (acc, curr) => {
        const totalRevenue = acc.totalRevenue + (curr.sumRevenue ?? 0)
        const totalCheckIns = acc.totalCheckIns + (curr.sumCheckIns ?? 0)
        const totalReservations =
          acc.totalReservations + (curr.sumReservations ?? 0)
        const newSubscriptions = acc.newSubscriptions + (curr.sumNewSubs ?? 0)
        const revenueByWalkIn = acc.revenueByWalkIn + (curr.sumRevWalkIn ?? 0)
        const revenueByReservation =
          acc.revenueByReservation + (curr.sumRevRes ?? 0)
        const revenueBySubscription =
          acc.revenueBySubscription + (curr.sumRevSub ?? 0)

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
          totalCheckIns,
          totalReservations,
          newSubscriptions,
          revenueByWalkIn,
          revenueByReservation,
          revenueBySubscription,
          totalCheckOuts: newTotalCheckOuts,
          avgParkingDurationMinutes: newAvgDuration,
        }
      },
      {
        totalRevenue: 0,
        totalCheckIns: 0,
        totalReservations: 0,
        newSubscriptions: 0,
        revenueByWalkIn: 0,
        revenueByReservation: 0,
        revenueBySubscription: 0,
        totalCheckOuts: 0,
        avgParkingDurationMinutes: 0,
      },
    )

    const chartData = combinedData.map((item) => {
      let label = ''

      // item._id là chuỗi Group Key (VD: "2025-11-27" hoặc "2025-11")
      // Dùng nó để format sẽ chuẩn hơn là dùng labelDate (vốn là Date object có giờ giấc)

      if (item._id) {
        const d = dayjs(item._id) // Parse chuỗi YYYY-MM-DD hoặc YYYY-MM

        if (
          timeRange === ReportTimeRangeEnum.YEAR ||
          timeRange === ReportTimeRangeEnum.QUARTER
        ) {
          label = `Tháng ${d.format('M')}`
        } else if (timeRange === ReportTimeRangeEnum.DAY) {
          // Với DAY, _id là null (do group null), lúc này mới dùng labelDate
          label = dayjs(item.labelDate).tz('Asia/Ho_Chi_Minh').format('DD/MM')
        } else {
          label = d.format('DD/MM')
        }
      } else {
        // Fallback cho trường hợp _id null (View DAY)
        label = dayjs(item.labelDate).tz('Asia/Ho_Chi_Minh').format('DD/MM')
      }

      return {
        label: label,
        revenue: item.chartRevenue,
        checkIns: item.chartCheckIns,
      }
    })

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
