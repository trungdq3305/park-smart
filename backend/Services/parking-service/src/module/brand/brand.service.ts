import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateBrandDto } from './dto/createBrand.dto'
import { IBrandRepository } from './interfaces/ibrand.repository'
import { IBrandService } from './interfaces/ibrand.service'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { BrandResponseDto } from './dto/brandResponse.dto'
import { isMongoId } from 'class-validator'

@Injectable()
export class BrandService implements IBrandService {
  constructor(
    @Inject(IBrandRepository)
    private readonly brandRepository: IBrandRepository,
  ) {}
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
      data: [brand],
      statusCode: 201,
      message: 'Hãng xe đã được tạo thành công',
      success: true,
    }
  }

  async findBrandById(id: string): Promise<ApiResponseDto<BrandResponseDto>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const brand = await this.brandRepository.findBrandById(id)
    if (!brand) {
      throw new NotFoundException('Không tìm thấy hãng xe')
    }
    return {
      data: [brand],
      statusCode: 200,
      message: 'Hãng xe đã được tìm thấy',
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
