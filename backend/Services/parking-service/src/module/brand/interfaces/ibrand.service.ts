import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { BrandResponseDto } from '../dto/brandResponse.dto'
import { CreateBrandDto } from '../dto/createBrand.dto'

export interface IBrandService {
  createBrand(
    createBrandDto: CreateBrandDto,
    userId: string,
  ): Promise<ApiResponseDto<BrandResponseDto>>
  findBrandById(id: string): Promise<ApiResponseDto<BrandResponseDto>>
  findAllBrands(): Promise<ApiResponseDto<BrandResponseDto>>
  deleteBrand(id: string, userId: string): Promise<ApiResponseDto<boolean>>
  restoreBrand(id: string, userId: string): Promise<ApiResponseDto<boolean>>
}

export const IBrandService = Symbol('IBrandService')
