import { HttpService } from '@nestjs/axios'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import axios from 'axios'
import { plainToInstance } from 'class-transformer'
import { firstValueFrom } from 'rxjs'

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
interface NominatimLocation {
  lat: string
  lon: string
}
type NominatimResponse = NominatimLocation[]

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

  private async getCoordinatesFromAddress(
    address: string,
    wardId: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const wardName = await this.wardRepository.getWardNameById(wardId)
    if (!wardName) {
      throw new NotFoundException('WardId không tồn tại')
    }
    const fullAddress = this.cityName + ', ' + wardName + ', ' + address
    const encodedAddress = encodeURIComponent(fullAddress)
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodedAddress}`

    try {
      const response = await firstValueFrom(
        this.httpService.get<NominatimResponse>(url, {
          // <-- Thêm kiểu dữ liệu ở đây
          timeout: 5000, // 5 giây
          headers: {
            'User-Agent': 'NestJS-GeoCoding-App/1.0 (contact@example.com)',
          },
        }),
      )

      if (typeof response !== 'object' || !('data' in response)) {
        throw new HttpException(
          'Không nhận được dữ liệu hợp lệ từ dịch vụ định vị.',
          HttpStatus.SERVICE_UNAVAILABLE,
        )
      }
      const locations = (response as { data: NominatimResponse }).data // <-- Đã sửa ở đây

      // Kiểm tra kết quả
      if (locations.length === 0) {
        // <-- Sửa ở đây
        throw new HttpException(
          `Không thể tìm thấy địa chỉ: "${fullAddress}"`,
          HttpStatus.BAD_REQUEST,
        )
      }

      // Lấy kết quả đầu tiên
      const { lat, lon } = locations[0] // <-- Sửa ở đây
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lon)

      return { latitude, longitude }
    } catch (error) {
      // Luôn ưu tiên re-throw HttpException nếu nó đã được ném ra từ trước
      if (error instanceof HttpException) {
        throw error
      }

      // Kiểm tra xem đây có phải là lỗi từ Axios không
      if (axios.isAxiosError(error) && error.response) {
        console.error(
          `Lỗi từ Nominatim API - Status: ${String(error.response.status)}`,
          JSON.stringify(error.response.data, null, 2),
        )

        // Dựa vào status code để trả về lỗi phù hợp
        if (error.response.status === 400) {
          throw new HttpException(
            `Địa chỉ không hợp lệ hoặc không tìm thấy: "${fullAddress}"`,
            HttpStatus.BAD_REQUEST,
          )
        }
        if (error.response.status === 429) {
          throw new HttpException(
            'Vượt quá giới hạn truy cập API định vị.',
            HttpStatus.TOO_MANY_REQUESTS,
          )
        }
      } else {
        // Dành cho các lỗi khác không phải từ Axios (ví dụ: lỗi mạng cục bộ)
        console.error('Lỗi không xác định khi gọi API:', error)
      }

      // Lỗi mặc định nếu không rơi vào các trường hợp trên
      throw new HttpException(
        'Lỗi từ dịch vụ định vị OpenStreetMap.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
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
    userId: string,
  ): Promise<AddressResponseDto> {
    const coordinates = await this.getCoordinatesFromAddress(
      createAddressDto.fullAddress,
      createAddressDto.wardId,
    )

    const address = await this.addressRepository.createAddress(
      createAddressDto,
      coordinates,
      userId,
    )
    if (!address) {
      throw new BadRequestException('Không thể tạo địa chỉ')
    }
    return this.returnAddressResponseDto(address)
  }

  async updateAddress(
    id: string,
    updateAddressDto: UpdateAddressDto,
    userId: string,
  ): Promise<AddressResponseDto> {
    const coordinates = await this.getCoordinatesFromAddress(
      updateAddressDto.fullAddress,
      updateAddressDto.wardId,
    )

    const address = await this.addressRepository.updateAddress(
      id,
      updateAddressDto,
      coordinates,
      userId,
    )
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ')
    }
    return this.returnAddressResponseDto(address)
  }

  async deleteAddress(id: string, userId: string): Promise<boolean> {
    const result = await this.addressRepository.deleteAddress(id, userId)
    if (!result) {
      throw new BadRequestException('Xóa địa chỉ thất bại')
    }
    return result
  }
}
