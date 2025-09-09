import { HttpService } from '@nestjs/axios'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { IAddressRepository } from './interfaces/iaddress.repository'
import { IAddressService } from './interfaces/iaddress.service'
import { IWardRepository } from '../ward/interfaces/iward.repository'
import { CreateAddressDto } from './dto/createAddress.dto'
import { UpdateAddressDto } from './dto/updateAddress.dto'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { isMongoId } from 'class-validator'
import { AddressResponseDto } from './dto/addressResponse.dto'
// Định nghĩa type ở đây hoặc import từ file khác
interface NominatimLocation {
  lat: string
  lon: string
  display_name: string
  place_id: number
}
type NominatimResponse = NominatimLocation[]

@Injectable()
export class AddressService implements IAddressService {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepository: IAddressRepository,
    @Inject(IWardRepository)
    private readonly wardRepository: IWardRepository,
    private readonly httpService: HttpService,
  ) {}

  cityName = 'Thành phố Hồ Chí Minh'

  private async getCoordinatesFromAddress(
    address: string,
    wardId: string,
  ): Promise<{ latitude: number; longitude: number }> {
    const wardName = await this.wardRepository.getWardNameById(wardId)
    const fullAddress = this.cityName + ' ' + wardName + ' ' + address
    const encodedAddress = encodeURIComponent(fullAddress)
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodedAddress}`

    try {
      const response = await firstValueFrom(
        this.httpService.get<NominatimResponse>(url, {
          // <-- Thêm kiểu dữ liệu ở đây
          headers: {
            'User-Agent': 'NestJS-GeoCoding-App/1.0 (contact@example.com)',
          },
        }),
      )

      if (
        !response ||
        typeof response !== 'object' ||
        response === null ||
        !('data' in response)
      ) {
        throw new HttpException(
          'Không nhận được dữ liệu hợp lệ từ dịch vụ định vị.',
          HttpStatus.SERVICE_UNAVAILABLE,
        )
      }
      const locations = (response as { data: NominatimResponse }).data // <-- Đã sửa ở đây

      // Kiểm tra kết quả
      if (!locations || locations.length === 0) {
        // <-- Sửa ở đây
        throw new HttpException(
          `Không thể tìm thấy địa chỉ: "${address}"`,
          HttpStatus.BAD_REQUEST,
        )
      }

      // Lấy kết quả đầu tiên
      const { lat, lon } = locations[0] // <-- Sửa ở đây
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lon)

      return { latitude, longitude }
    } catch (error) {
      if (error instanceof HttpException) throw error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('Lỗi khi gọi OpenStreetMap Nominatim API:', error.message)
      throw new HttpException(
        'Lỗi từ dịch vụ định vị OpenStreetMap.',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
  }

  async findAllAddresses(): Promise<ApiResponseDto<AddressResponseDto>> {
    const addresses = await this.addressRepository.findAllAddresses()
    if (!addresses) {
      throw new NotFoundException('Không tìm thấy địa chỉ nào')
    }
    return {
      data: addresses.map((address) => new AddressResponseDto(address)),
      message: 'Tìm thấy địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  async findAddressById(
    id: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const address = await this.addressRepository.findAddressById(id)
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ')
    }
    return {
      data: [new AddressResponseDto(address)],
      statusCode: HttpStatus.OK,
      message: 'Tìm thấy địa chỉ thành công',
      success: true,
    }
  }

  async createAddress(
    createAddressDto: CreateAddressDto,
    userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const coordinates = await this.getCoordinatesFromAddress(
      createAddressDto.fullAddress,
      createAddressDto.wardId,
    )
    if (!coordinates) {
      throw new NotFoundException('Địa chỉ không tồn tại')
    }

    const address = await this.addressRepository.createAddress(
      createAddressDto,
      coordinates,
      userId,
    )

    if (!address) {
      throw new BadRequestException('Không thể tạo địa chỉ')
    }
    return {
      data: [new AddressResponseDto(address)],
      message: 'Address created successfully',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  async updateAddress(
    id: string,
    updateAddressDto: UpdateAddressDto,
    userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }

    const coordinates = await this.getCoordinatesFromAddress(
      updateAddressDto.fullAddress,
      updateAddressDto.wardId,
    )

    if (!coordinates) {
      throw new NotFoundException('Địa chỉ không tồn tại')
    }

    const address = await this.addressRepository.updateAddress(
      id,
      updateAddressDto,
      coordinates,
      userId,
    )
    if (!address) {
      throw new NotFoundException('Không tìm thấy địa chỉ')
    }
    return {
      data: [new AddressResponseDto(address)],
      message: 'Cập nhật địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  async deleteAddress(
    id: string,
    userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    if (!isMongoId(id)) {
      throw new BadRequestException('ID không hợp lệ')
    }
    const result = await this.addressRepository.deleteAddress(id, userId)

    if (!result) {
      throw new BadRequestException('Xóa địa chỉ thất bại')
    }

    return {
      data: [result],
      message: 'Xóa địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
