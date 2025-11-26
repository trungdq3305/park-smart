import { FileValidator } from '@nestjs/common'

export class CustomImageFileValidator extends FileValidator {
  isValid(file: Express.Multer.File): boolean {
    // 1. Log ra xem Server thực sự nhận được gì (để debug nếu vẫn lỗi)
    console.log('Server received mime-type:', file.mimetype)

    // 2. Check thủ công
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png']
    return allowedMimeTypes.includes(file.mimetype)
  }

  buildErrorMessage(): string {
    return 'File tải lên phải là định dạng ảnh (JPG, JPEG, PNG)'
  }
}
