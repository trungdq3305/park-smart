import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { PaginationDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import { IdDto } from 'src/common/dto/params.dto'

import {
  CreatePackageRateDto,
  PackageRateResponseDto,
  UpdatePackageRateDto,
} from './dto/packageRate.dto'
import { IPackageRateRepository } from './interfaces/ipackageRate.repository'
import { IPackageRateService } from './interfaces/ipackageRate.service'
import { PackageRate } from './schemas/packageRate.schema'

@Injectable()
export class PackageRateService implements IPackageRateService {
  constructor(
    @Inject(IPackageRateRepository)
    private readonly packageRateRepository: IPackageRateRepository,
  ) {}

  private returnPackageRateResponseDto(
    packageRate: PackageRate,
  ): PackageRateResponseDto {
    return plainToInstance(PackageRateResponseDto, packageRate, {
      excludeExtraneousValues: true,
    })
  }

  createPackageRate(
    createDto: CreatePackageRateDto,
    operatorId: string,
  ): Promise<PackageRateResponseDto> {
    throw new Error('Method not implemented.')
  }

  updatePackageRate(
    id: IdDto,
    updateDto: UpdatePackageRateDto,
    operatorId: string,
  ): Promise<PackageRateResponseDto> {
    throw new Error('Method not implemented.')
  }

  getPackageRateById(id: IdDto): Promise<PackageRateResponseDto> {
    throw new Error('Method not implemented.')
  }

  getAllPackageRatesByOperator(
    operatorId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: PackageRateResponseDto[]; pagination: PaginationDto }> {
    throw new Error('Method not implemented.')
  }

  softDeletePackageRate(id: IdDto, operatorId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
}
