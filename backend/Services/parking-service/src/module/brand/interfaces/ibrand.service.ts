import { BrandResponseDto } from '../dto/brand.dto'
import { CreateBrandDto } from '../dto/brand.dto'

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
