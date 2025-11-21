import { HttpModule } from '@nestjs/axios'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ScheduleModule } from '@nestjs/schedule'
import { TerminusModule } from '@nestjs/terminus'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseConfig } from './config/database.config'
import { JwtAuthGuard } from './guard/jwtAuth.guard'
import { HealthController } from './health.controller'
import { AddressModule } from './module/address/address.module'
import { AnnouncementModule } from './module/announcement/announcement.module'
import { BasisModule } from './module/basis/basis.module'
import { BookingInventoryModule } from './module/bookingInventory/bookingInventory.module'
import { GuestCardModule } from './module/guestCard/guestCard.module'
import { NotificationModule } from './module/notification/notification.module'
import { PackageRateModule } from './module/packageRate/packageRate.module'
import { ParkingLotModule } from './module/parkingLot/parkingLot.module'
import { ParkingLotPolicyLinkModule } from './module/parkingLotPolicyLinks/parkingLotPolicyLinks.module'
import { ParkingLotSessionModule } from './module/parkingLotSession/parkingLotSession.module'
import { ParkingSpaceModule } from './module/parkingSpace/parkingSpace.module'
import { ParkingSpaceStatusModule } from './module/parkingSpaceStatus/parkingSpaceStatus.module'
import { PricingPolicyModule } from './module/pricingPolicy/pricingPolicy.module'
import { ReservationModule } from './module/reservation/reservation.module'
import { SubscriptionModule } from './module/subscription/subcription.module'
import { TieredRateSetModule } from './module/tieredRateSet/tieredRateSet.module'
import { WardModule } from './module/ward/ward.module'
import { JwtStrategy } from './strategy/jwt.strategy'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Rất quan trọng!
    }),
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true, // <-- Quan trọng nhất: Đặt module này ở chế độ toàn cục
      ttl: 300 * 1000, // 5 phút
      max: 100,
    }),
    TerminusModule, // <-- Thêm vào
    HttpModule,
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
    ParkingLotModule,
    ParkingSpaceModule,
    ParkingSpaceStatusModule,
    BasisModule,
    PackageRateModule,
    TieredRateSetModule,
    PricingPolicyModule,
    NotificationModule,
    BookingInventoryModule,
    AnnouncementModule,
    ParkingLotPolicyLinkModule,
    SubscriptionModule,
    ReservationModule,
    ParkingLotSessionModule,
    GuestCardModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, JwtStrategy, JwtAuthGuard],
})
export class AppModule {}
