import {
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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Roles } from 'src/common/decorators/roles.decorator'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { RolesGuard } from 'src/guard/role.guard'

import {
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
}
