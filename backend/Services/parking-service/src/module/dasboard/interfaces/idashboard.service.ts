import type {
  DashboardReportResponseDto,
  GetReportQueryDto,
} from '../dto/dashboard.dto'

export interface IDashboardService {
  getDashboardReport(
    query: GetReportQueryDto,
  ): Promise<DashboardReportResponseDto>

  generateDailyReports(): Promise<void>
}

export const IDashboardService = Symbol('IDashboardService')
