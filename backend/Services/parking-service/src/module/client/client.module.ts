// src/module/client/client.module.ts

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AccountServiceClient } from './account-service-client'; // Import class triển khai
// BỎ: import { IAccountServiceClient } from './account-service-client';
// Thêm: Import từ file interfaces (hoặc file nơi bạn khai báo Symbol)
import { IAccountServiceClient } from './interfaces/iaccount-service-client'; 

@Module({
  imports: [HttpModule, ConfigModule, 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Lấy Secret từ .env
        signOptions: { 
            // Có thể bỏ qua expiresIn ở đây, hoặc dùng token vĩnh viễn cho S2S
            // Tuy nhiên, nên đặt expire time ngắn (ví dụ: 1h) để đảm bảo bảo mật.
        }, 
      }),
    }),
  ], 
  providers: [
    { provide: IAccountServiceClient, useClass: AccountServiceClient }, // Sử dụng Symbol đã import
  ],
  exports: [IAccountServiceClient], 
})
export class ClientModule {}