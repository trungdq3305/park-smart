import type { BasisResponseDto } from '../dto/basis.dto'

export interface IBasisService {
  findBasisById(id: string): Promise<BasisResponseDto>
  findAllBasis(): Promise<BasisResponseDto[]>
}

export const IBasisService = Symbol('IBasisService')
