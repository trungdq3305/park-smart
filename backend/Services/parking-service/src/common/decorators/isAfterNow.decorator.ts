import type { ValidationOptions } from 'class-validator'
import { registerDecorator } from 'class-validator'

import { IsAfterNowConstraint } from '../validators/isAfterNow.validator'

/**
 * Decorator để kiểm tra xem thời gian có lớn hơn thời gian hiện tại không.
 */
export function IsAfterNow(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAfterNowConstraint, // ⭐️ Chỉ định validator
    })
  }
}
