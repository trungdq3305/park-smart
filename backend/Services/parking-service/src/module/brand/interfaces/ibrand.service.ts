import type { BrandResponseDto } from '../dto/brand.dto'
import type { CreateBrandDto } from '../dto/brand.dto'

export interface IBrandService {
  createBrand(
    createBrandDto: CreateBrandDto,
    userId: string,
  ): Promise<BrandResponseDto>
  findBrandById(id: string): Promise<BrandResponseDto & { message: string }>
  findAllBrands(): Promise<BrandResponseDto[]>
  deleteBrand(id: string, userId: string): Promise<boolean>
  restoreBrand(id: string, userId: string): Promise<boolean>
}

export const IBrandService = Symbol('IBrandService')
