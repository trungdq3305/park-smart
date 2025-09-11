import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Brand, BrandSchema } from './schemas/brand.schema'
import { BrandController } from './brand.controller'
import { IBrandService } from './interfaces/ibrand.service'
import { BrandService } from './brand.service'
import { IBrandRepository } from './interfaces/ibrand.repository'
import { BrandRepository } from './brand.repository'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [
    // Chỉ cần đăng ký một schema duy nhất
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    HttpModule,
  ],
  controllers: [BrandController],
  providers: [
    {
      provide: IBrandService,
      useClass: BrandService,
    },
    {
      provide: IBrandRepository,
      useClass: BrandRepository,
    },
  ],
  exports: [IBrandRepository, IBrandService],
})
export class BrandModule {}
