import {
  ConflictException,
  Injectable,
  Logger,
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
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<Service>,
  ) {}

  async createService(createServiceDto: CreateServiceDto): Promise<Service> {
    const oldService = await this.serviceModel.findOne({
      name: createServiceDto.name,
    });
    if (oldService) {
      this.logger.warn(
        `Service creation conflict — name already exists: "${createServiceDto.name}"`,
      );
      throw new ConflictException({ message: 'Service already exists' });
    }
    const service = await this.serviceModel.create(createServiceDto);
    this.logger.log(`Service created: "${service.name}" (id: ${service._id})`);
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
    this.logger.log(
      `Retrieved services: page=${pageInt}, limit=${limitInt}, totalServices=${totalServices}`,
    );

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

  async countActiveServices(): Promise<number> {
    return await this.serviceModel.countDocuments({ isActive: true });
  }

  async getServiceById(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id);
    if (!service) {
      this.logger.warn(`Service not found: id=${id}`);
      throw new NotFoundException('Service not found');
    }
    this.logger.log(`Retrieved service: id=${id}, name="${service.name}"`);
    return service;
  }

  async searchServices(search: string): Promise<Service[]> {
    const service = await this.serviceModel.find({
      name: { $regex: search, $options: 'i' },
    });
    if (!service) {
      this.logger.warn(`Service not found: search=${search}`);
      throw new NotFoundException('Service not found');
    }
    this.logger.log(
      `Retrieved service: search=${search}, count=${service.length}`,
    );
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
      this.logger.warn(`Service not found for update: id=${id}`);
      throw new NotFoundException('Service not found');
    }
    this.logger.log(`Service updated: id=${id}, name="${service.name}"`);
    return service;
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.serviceModel.findById(id);
    if (!service) {
      this.logger.warn(`Service not found for deletion: id=${id}`);
      throw new NotFoundException('Service not found');
    }
    this.logger.log(`Service deleted: id=${id}, name="${service.name}"`);
    service.isActive = false;
    await service.save();
  }
}
