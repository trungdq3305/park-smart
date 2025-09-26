import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto'
import { IVehicleRepository } from './interfaces/ivehicle.repository'
import { Vehicle } from './schemas/vehicle.schema'

@Injectable()
export class VehicleRepository implements IVehicleRepository {
  constructor(
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<Vehicle>,
  ) {}

  async createVehicle(
    vehicle: CreateVehicleDto,
    userId: string,
    driverId: string,
  ): Promise<Vehicle> {
    const newVehicle = new this.vehicleModel({
      ...vehicle,
      driverId: driverId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: null,
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    })
    return newVehicle.save()
  }

  async createVehicleIfDeleted(
    vehicle: CreateVehicleDto,
    userId: string,
    driverId: string,
  ): Promise<Vehicle | null> {
    const restoredVehicle = await this.vehicleModel
      .findOneAndUpdate(
        { plateNumber: vehicle.plateNumber, deletedAt: { $ne: null } },
        {
          $set: {
            ...vehicle,
            driverId: driverId,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: null,
            updatedBy: null,
            deletedAt: null,
            deletedBy: null,
          },
        },
        { new: true },
      )
      .populate('colorId', 'colorName _id')
      .populate('vehicleTypeId', 'typeName _id')
      .populate('brandId', 'brandName _id')
      .lean()
      .exec()
    return restoredVehicle
  }

  async findAllVehicles(
    driverId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: Vehicle[]; total: number }> {
    const conditions = { deletedAt: null, driverId: driverId }
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.vehicleModel
        .find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('colorId', 'colorName _id')
        .populate('vehicleTypeId', 'typeName _id')
        .populate('brandId', 'brandName _id')
        .lean()
        .exec(),
      this.vehicleModel.countDocuments(conditions),
    ])
    return { data, total }
  }

  async adminFindAllVehicles(
    page: number,
    pageSize: number,
  ): Promise<{ data: Vehicle[]; total: number }> {
    const conditions = { deletedAt: null }
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      this.vehicleModel
        .find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('colorId', 'colorName _id')
        .populate('vehicleTypeId', 'typeName _id')
        .populate('brandId', 'brandName _id')
        .lean()
        .exec(),
      this.vehicleModel.countDocuments(conditions),
    ])

    return { data, total }
  }

  async findVehicleById(id: string): Promise<Vehicle | null> {
    return this.vehicleModel
      .findOne({ _id: id })
      .populate('colorId', 'colorName _id')
      .populate('vehicleTypeId', 'typeName _id')
      .populate('brandId', 'brandName _id')
      .lean()
      .exec()
  }

  async findVehicleByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    const data = await this.vehicleModel
      .findOne({ plateNumber: plateNumber })
      .populate('colorId', 'colorName _id')
      .populate('vehicleTypeId', 'typeName _id')
      .populate('brandId', 'brandName _id')
      .lean()
      .exec()
    return data
  }

  async deleteVehicle(id: string, userId: string): Promise<boolean> {
    const result = await this.vehicleModel.updateOne(
      { _id: id, deletedAt: null },
      { deletedAt: new Date(), deletedBy: userId },
    )
    return result.modifiedCount > 0
  }

  async restoreVehicle(id: string, userId: string): Promise<boolean> {
    const result = await this.vehicleModel.updateOne(
      { _id: id, deletedAt: { $ne: null }, createdBy: userId },
      { deletedAt: null, deletedBy: null },
    )
    return result.modifiedCount > 0
  }

  async updateVehicle(
    id: string,
    vehicle: UpdateVehicleDto,
    userId: string,
  ): Promise<boolean> {
    const updatedVehicle = await this.vehicleModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null, createdBy: userId },
        { $set: { ...vehicle, updatedAt: new Date(), updatedBy: userId } },
        { new: true },
      )
      .lean()
      .exec()
    return !!updatedVehicle
  }

  async findAllDeletedVehicles(
    page: number,
    pageSize: number,
    driverId: string,
  ): Promise<{ data: Vehicle[]; total: number }> {
    const conditions = { deletedAt: { $ne: null }, driverId: driverId }
    const skip = (page - 1) * pageSize
    const [data, total] = await Promise.all([
      this.vehicleModel
        .find(conditions)
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('colorId', 'colorName _id')
        .populate('vehicleTypeId', 'typeName _id')
        .populate('brandId', 'brandName _id')
        .lean()
        .exec(),
      this.vehicleModel.countDocuments(conditions),
    ])
    return { data, total }
  }
}
