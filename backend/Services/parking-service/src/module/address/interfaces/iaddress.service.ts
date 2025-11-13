import type {
  AddressResponseDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '../dto/address.dto'

// Service interface giờ đây chỉ làm việc với entity
export interface IAddressService {
  createAddress(createAddressDto: CreateAddressDto): Promise<AddressResponseDto>
  findAddressById(id: string): Promise<AddressResponseDto>
  findAllAddresses(): Promise<AddressResponseDto[]>
  updateAddress(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto>
  deleteAddress(id: string): Promise<boolean>
}

export const IAddressService = Symbol('IAddressService')
