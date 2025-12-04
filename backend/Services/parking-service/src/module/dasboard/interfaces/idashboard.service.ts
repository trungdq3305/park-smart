import type {
  BackfillReportDto,
  DashboardReportResponseDto,
  GetReportQueryDto,
} from '../dto/dashboard.dto'

export interface IDashboardService {
  getDashboardReport(
    query: GetReportQueryDto,
  ): Promise<DashboardReportResponseDto>

  generateDailyReports(): Promise<void>

  backfillReports(dto: BackfillReportDto): Promise<string>
}

export const IDashboardService = Symbol('IDashboardService')
