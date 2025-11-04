// src/module/client/account-service-client.ts

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // 🔥 THÊM: Import ConfigService
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';

import { IAccountServiceClient } from './interfaces/iaccount-service-client';

interface CoreServiceResponse {
    _id: string;
}

@Injectable()
export class AccountServiceClient implements IAccountServiceClient {
  
  // KHÔNG CẦN HARDCODE BASE URL NỮA
  private readonly CORE_SERVICE_BASE_URL: string;
  private readonly INTERNAL_AUTH_TOKEN: string; // 🔥 SẼ DÙNG JWT_SECRET LÀM INTERNAL KEY
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService, // 🔥 INJECT ConfigService
    private readonly jwtService: JwtService,
  ) {
    // LẤY GIÁ TRỊ TỪ CONFIG SERVICE
    this.CORE_SERVICE_BASE_URL = 'http://parksmarthcmc.io.vn/core';
    
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
        aud: 'AllServices'
    };
    
    // Ký token
    return this.jwtService.sign(payload, {
        expiresIn: '1h', 
        // Không cần thêm issuer/audience ở đây nếu đã thêm vào ClientModule
    });
}

  async getUserIdsByRole(roleName: string): Promise<string[]> {
    try {
      // ⚠️ Đảm bảo rằng URL chính xác, vì API của bạn là '/core/accounts/by-role'
      // Nếu CORE_SERVICE_URL đã bao gồm /core, thì chỉ cần gọi '/accounts/by-role'
      const url = `${this.CORE_SERVICE_BASE_URL}/accounts/by-role`;
      const token = this.getInternalToken(); // 🔥 TẠO TOKEN
    
      console.log(`[DEBUG S2S] Gọi URL: ${url}?role=${roleName}`);

      const response = await firstValueFrom(
        this.httpService.get(
          url, 
          { 
            params: { role: roleName },
            headers: { 
                'Authorization': `Bearer ${token}`, // 🔥 SỬ DỤNG TOKEN ĐÃ KÝ
            }
          }
        )
      );

      // Xử lý cấu trúc phản hồi: response.data.data[0].data
      const dataArray = response.data?.data?.data || [];

      const userIds: string[] = dataArray.map((user: CoreServiceResponse) => user._id);
      console.log(`[AccountServiceClient]  ${userIds} users cho role: ${roleName}`);
      
      console.log(`[AccountServiceClient] Lấy thành công ${userIds.length} users cho role: ${roleName}`);
      return userIds;

    } catch (error) {
      // Log chi tiết hơn để biết status code
      // 🔥 DEBUG 2: TRUY CẬP DỮ LIỆU PHẢN HỒI LỖI (QUAN TRỌNG)
            const statusCode = error.response?.status || 500;
            const errorData = error.response?.data;
            
            console.error(`[AccountServiceClient] Lỗi gọi Core Service role=${roleName}:`);
            console.error(`[AccountServiceClient] Lỗi gọi Core Service role=${roleName}:`);
            console.error(`  - Status Code: ${statusCode}`);
            console.error(`  - Token gửi đi: ${this.getInternalToken()}...`); // Log 30 ký tự đầu
            
            // Nếu lỗi là 401 hoặc 403, Core Service thường trả về lý do
            if (errorData) {
                console.error('  - Chi tiết Core Service phản hồi:', errorData); 
            }
            
            return [];
    }
  }
}