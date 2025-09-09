import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { IWardService } from './interfaces/iward.service'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { WardDto } from './dto/ward.dto'
import { IWardRepository } from './interfaces/iward.repository'

@Injectable()
export class WardService implements IWardService {
  constructor(
    @Inject(IWardRepository) private wardRepository: IWardRepository,
  ) {}

  async getWards(): Promise<ApiResponseDto<WardDto>> {
    const wards = await this.wardRepository.getWards()
    return new ApiResponseDto({
      data: wards,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách khu vực thành công',
    })
  }
}
