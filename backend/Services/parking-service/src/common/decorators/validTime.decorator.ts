import type { ValidationOptions } from 'class-validator'
import { registerDecorator } from 'class-validator'

import { IsAfterTimeConstraint } from '../validators/isAfterTimeValidator.validator'

export function IsAfterTime(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterTime',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property], // Truyền tên của thuộc tính 'openTime' vào đây
      options: validationOptions,
      validator: IsAfterTimeConstraint, // Sử dụng logic validator đã tạo ở trên
    })
  }
}
