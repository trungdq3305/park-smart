/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'

// Đăng ký validator với tên 'isAfterTime'
@ValidatorConstraint({ name: 'isAfterTime', async: false })
export class IsAfterTimeConstraint implements ValidatorConstraintInterface {
  // Hàm chính để thực hiện validation
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints // Lấy tên của thuộc tính cần so sánh (vd: 'openTime')
    const relatedValue = (args.object as any)[relatedPropertyName] // Lấy giá trị của thuộc tính đó

    // Nếu một trong hai giá trị không tồn tại, bỏ qua validation
    if (!value || !relatedValue) {
      return true
    }

    // Vì định dạng là 'HH:MM', chúng ta có thể so sánh chuỗi trực tiếp
    // Ví dụ: '17:00' > '08:00' là đúng
    return (
      typeof value === 'string' &&
      typeof relatedValue === 'string' &&
      value > relatedValue
    )
  }

  // Hàm để trả về thông báo lỗi mặc định
  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints
    return `${args.property} phải sau ${relatedPropertyName}`
  }
}
