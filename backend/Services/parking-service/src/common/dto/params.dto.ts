import { IsMongoId, IsNotEmpty } from 'class-validator'

export class IdDto {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsMongoId({ message: 'Id không hợp lệ' })
  id: string
}
