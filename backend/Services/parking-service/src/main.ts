import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common' // Nên có để validate DTOs
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(ConfigService)
  // (Tùy chọn nhưng khuyến khích) Bật Global Validation Pipe
  // Giúp Swagger hoạt động tốt với các validation decorator trong DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các thuộc tính không được định nghĩa trong DTO
      transform: true, // Tự động chuyển đổi kiểu dữ liệu (ví dụ: string sang number)
    }),
  )

  // --- Bắt đầu cấu hình Swagger ---
  app.enableCors() // Bật CORS nếu cần thiết, giúp frontend có thể gọi API từ backend
  // Tạo một đối tượng cấu hình cơ bản cho Swagger document
  const config = new DocumentBuilder()
    .setTitle('Parking Service') // Tiêu đề hiển thị trên Swagger UI
    .setDescription('Parking Service API Documentation') // Mô tả chi tiết hơn về API
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  // Tạo Swagger document dựa trên cấu hình và ứng dụng NestJS
  // NestJS sẽ tự động quét các controller và DTO có decorator của @nestjs/swagger
  const document = SwaggerModule.createDocument(app, config)

  // Thiết lập endpoint để phục vụ Swagger UI
  // '/api-docs' là đường dẫn bạn sẽ truy cập để xem UI (ví dụ: http://localhost:3000/api-docs)
  // Tham số thứ 2 là instance của ứng dụng NestJS
  // Tham số thứ 3 là document đã tạo ở trên
  SwaggerModule.setup('api/v1', app, document)

  // --- Kết thúc cấu hình Swagger ---

  const port = configService.get<number>('PORT') || 3000
  await app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
  console.log(`Swagger UI available at http://localhost:${port}/api/v1`)
  console.log(
    `API documentation available at http://localhost:${port}/api/v1-json`,
  )
}
void bootstrap()
