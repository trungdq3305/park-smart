// File: src/address/address.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing'
import { AddressService } from './address.service'
import { IAddressRepository } from './interfaces/iaddress.repository'
import { IWardRepository } from '../ward/interfaces/iward.repository'
import { HttpService } from '@nestjs/axios'
import { of } from 'rxjs'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common'
import mongoose from 'mongoose'
import { CreateAddressDto } from './dto/createAddress.dto'
import { Address } from './schemas/address.schema'

const mockAddressRepository = {
  createAddress: jest.fn(),
  findAllAddresses: jest.fn(),
  findAddressById: jest.fn(),
  updateAddress: jest.fn(),
  deleteAddress: jest.fn(),
}

const mockWardRepository = {
  getWardNameById: jest.fn(),
}

const mockHttpService = {
  get: jest.fn(),
}

const mockAddressId = new mongoose.Types.ObjectId().toHexString()
const mockUserId = new mongoose.Types.ObjectId().toHexString()
const mockWardId = new mongoose.Types.ObjectId().toHexString()

const mockAddress: Partial<Address> = {
  _id: mockAddressId as unknown as typeof Address.prototype._id,
  wardId: mockWardId as unknown as typeof Address.prototype.wardId,
  fullAddress: '123 Đường ABC',
  latitude: 10.7769,
  longitude: 106.7009,
}

describe('Dịch vụ Địa chỉ', () => {
  let service: AddressService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: IAddressRepository,
          useValue: mockAddressRepository,
        },
        {
          provide: IWardRepository,
          useValue: mockWardRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile()

    service = module.get<AddressService>(AddressService)
    jest.clearAllMocks()
  })

  it('nên được khởi tạo', () => {
    expect(service).toBeDefined()
  })

  describe('Tạo địa chỉ', () => {
    const createAddressDto: CreateAddressDto = {
      fullAddress: '123 Đường ABC',
      wardId: mockWardId,
    }

    it('nên tạo và trả về địa chỉ thành công', async () => {
      const mockCoordinates = { latitude: 10.7769, longitude: 106.7009 }
      mockWardRepository.getWardNameById.mockResolvedValue('Phường Bến Nghé')
      mockHttpService.get.mockReturnValue(
        of({
          data: [
            {
              lat: mockCoordinates.latitude.toString(),
              lon: mockCoordinates.longitude.toString(),
            },
          ],
        }),
      )
      mockAddressRepository.createAddress.mockResolvedValue(mockAddress)

      const result = await service.createAddress(createAddressDto, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data[0]._id).toEqual(mockAddress._id)
      expect(mockAddressRepository.createAddress).toHaveBeenCalledWith(
        createAddressDto,
        mockCoordinates,
        mockUserId,
      )
    })

    it('nên báo lỗi nếu dịch vụ định vị thất bại', async () => {
      mockWardRepository.getWardNameById.mockResolvedValue('Phường Bến Nghé')
      mockHttpService.get.mockReturnValue(of({ data: [] }))

      await expect(
        service.createAddress(createAddressDto, mockUserId),
      ).rejects.toThrow(
        new HttpException(
          `Không thể tìm thấy địa chỉ: "${createAddressDto.fullAddress}"`,
          HttpStatus.BAD_REQUEST,
        ),
      )
    })
  })

  describe('Lấy tất cả địa chỉ', () => {
    it('nên trả về một mảng địa chỉ', async () => {
      const addressArray = [mockAddress]
      mockAddressRepository.findAllAddresses.mockResolvedValue(addressArray)

      const result = await service.findAllAddresses()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]._id).toEqual(mockAddress._id)
      expect(mockAddressRepository.findAllAddresses).toHaveBeenCalled()
    })

    it('nên báo lỗi nếu không tìm thấy địa chỉ nào', async () => {
      mockAddressRepository.findAllAddresses.mockResolvedValue(null)

      await expect(service.findAllAddresses()).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('Lấy địa chỉ theo ID', () => {
    it('nên trả về địa chỉ nếu tìm thấy', async () => {
      mockAddressRepository.findAddressById.mockResolvedValue(mockAddress)

      const result = await service.findAddressById(mockAddressId)

      expect(result.success).toBe(true)
      expect(result.data[0]._id).toEqual(mockAddress._id)
      expect(mockAddressRepository.findAddressById).toHaveBeenCalledWith(
        mockAddressId,
      )
    })

    it('nên báo lỗi nếu không tìm thấy địa chỉ', async () => {
      mockAddressRepository.findAddressById.mockResolvedValue(null)

      await expect(service.findAddressById(mockAddressId)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('nên báo lỗi BadRequest nếu ID Mongo không hợp lệ', async () => {
      const invalidId = 'invalid-id'

      await expect(service.findAddressById(invalidId)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  describe('Xóa địa chỉ', () => {
    it('nên trả về true khi xóa thành công', async () => {
      mockAddressRepository.deleteAddress.mockResolvedValue(true)

      const result = await service.deleteAddress(mockAddressId, mockUserId)

      expect(result.success).toBe(true)
      expect(result.data[0]).toBe(true)
      expect(mockAddressRepository.deleteAddress).toHaveBeenCalledWith(
        mockAddressId,
        mockUserId,
      )
    })

    it('nên báo lỗi BadRequest nếu xóa thất bại', async () => {
      mockAddressRepository.deleteAddress.mockResolvedValue(false)

      await expect(
        service.deleteAddress(mockAddressId, mockUserId),
      ).rejects.toThrow(new BadRequestException('Xóa địa chỉ thất bại'))
    })
  })
})
