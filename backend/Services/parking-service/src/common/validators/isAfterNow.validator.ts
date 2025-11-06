import { Injectable } from '@nestjs/common'
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({ name: 'isAfterNow', async: false })
@Injectable()
export class IsAfterNowConstraint implements ValidatorConstraintInterface {
  /**
   * Logic kiểm tra
   */
  validate(value: Date, _args: ValidationArguments) {
    // 1. Kiểm tra xem giá trị có phải là ngày hợp lệ không
    const inputDate = new Date(value)
    if (isNaN(inputDate.getTime())) {
      return false // Không phải ngày
    }

    // 2. So sánh với thời gian hiện tại
    const now = new Date()

    // ⭐️ Trả về true nếu thời gian nhập vào LỚN HƠN thời gian hiện tại
    return inputDate > now
  }

  /**
   * Thông báo lỗi mặc định
   */
  defaultMessage(_args: ValidationArguments) {
    return `Thời gian ($value) phải lớn hơn thời gian hiện tại.`
  }
}
