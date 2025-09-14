import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { IWardService } from './interfaces/iward.service'
import { IWardRepository } from './interfaces/iward.repository'
import { Ward } from './schemas/ward.schema'
import { WardResponseDto } from './dto/ward.dto'
import { plainToInstance } from 'class-transformer'

@Injectable()
export class WardService implements IWardService {
  constructor(
    @Inject(IWardRepository) private wardRepository: IWardRepository,
  ) {}

  private returnWardResponseDto(ward: Ward): WardResponseDto {
    return plainToInstance(WardResponseDto, ward, {
      excludeExtraneousValues: true,
    })
  }

  async getWards(): Promise<WardResponseDto[]> {
    // <-- Sửa: Trả về entity
    const wards = await this.wardRepository.getWards()
    if (!wards || wards.length === 0) {
      throw new NotFoundException('Không tìm thấy khu vực nào')
    }
    return wards.map((ward) => this.returnWardResponseDto(ward))
  }
}
