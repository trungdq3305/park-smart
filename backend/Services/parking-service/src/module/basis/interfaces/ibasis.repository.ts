import type { Basis } from '../schemas/basis.schema'

export interface IBasisRepository {
  findBasisById(id: string): Promise<Basis | null>
  findAllBasis(): Promise<Basis[] | null>
}

export const IBasisRepository = Symbol('IBasisRepository')
