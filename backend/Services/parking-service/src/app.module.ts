import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseConfig } from './config/database.config'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './strategy/jwt.strategy'
import { JwtAuthGuard } from './guard/jwtAuth.guard'
import { WardModule } from './module/ward/ward.module'
import { AddressModule } from './module/address/address.module'
import { BrandModule } from './module/brand/brand.module'
import { VehicleTypeModule } from './module/vehicleType/vehicleType.module'
import { CacheModule } from '@nestjs/cache-manager'
import { ColorModule } from './module/color/color.module'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Rất quan trọng!
    }),
    CacheModule.register({
      isGlobal: true, // <-- Quan trọng nhất: Đặt module này ở chế độ toàn cục
      ttl: 300 * 1000, // 5 phút
      max: 100,
    }),
    DatabaseConfig,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule, // Dùng ConfigModule để quản lý biến môi trường
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        // Bạn không cần signOptions ở đây vì service này không tạo token
      }),
    }),
    WardModule,
    AddressModule,
    BrandModule,
    VehicleTypeModule,
    ColorModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy, JwtAuthGuard],
})
export class AppModule {}
