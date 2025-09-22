import type { CreateAddressDto, UpdateAddressDto } from '../dto/address.dto'
import type { Address } from '../schemas/address.schema'

export interface IAddressRepository {
  createAddress(
    address: CreateAddressDto,
    coordinates: { latitude: number; longitude: number },
    userId: string,
  ): Promise<Address | null>
  findAllAddresses(): Promise<Address[] | null>
  findAddressById(id: string): Promise<Address | null>
  updateAddress(
    id: string,
    address: UpdateAddressDto,
    coordinates: { latitude: number; longitude: number },
    userId: string,
  ): Promise<Address | null>
  deleteAddress(id: string, userId: string): Promise<boolean>
  setAddressAsUsed(id: string): Promise<Address | null>
  findWithinBox(
    bottomLeft: [number, number],
    topRight: [number, number],
    page: number,
    limit: number,
  ): Promise<{ data: Address[]; total: number }>
  findNear(
    longitude: number,
    latitude: number,
    maxDistanceInKm: number,
  ): Promise<Address[]>
}

export const IAddressRepository = Symbol('IAddressRepository')
