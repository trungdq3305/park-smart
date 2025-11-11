/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/module/client/account-service-client.ts

import { HttpService } from '@nestjs/axios'
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config' // 🔥 THÊM: Import ConfigService
import { JwtService } from '@nestjs/jwt'
import { AxiosResponse } from 'axios' // Import để gán kiểu
import { firstValueFrom } from 'rxjs'

import { IAccountServiceClient } from './interfaces/iaccount-service-client'

interface CoreServiceResponse {
  _id: string
}

@Injectable()
export class AccountServiceClient implements IAccountServiceClient {
  // KHÔNG CẦN HARDCODE BASE URL NỮA
  private readonly CORE_SERVICE_BASE_URL: string

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService, // 🔥 INJECT ConfigService
    private readonly jwtService: JwtService,
  ) {
    // LẤY GIÁ TRỊ TỪ ENVIRONMENT VARIABLE
    this.CORE_SERVICE_BASE_URL = 'http://parksmarthcmc.io.vn:5001/api'
    // this.configService.get<string>('CORE_SERVICE_URL') ||
    // 'http://parksmarthcmc.io.vn:5001/'

    // 🔥 GIẢ ĐỊNH sử dụng JWT_SECRET làm Internal Token/Key cho Service-to-Service
    //this.INTERNAL_AUTH_TOKEN = this.configService.get<string>('JWT_SECRET') || 'default-secret';
  }

  private getInternalToken(): string {
    // 🔥 TẠO PAYLOAD MÔ PHỎNG ACCOUNT ADMIN NỘI BỘ
    const payload = {
      // Claims BẮT BUỘC theo code C# của bạn:
      id: 'SERVICE_ACC_001', // Mã ID giả của tài khoản Service (Quan trọng!)
      email: 'parking-service-admin@parksmart.com', // Email giả
      phoneNumber: '0000000000', // SĐT giả

      // Claims chi tiết (Admin)
      role: 'Admin',
      adminId: 'SERVICE_ADM_001', // Mã Admin ID giả
      fullName: 'Parking Service Cron Admin',
      department: 'System',
      position: 'System',

      // Tùy chọn: Thêm iss, aud vào đây nếu muốn ghi đè lên JwtModule.registerAsync
      iss: 'CoreService',
      aud: 'AllServices',
    }

    // Ký token
    return this.jwtService.sign(payload, {
      expiresIn: '1h',
      // Không cần thêm issuer/audience ở đây nếu đã thêm vào ClientModule
    })
  }

  async getUserIdsByRole(roleName: string): Promise<string[]> {
    try {
      // ⚠️ Đảm bảo rằng URL chính xác, vì API của bạn là '/core/accounts/by-role'
      // Nếu CORE_SERVICE_URL đã bao gồm /core, thì chỉ cần gọi '/accounts/by-role'
      const url = `${this.CORE_SERVICE_BASE_URL}/accounts/by-role`
      const token = this.getInternalToken() // 🔥 TẠO TOKEN

      console.log(`[DEBUG S2S] Gọi URL: ${url}?role=${roleName}`)

      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { role: roleName },
          headers: {
            Authorization: `Bearer ${token}`, // 🔥 SỬ DỤNG TOKEN ĐÃ KÝ
          },
        }),
      )

      // Xử lý cấu trúc phản hồi: response.data.data[0].data
      const dataArray = response.data?.data?.data || []

      const userIds: string[] = dataArray.map(
        (user: CoreServiceResponse) => user._id,
      )
      console.log(
        `[AccountServiceClient]  ${userIds} users cho role: ${roleName}`,
      )

      console.log(
        `[AccountServiceClient] Lấy thành công ${userIds.length} users cho role: ${roleName}`,
      )
      return userIds
    } catch (error) {
      // Log chi tiết hơn để biết status code
      // 🔥 DEBUG 2: TRUY CẬP DỮ LIỆU PHẢN HỒI LỖI (QUAN TRỌNG)
      const statusCode = error.response?.status || 500
      const errorData = error.response?.data

      console.error(
        `[AccountServiceClient] Lỗi gọi Core Service role=${roleName}:`,
      )
      console.error(
        `[AccountServiceClient] Lỗi gọi Core Service role=${roleName}:`,
      )
      console.error(`  - Status Code: ${statusCode}`)
      console.error(`  - Token gửi đi: ${this.getInternalToken()}...`) // Log 30 ký tự đầu

      // Nếu lỗi là 401 hoặc 403, Core Service thường trả về lý do
      if (errorData) {
        console.error('  - Chi tiết Core Service phản hồi:', errorData)
      }

      return []
    }
  }

  async getPaymentStatusByPaymentId(paymentId: string): Promise<boolean> {
    const url = `${this.CORE_SERVICE_BASE_URL}/payments/${paymentId}`

    try {
      // 1. Chỉ định kiểu trả về là 'any' vì nó không nhất quán
      const data$ = this.httpService.get(url, {
        // <-- ⭐️ SỬA 1
        headers: {
          Authorization: `Bearer ${this.getInternalToken()}`,
        },
      })

      // 2. Lấy response
      const response: AxiosResponse = await firstValueFrom(data$)

      // 3. ⭐️ SỬA LỖI Ở ĐÂY:
      // Lấy dữ liệu thô (raw data) từ response
      const responseData = response.data

      // 4. KIỂM TRA KIỂU DỮ LIỆU CỦA PHẢN HỒI

      // Trường hợp 1: Nếu là object (đây là trường hợp lỗi 404/400)
      if (
        typeof responseData === 'object' &&
        responseData !== null &&
        responseData.success === false
      ) {
        // Ném lỗi này ra để Service (NestJS) của bạn bắt được ở khối catch
        throw new NotFoundException(
          responseData.error || 'Không tìm thấy thanh toán bên ngoài',
        )
      }

      // Trường hợp 2: Nếu là boolean (đây là trường hợp thành công 'true')
      if (typeof responseData === 'boolean') {
        return responseData // Sẽ trả về 'true'
      }

      // Trường hợp 3: API trả về cái gì đó không mong đợi
      return false // Mặc định an toàn là false
    } catch (error) {
      // 5. Xử lý lỗi (Lỗi mạng 500, hoặc lỗi NotFoundException chúng ta vừa ném ở trên)

      // Nếu đây là lỗi NotFound chúng ta chủ động ném, hãy ném lại
      if (error instanceof NotFoundException) {
        throw error
      }
      console.log(error)
      // Nếu là lỗi server/mạng...
      throw new InternalServerErrorException(
        `Lỗi khi gọi Core Service để lấy trạng thái thanh toán cho paymentId: ${paymentId}`,
      )
      // Trả về 'false' (chưa thanh toán) là mặc định an toàn nhất
      return false
    }
  }
}
