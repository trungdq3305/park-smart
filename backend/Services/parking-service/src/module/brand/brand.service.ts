 
import { HttpService } from '@nestjs/axios'
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { plainToInstance } from 'class-transformer'
import { firstValueFrom } from 'rxjs'

import { BrandResponseDto, CreateBrandDto } from './dto/brand.dto'
import { IBrandRepository } from './interfaces/ibrand.repository'
import { IBrandService } from './interfaces/ibrand.service'
import { Brand } from './schemas/brand.schema'

@Injectable()
export class BrandService implements IBrandService {
  constructor(
    @Inject(IBrandRepository)
    private readonly brandRepository: IBrandRepository,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private readonly logger = new Logger(BrandService.name)
  private readonly configService = new ConfigService()
  private readonly accountServiceUrl =
    this.configService.get<string>('CORE_SERVICE_URL') ?? ''

  private returnBrandResponseDto(brand: Brand): BrandResponseDto {
    return plainToInstance(BrandResponseDto, brand, {
      excludeExtraneousValues: true,
    })
  }

  async createBrand(
    createBrandDto: CreateBrandDto,
    userId: string,
  ): Promise<BrandResponseDto> {
    const existingBrand = await this.brandRepository.findBrandByName(
      createBrandDto.brandName,
    )
    if (existingBrand && !existingBrand.deletedAt) {
      // Chỉ báo lỗi nếu hãng xe đang hoạt động
      throw new ConflictException('Hãng xe đã tồn tại')
    }
    const brand = await this.brandRepository.createBrand(createBrandDto, userId)
    return this.returnBrandResponseDto(brand)
  }

  async findBrandById(
    id: string,
  ): Promise<BrandResponseDto & { message: string }> {
    const brand = await this.brandRepository.findBrandById(id)
    if (!brand) {
      throw new NotFoundException('Không tìm thấy hãng xe')
    }

    const brandResponse = this.returnBrandResponseDto(brand)
    let message = 'Hãng xe đã được tìm thấy'

    if (brand.deletedBy) {
      const cacheKey = `ACCOUNT_${brand.deletedBy}`
      let accountData = await this.cacheManager.get<{
        id: string
        name?: string
        [key: string]: unknown
      } | null>(cacheKey)

      if (!accountData) {
        try {
          const accountServiceUrl =
            this.accountServiceUrl + `/api/accounts/${brand.deletedBy}`
          const accountResponse = await firstValueFrom(
            this.httpService.get<{
              data: { id: string; name?: string; [key: string]: unknown }
            }>(accountServiceUrl),
          )
          accountData = accountResponse.data.data as {
            id: string
            name?: string
            [key: string]: unknown
          }
          await this.cacheManager.set(cacheKey, accountData)
        } catch (error) {
          const errorMessage =
            error && typeof error === 'object' && 'message' in error
              ? (error as { message: string }).message
              : String(error)
          this.logger.error(
            `Không thể lấy thông tin người xóa với ID: ${brand.deletedBy}. Lỗi: ${errorMessage}`,
          )
          message =
            'Hãng xe đã được tìm thấy, nhưng không thể lấy thông tin người xóa.'
        }
      }
      brandResponse.deletedBy = accountData ?? brand.deletedBy
    }

    return { ...brandResponse, message }
  }

  async findAllBrands(): Promise<BrandResponseDto[]> {
    const brands = await this.brandRepository.findAllBrands()
    if (brands.length === 0) {
      throw new NotFoundException('Không tìm thấy hãng xe nào')
    }
    return brands.map((brand) => this.returnBrandResponseDto(brand))
  }

  async deleteBrand(id: string, userId: string): Promise<boolean> {
    const success = await this.brandRepository.deleteBrand(id, userId)
    if (!success) {
      throw new BadRequestException(
        'Xóa hãng xe thất bại. Có thể ID không tồn tại hoặc xe đã bị xóa.',
      )
    }
    return success
  }

  async restoreBrand(id: string, userId: string): Promise<boolean> {
    const success = await this.brandRepository.restoreBrand(id, userId)
    if (!success) {
      throw new BadRequestException(
        'Khôi phục hãng xe thất bại. Có thể ID không tồn tại hoặc xe không ở trạng thái bị xóa.',
      )
    }
    return success
  }
}
