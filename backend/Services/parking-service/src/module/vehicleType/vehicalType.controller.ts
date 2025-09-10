import { Controller, Get, Inject } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IVehicleTypeService } from './interfaces/ivehicalType.service'

@ApiTags('vehicle-types')
@Controller('vehicle-types')
export class VehicleTypeController {
  constructor(
    @Inject(IVehicleTypeService)
    private readonly vehicleTypeService: IVehicleTypeService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách loại xe',
  })
  getVehicleTypes() {
    return this.vehicleTypeService.getVehicleTypes()
  }
}
