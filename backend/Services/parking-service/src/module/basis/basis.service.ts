import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'

import { BasisResponseDto } from './dto/basis.dto'
import { IBasisRepository } from './interfaces/ibasis.repository'
import { IBasisService } from './interfaces/ibasis.service'

@Injectable()
export class BasisService implements IBasisService {
  constructor(
    @Inject(IBasisRepository)
    private readonly basisRepository: IBasisRepository,
  ) {}

  private returnBasisResponseDto(basis: BasisResponseDto): BasisResponseDto {
    return plainToInstance(BasisResponseDto, basis, {
      excludeExtraneousValues: true,
    })
  }

  async findBasisById(id: string): Promise<BasisResponseDto> {
    const basis = await this.basisRepository.findBasisById(id)
    if (!basis) {
      throw new NotFoundException('Loại hình tính giá không tồn tại')
    }
    return this.returnBasisResponseDto(basis)
  }

  async findAllBasis(): Promise<BasisResponseDto[]> {
    const basisList = await this.basisRepository.findAllBasis()
    if (!basisList || basisList.length === 0) {
      throw new NotFoundException('Không có loại hình tính giá nào')
    }
    return basisList.map((basis) => this.returnBasisResponseDto(basis))
  }
}
