import { MongooseModule } from '@nestjs/mongoose'
import { ConfigService } from '@nestjs/config'
export const DatabaseConfig = MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    try {
      const mongoUri = configService.get<string>('MONGO_URI')

      // Kiểm tra nếu mongoUri là undefined hoặc null
      if (!mongoUri) {
        throw new Error('MONGO_URI is not defined in the environment variables')
      }

      return { uri: mongoUri }
    } catch (error: unknown) {
      // Kiểm tra nếu error là instance của Error
      if (error instanceof Error) {
        console.error(
          'Error occurred while setting up MongoDB connection:',
          error.message,
        )
      } else {
        console.error(
          'An unknown error occurred while setting up MongoDB connection',
        )
      }
      throw error // Ném lại lỗi sau khi đã xử lý
    }
  },
})
