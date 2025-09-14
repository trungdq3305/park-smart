import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  Inject,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'
import { IAddressService } from './interfaces/iaddress.service'
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponseDto,
} from './dto/address.dto'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { IdDto } from 'src/common/dto/params.dto'

@ApiTags('address')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
  constructor(
    @Inject(IAddressService)
    private readonly addressService: IAddressService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo một địa chỉ mới' })
  async create(
    @Body() createAddressDto: CreateAddressDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const address = await this.addressService.createAddress(
      createAddressDto,
      userId,
    )
    return {
      data: [address],
      message: 'Tạo địa chỉ thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả địa chỉ' })
  async findAll(): Promise<ApiResponseDto<AddressResponseDto[]>> {
    // Giả sử bạn có hàm findAllAddressesByUserId trong service
    const addresses = await this.addressService.findAllAddresses()
    return {
      data: [addresses],
      message: 'Lấy danh sách địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tìm một địa chỉ theo ID' })
  @ApiParam({ name: 'id', description: 'ID của địa chỉ cần tìm' })
  async findById(
    @Param() params: IdDto,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const address = await this.addressService.findAddressById(params.id)
    return {
      data: [address],
      message: 'Tìm địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật một địa chỉ theo ID' })
  async update(
    @Param() params: IdDto,
    @Body() updateAddressDto: UpdateAddressDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<AddressResponseDto>> {
    const updatedAddress = await this.addressService.updateAddress(
      params.id,
      updateAddressDto,
      userId,
    )
    return {
      data: [updatedAddress],
      message: 'Cập nhật địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa một địa chỉ theo ID' })
  async delete(
    @Param() params: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.addressService.deleteAddress(params.id, userId)
    return {
      data: [result],
      message: 'Xóa địa chỉ thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
