import { Controller, Get, HttpStatus, Inject, Param } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'

import type { BasisResponseDto } from './dto/basis.dto'
import { IBasisService } from './interfaces/ibasis.service'

@ApiTags('basis')
@Controller('basis')
export class BasisController {
  constructor(
    @Inject(IBasisService)
    private readonly basisService: IBasisService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách các loại hình (cơ sở) tính giá',
    description:
      'Trả về một danh sách tất cả các cơ sở tính giá hiện có trong hệ thống (ví dụ: TIERED, PACKAGE, HOURLY...).',
  })
  async getAllBasis(): Promise<ApiResponseDto<BasisResponseDto[]>> {
    const allBasis = await this.basisService.findAllBasis()

    return {
      data: allBasis,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách cơ sở tính giá thành công.',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết một cơ sở tính giá bằng ID',
    description:
      'Trả về thông tin chi tiết của một cơ sở tính giá dựa trên ID cung cấp.',
  })
  @ApiParam({ name: 'id', description: 'ID của cơ sở tính giá', type: String })
  async getBasisById(
    @Param() params: IdDto, // Lấy toàn bộ params và validate như một DTO
  ): Promise<ApiResponseDto<BasisResponseDto>> {
    const basis = await this.basisService.findBasisById(params.id)

    return {
      data: basis,
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin chi tiết cơ sở tính giá thành công.',
      success: true,
    }
  }
}
