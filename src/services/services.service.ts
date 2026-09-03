import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Service } from './service-schema';
import { CreateServiceDto } from './dtos/creaetServiceDto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateServiceDto } from './dtos/updateServiceDto';
import { GetServicesDto } from './dtos/getServicesDto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<Service>,
  ) {}

  async createService(createServiceDto: CreateServiceDto): Promise<Service> {
    const oldService = await this.serviceModel.findOne({
      name: createServiceDto.name,
    });
    if (oldService) {
      throw new ConflictException({ message: 'Service already exists' });
    }
    const service = await this.serviceModel.create(createServiceDto);
    return service;
  }
  async getAllServices(
    page: string,
    limit: string,
  ): Promise<{
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      totalServices: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 10;
    const skip = (pageInt - 1) * limitInt;
    const services = await this.serviceModel
      .find({
        isActive: true,
      })
      .skip(skip)
      .limit(limitInt);
    const totalServices = await this.serviceModel.countDocuments({
      isActive: true,
    });
    const hasNextPage = skip + services.length < totalServices;
    const hasPreviousPage = pageInt > 1;
    return {
      services,
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalServices,
        hasPreviousPage,
        hasNextPage,
      },
    };
  }
  async getServiceById(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
  async searchServices(search: string): Promise<Service[]> {
    const service = await this.serviceModel.find({
      name: { $regex: search, $options: 'i' },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
  async updateService(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.serviceModel.findByIdAndUpdate(
      id,
      updateServiceDto,
      { new: true, runValidators: true },
    );
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }
  async deleteService(id: string): Promise<void> {
    const service = await this.serviceModel.findById(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    service.isActive = false;
    await service.save();
  }
}
