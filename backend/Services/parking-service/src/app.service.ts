import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Dịch vụ bãi đậu xe đang hoạt động!'
  }
}
