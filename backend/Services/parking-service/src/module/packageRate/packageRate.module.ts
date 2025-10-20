import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { IPackageRateRepository } from './interfaces/ipackageRate.repository'
import { IPackageRateService } from './interfaces/ipackageRate.service'
import { PackageRateController } from './packageRate.controller'
import { PackageRateRepository } from './packageRate.repository'
import { PackageRateService } from './packageRate.service'
import { PackageRate, PackageRateSchema } from './schemas/packageRate.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PackageRate.name, schema: PackageRateSchema },
    ]),
  ],
  controllers: [PackageRateController],
  providers: [
    {
      provide: IPackageRateRepository,
      useClass: PackageRateRepository,
    },
    {
      provide: IPackageRateService,
      useClass: PackageRateService,
    },
  ],
  exports: [IPackageRateRepository, IPackageRateService],
})
export class PackageRateModule {}
