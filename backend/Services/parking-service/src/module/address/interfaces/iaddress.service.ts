import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { AddressResponseDto } from '../dto/addressResponse.dto'
import { UpdateAddressDto } from '../dto/updateAddress.dto'
import { CreateAddressDto } from '../dto/createAddress.dto'

export interface IAddressService {
  createAddress(
    createAddressDto: CreateAddressDto,
    userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>>
  findAddressById(id: string): Promise<ApiResponseDto<AddressResponseDto>>
  findAllAddresses(): Promise<ApiResponseDto<AddressResponseDto>>
  updateAddress(
    id: string,
    updateAddressDto: UpdateAddressDto,
    userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>>
  deleteAddress(id: string, userId: string): Promise<ApiResponseDto<boolean>>
}

export const IAddressService = Symbol('IAddressService')
