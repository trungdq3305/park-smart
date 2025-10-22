// health.controller.ts
import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MongooseHealthIndicator, // <-- Thú vị: Dùng để check MongoDB
} from '@nestjs/terminus'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: MongooseHealthIndicator, // <-- Inject Mongoose checker
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const port = this.configService.get<number>('PORT') || 5000
    // Trả về thông điệp của bạn, đồng thời kiểm tra các dịch vụ
    return this.health.check([
      // 1. Check xem app có đang chạy không (tự ping)
      () =>
        this.http.pingCheck('nestjs-app', `http://localhost:${String(port)}`),

      // 2. Check kết nối MongoDB (sử dụng context của bạn)
      () => this.db.pingCheck('mongodb'),

      // 3. Trả về thông điệp custom của bạn (Tùy chọn)
      () =>
        Promise.resolve({
          'parking-service': {
            status: 'up',
            message: 'Dịch vụ bãi đậu xe đang hoạt động!',
          },
        }),
    ])
  }
}
