import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IWardRepository } from './interfaces/iward.repository'
import { IWardService } from './interfaces/iward.service'
import { Ward, WardSchema } from './schemas/ward.schema'
import { WardController } from './ward.controller'
import { WardRepository } from './ward.repository'
import { WardService } from './ward.service'

@Module({
  imports: [
    // Chỉ cần đăng ký một schema duy nhất
    MongooseModule.forFeature([{ name: Ward.name, schema: WardSchema }]),
  ],
  controllers: [WardController],
  providers: [
    {
      provide: IWardService,
      useClass: WardService,
    },
    {
      provide: IWardRepository,
      useClass: WardRepository,
    },
  ],
  exports: [IWardRepository, IWardService],
})
export class WardModule {}
