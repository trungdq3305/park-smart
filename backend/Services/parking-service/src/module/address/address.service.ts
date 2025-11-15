import { HttpService } from '@nestjs/axios'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { plainToInstance } from 'class-transformer'

import { IWardRepository } from '../ward/interfaces/iward.repository'
import {
  AddressResponseDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/address.dto'
import { IAddressRepository } from './interfaces/iaddress.repository'
import { IAddressService } from './interfaces/iaddress.service'
import { Address } from './schemas/address.schema'
// Giữ lại các type cho Nominatim

@Injectable()
export class AddressService implements IAddressService {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepository: IAddressRepository,
    @Inject(IWardRepository) private readonly wardRepository: IWardRepository,
    private readonly httpService: HttpService,
  ) {}

  cityName = 'Thành phố Hồ Chí Minh'

  private returnAddressResponseDto(address: Address): AddressResponseDto {
    return plainToInstance(AddressResponseDto, address, {
      excludeExtraneousValues: true,
    })
  }

  async findAllAddresses(): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.findAllAddresses()
    if (!addresses) {
      throw new NotFoundException('Không tìm thấy địa chỉ nào')
    }
    return addresses.map((address) => this.returnAddressResponseDto(address))
  }

  async findAddressById(id: string): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findAddressById(id)
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ')
    }
    return this.returnAddressResponseDto(address)
  }

  async createAddress(
    createAddressDto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const coordinates = {
      latitude: createAddressDto.latitude,
      longitude: createAddressDto.longitude,
    }

    const address = await this.addressRepository.createAddress(
      createAddressDto,
      coordinates,
    )
    if (!address) {
      throw new BadRequestException('Không thể tạo địa chỉ')
    }
    return this.returnAddressResponseDto(address)
  }

  async updateAddress(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const coordinates = {
      latitude: updateAddressDto.latitude,
      longitude: updateAddressDto.longitude,
    }

    const address = await this.addressRepository.updateAddress(
      id,
      updateAddressDto,
      coordinates,
    )
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ')
    }
    return this.returnAddressResponseDto(address)
  }

  async deleteAddress(id: string): Promise<boolean> {
    const result = await this.addressRepository.deleteAddress(id)
    if (!result) {
      throw new BadRequestException('Xóa địa chỉ thất bại')
    }
    return result
  }
}
