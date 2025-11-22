/* eslint-disable @typescript-eslint/no-unnecessary-type-arguments */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/module/client/account-service-client.ts

import { HttpService } from '@nestjs/axios'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config' // 🔥 THÊM: Import ConfigService
import { JwtService } from '@nestjs/jwt'
import { AxiosError, AxiosResponse } from 'axios' // Import để gán kiểu
import * as FormData from 'form-data'
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
    this.CORE_SERVICE_BASE_URL =
      this.configService.get<string>('CORE_SERVICE_URL') ||
      'http://localhost:5001/api'

    // 🔥 GIẢ ĐỊNH sử dụng JWT_SECRET làm Internal Token/Key cho Service-to-Service
    //this.INTERNAL_AUTH_TOKEN = this.configService.get<string>('JWT_SECRET') || 'default-secret';
  }

  async uploadImageToImageService(
    fileBuffer: Buffer,
    ownerType: string,
    ownerId: string,
    description: string,
  ): Promise<{ id: string; url: string } | null> {
    const url = `${this.CORE_SERVICE_BASE_URL}/images/upload`

    const formData = new FormData()

    formData.append('file', fileBuffer, {
      filename: `${ownerType}_${ownerId}.jpg`,
      contentType: 'image/jpeg',
    })
    formData.append('ownerType', ownerType)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
    formData.append('ownerId', ownerId.toString())
    formData.append('description', description ?? '')

    try {
      // 3. Lấy headers (Chứa Content-Type và Boundary)
      const headers = formData.getHeaders()

      // Log thử để debug: Bạn sẽ thấy nó in ra dạng 'multipart/form-data; boundary=...'
      // console.log('Headers:', headers);

      const response = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers: {
            ...headers, // 4. Bắt buộc phải spread headers vào đây
            // 'Authorization': ... (nếu cần)
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      )

      return response.data as { id: string; url: string } // Trả về { id, url }
    } catch (error) {
      console.log('Attempting to connect to:', url)

      // 👇 LOG LỖI CHI TIẾT HƠN
      if (error.response) {
        // Server đã phản hồi nhưng báo lỗi (4xx, 5xx)
        console.error('Server Response Error:', error.response.data)
        console.error('Status:', error.response.status)
      } else if (error.request) {
        // Request đã gửi nhưng không nhận được phản hồi (Lỗi mạng, Timeout)
        console.error('Network Error (No response):', error.message)
        console.error('Error Code:', error.code) // Ví dụ: ECONNREFUSED
      } else {
        // Lỗi khi setup request (Lỗi code client, FormData)
        console.error('Client Setup Error:', error.message)
      }

      return null
    }
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

  async getPaymentStatusByPaymentId(
    paymentId: string,
    userId?: string, // Tham số mới để so sánh
    status?: string, // Tham số mới để so sánh
  ): Promise<boolean> {
    const url = `${this.CORE_SERVICE_BASE_URL}/operators/payments/parking/xendit-invoice-detail?paymentId=${paymentId}`

    try {
      // 1. Gọi API (vẫn dùng kiểu 'any' vì response có thể là lỗi hoặc success)
      const data$ = this.httpService.get<any>(url, {
        headers: {
          Authorization: `Bearer ${this.getInternalToken()}`,
        },
      })

      const response: AxiosResponse<any> = await firstValueFrom(data$)
      const responseData = response.data // Đây là { status, amount, userId }

      // 2. ⭐️ BẮT ĐẦU SO SÁNH ⭐️

      // 2a. So sánh Trạng thái (Status)
      if (status && responseData.status !== status) {
        throw new ConflictException(
          `Thanh toán đang ở trạng thái "${responseData.status}", không phải "${status}".`,
        )
      }

      // 2b. So sánh Người dùng (User ID)
      if (userId && responseData.userId !== userId) {
        throw new ConflictException(
          'ID người dùng của thanh toán không khớp với người dùng đang đăng nhập.',
        )
      }

      // 3. Nếu tất cả đều khớp
      return true
    } catch (error) {
      // 4. XỬ LÝ LỖI (Quan trọng)

      // 4a. Ném lại các lỗi (409 Conflict) mà chúng ta chủ động ném ở trên
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error
      }

      // 4b. Xử lý lỗi 404 từ .NET service (nếu API trả về 404)
      if (error instanceof AxiosError && error.response?.status === 404) {
        // Dù .NET trả về { success: false } hay 404 rỗng,
        // chúng ta đều coi là NotFoundException.
        throw new NotFoundException(
          `Không tìm thấy thanh toán với ID: ${paymentId}`,
        )
      }

      // 4c. Các lỗi không mong muốn khác (lỗi mạng, 500 từ .NET...)
      Logger.error(
        `Lỗi khi gọi Core Service cho paymentId ${paymentId}: ${error.message}`,
        'PaymentInternalService',
      )
      throw new InternalServerErrorException(
        'Lỗi máy chủ khi xác thực thanh toán.',
      )
    }
  }
}
