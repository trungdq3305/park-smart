import { IsMongoId, IsNotEmpty } from 'class-validator'

export class IdDto {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsMongoId({ message: 'Id không hợp lệ' })
  id: string
}

export class ParkingLotStatusIdDto {
  @IsNotEmpty({ message: 'parkingLotStatusId không được để trống' })
  @IsMongoId({ message: 'parkingLotStatusId không hợp lệ' })
  parkingLotStatusId: string
}

export class ParkingLotIdDto {
  @IsNotEmpty({ message: 'parkingLotId không được để trống' })
  @IsMongoId({ message: 'parkingLotId không hợp lệ' })
  parkingLotId: string
}1
