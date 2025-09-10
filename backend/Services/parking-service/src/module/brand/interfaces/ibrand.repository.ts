import { CreateBrandDto } from '../dto/createBrand.dto'
import { Brand } from '../schemas/brand.schema'

export interface IBrandRepository {
  createBrand(brand: CreateBrandDto, userId: string): Promise<Brand>
  findAllBrands(): Promise<Brand[]>
  findBrandById(id: string): Promise<Brand | null>
  findBrandByName(name: string): Promise<Brand | null>
  deleteBrand(id: string, userId: string): Promise<boolean>
  restoreBrand(id: string, userId: string): Promise<boolean>
}

export const IBrandRepository = Symbol('IBrandRepository')
