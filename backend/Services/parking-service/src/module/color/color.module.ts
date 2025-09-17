import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Color, ColorSchema } from './schemas/color.schema'
import { ColorController } from './color.controller'
import { IColorService } from './interfaces/icolorservice'
import { ColorService } from './color.service'
import { IColorRepository } from './interfaces/icolor.repository'
import { ColorRepository } from './color.repository'

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
