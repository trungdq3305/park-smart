import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { ColorController } from './color.controller'
import { ColorRepository } from './color.repository'
import { ColorService } from './color.service'
import { IColorRepository } from './interfaces/icolor.repository'
import { IColorService } from './interfaces/icolorservice'
import { Color, ColorSchema } from './schemas/color.schema'

@Module({
  imports: [
    // Chỉ cần đăng ký một schema duy nhất
    MongooseModule.forFeature([{ name: Color.name, schema: ColorSchema }]),
  ],
  controllers: [ColorController],
  providers: [
    {
      provide: IColorService,
      useClass: ColorService,
    },
    {
      provide: IColorRepository,
      useClass: ColorRepository,
    },
  ],
  exports: [IColorRepository, IColorService],
})
export class ColorModule {}
