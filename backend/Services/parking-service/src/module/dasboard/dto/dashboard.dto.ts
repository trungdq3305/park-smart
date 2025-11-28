import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'

import { ReportTimeRangeEnum } from '../enums/dashboard.enum'

// Enum các loại báo cáo

// 1. DTO REQUEST (Gửi lên)
export class GetReportQueryDto {
  @ApiProperty({ description: 'ID bãi xe', example: '65f2...' })
  @IsString()
  @IsNotEmpty()
  parkingLotId: string

  @ApiProperty({
    enum: ReportTimeRangeEnum,
    description: 'Loại báo cáo thời gian',
    example: ReportTimeRangeEnum.MONTH,
  })
  @IsEnum(ReportTimeRangeEnum)
  timeRange: ReportTimeRangeEnum

  @ApiPropertyOptional({
    description:
      'Ngày mốc để xem (Mặc định là hôm nay). Ví dụ xem tháng 11 thì gửi 2025-11-01',
    example: '2025-11-27',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string
}

// 2. DTO RESPONSE (Trả về)

// Dữ liệu chi tiết cho biểu đồ (Chart)
export class ChartDataPointDto {
  @ApiProperty({ description: 'Nhãn thời gian (VD: "01/11" hoặc "Tháng 1")' })
  label: string

  @ApiProperty({ description: 'Doanh thu tại mốc này' })
  revenue: number

  @ApiProperty({ description: 'Số lượt xe vào' })
  checkIns: number
}

// Dữ liệu tổng quan (Summary Cards)
export class ReportSummaryDto {
  @ApiProperty()
  totalRevenue: number

  @ApiProperty()
  totalCheckIns: number

  @ApiProperty()
  totalReservations: number

  @ApiProperty()
  newSubscriptions: number

  @ApiProperty()
  revenueByWalkIn: number

  @ApiProperty()
  revenueByReservation: number

  @ApiProperty()
  revenueBySubscription: number

  @ApiProperty({ description: 'Thời gian đỗ xe trung bình (phút)' })
  avgParkingDurationMinutes: number
}

// Object trả về cuối cùng
export class WardInfoDto {
  @ApiProperty()
  wardName: string
}

// 2. DTO cho thông tin Address (Địa chỉ)
export class AddressInfoDto {
  @ApiProperty()
  fullAddress: string

  @ApiProperty({ type: WardInfoDto })
  wardId: WardInfoDto // Tên field trong DB là wardId nhưng chứa object populate
}

// 3. DTO cho thông tin Parking Lot
export class ParkingLotInfoDto {
  @ApiProperty()
  name: string

  @ApiProperty({ type: AddressInfoDto })
  addressId: AddressInfoDto // Tên field trong DB là addressId
}

// 4. Cập nhật DashboardReportResponseDto
export class DashboardReportResponseDto {
  // 👇 THÊM TRƯỜNG NÀY
  @ApiProperty({
    type: ParkingLotInfoDto,
    description: 'Thông tin bãi xe và địa chỉ',
  })
  parkingLotInfo: ParkingLotInfoDto

  @ApiProperty({ type: ReportSummaryDto })
  summary: ReportSummaryDto

  @ApiProperty({ type: [ChartDataPointDto] })
  chartData: ChartDataPointDto[]
}
