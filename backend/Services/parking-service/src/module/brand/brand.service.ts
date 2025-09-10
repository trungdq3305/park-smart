import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { CreateBrandDto } from './dto/createBrand.dto'
import { IBrandRepository } from './interfaces/ibrand.repository'
import { IBrandService } from './interfaces/ibrand.service'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { BrandResponseDto } from './dto/brandResponse.dto'
import { isMongoId } from 'class-validator'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { ConfigService } from '@nestjs/config'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

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
    this.configService.get<string>('CORE_SERVICE_URL')

  async createBrand(
    createBrandDto: CreateBrandDto,
    userId: string,
  ): Promise<ApiResponseDto<BrandResponseDto>> {
    const existingBrand = await this.brandRepository.findBrandByName(
      createBrandDto.brandName,
    )
    if (existingBrand) {
      throw new ConflictException('Hãng xe đã tồn tại')
    }
    const brand = await this.brandRepository.createBrand(createBrandDto, userId)
    return {
      data: [new BrandResponseDto(brand)],
      statusCode: 201,
      message: 'Hãng xe đã được tạo thành công',
      success: true,
    }
  }

  /**
   * Ví dụ về việc call API từ service khác
   *
   * Ví dụ về việc sử dụng Cache Manager trong phương thức findBrandById để cache dữ liệu
   */
  async findBrandById(id: string): Promise<ApiResponseDto<any>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }

    const brand = await this.brandRepository.findBrandById(id)

    if (!brand) {
      throw new NotFoundException('Không tìm thấy hãng xe')
    }

    const brandResponse = { ...brand }

    // Khai báo message mặc định
    let message = 'Hãng xe đã được tìm thấy'

    if (brandResponse.deletedBy) {
      // 1. Tạo một key duy nhất cho cache
      const cacheKey = `ACCOUNT_${brandResponse.deletedBy}`

      // 2. Thử lấy dữ liệu từ cache trước
      let accountData = await this.cacheManager.get<any>(cacheKey)

      // 3. Cache miss: Nếu không tìm thấy dữ liệu trong cache
      if (!accountData) {
        try {
          // 3a. Gọi API đến Account Service
          const accountServiceUrl =
            this.accountServiceUrl + `/api/accounts/${brandResponse.deletedBy}`
          const accountResponse = await firstValueFrom(
            this.httpService.get(accountServiceUrl),
          )

          accountData = accountResponse.data.data // Giả sử dữ liệu nằm trong response.data.data

          // 3b. Lưu kết quả vừa lấy được vào cache để dùng cho lần sau
          await this.cacheManager.set(cacheKey, accountData)
        } catch (error) {
          // 3c. Xử lý khi gọi API lỗi
          this.logger.error(
            `Không thể lấy thông tin người xóa với ID: ${brandResponse.deletedBy}. Lỗi: ${error.message}`,
          )
          // Cập nhật lại message để thông báo cho client
          message =
            'Hãng xe đã được tìm thấy, nhưng không thể lấy thông tin người xóa.'
        }
      }

      // 5. Gán dữ liệu account (từ cache hoặc từ API) vào response
      brandResponse.deletedBy = accountData || brandResponse.deletedBy
    }

    // 6. Trả về kết quả với message đã được cập nhật (nếu có)
    return {
      data: [new BrandResponseDto(brandResponse)],
      statusCode: 200,
      message: message,
      success: true,
    }
  }

  async findAllBrands(): Promise<ApiResponseDto<BrandResponseDto>> {
    const brands = await this.brandRepository.findAllBrands()
    if (!brands || brands.length === 0) {
      throw new NotFoundException('Không tìm thấy hãng xe nào')
    }
    return {
      data: brands.map((brand) => new BrandResponseDto(brand)),
      statusCode: 200,
      message: 'Tìm thấy tất cả hãng xe thành công',
      success: true,
    }
  }

  async deleteBrand(
    id: string,
    userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const success = await this.brandRepository.deleteBrand(id, userId)
    if (!success) {
      throw new BadRequestException('Xóa hãng xe thất bại')
    }
    return {
      data: [success],
      statusCode: 200,
      message: 'Xóa hãng xe thành công',
      success: true,
    }
  }

  async restoreBrand(
    id: string,
    userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const success = await this.brandRepository.restoreBrand(id, userId)
    if (!success) {
      throw new BadRequestException('Khôi phục hãng xe thất bại')
    }
    return {
      data: [success],
      statusCode: 200,
      message: 'Khôi phục hãng xe thành công',
      success: true,
    }
  }
}
