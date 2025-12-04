import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

import {
  BackfillReportDto,
  DashboardReportResponseDto,
  GetReportQueryDto,
} from './dto/dashboard.dto'
import { IDashboardService } from './interfaces/idashboard.service'

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    // Inject bằng Token String (khớp với provider trong Module)
    @Inject(IDashboardService)
    private readonly dashboardService: IDashboardService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR) // Chỉ Admin và Chủ bãi được xem
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy dữ liệu Dashboard tổng hợp (Doanh thu, Lưu lượng)',
    description:
      'API trả về dữ liệu tổng quan và biểu đồ. Hỗ trợ filter theo mốc thời gian (Ngày, Tuần, Tháng, Quý, Năm).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dữ liệu báo cáo dashboard thành công',
    type: DashboardReportResponseDto,
  })
  async getDashboardReport(
    @Query() query: GetReportQueryDto,
  ): Promise<DashboardReportResponseDto> {
    return this.dashboardService.getDashboardReport(query)
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tạo báo cáo hàng ngày (Chạy ngầm)',
    description:
      'API này được sử dụng để tạo báo cáo hàng ngày. Thường được gọi bởi cron job, không cần gọi thủ công.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Báo cáo hàng ngày đã được tạo thành công',
  })
  async generateDailyReports(): Promise<void> {
    return this.dashboardService.generateDailyReports()
  }

  @Post('backfill')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: BackfillReportDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN) // Chỉ Admin được chạy
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin: Chạy lại báo cáo cho quá khứ (Backfill)',
    description:
      'Dùng để tạo lại dữ liệu báo cáo nếu bị thiếu hoặc sau khi fix lỗi logic tính toán.',
  })
  async backfillReports(@Body() body: BackfillReportDto) {
    return this.dashboardService.backfillReports(body)
  }
}
