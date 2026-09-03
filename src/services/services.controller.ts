import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { AuthGuard } from 'node_modules/@nestjs/passport/dist/auth.guard';
import { UserRole } from 'src/users/user-schema';
import { Roles } from 'src/auth/decorators/role.decorator';
import { Service } from './service-schema';
import { CreateServiceDto } from './dtos/creaetServiceDto';
import { UpdateServiceDto } from './dtos/updateServiceDto';
import { GetServicesDto } from './dtos/getServicesDto';

@Controller('services')
export class ServicesController {
  constructor(private serviceService: ServicesService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('admin/createService')
  @Roles(UserRole.ADMIN)
  async createService(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    return await this.serviceService.createService(createServiceDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/getAllServices')
  async getAllServices(
    @Query('page') page: string,
    @Query('limit') limit: string,
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
    return await this.serviceService.getAllServices(page, limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/getServiceById/:id')
  async getServiceById(@Param('id') id: string): Promise<Service> {
    return await this.serviceService.getServiceById(id);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('admin/updateService/:id')
  @Roles(UserRole.ADMIN)
  async updateService(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    {
      return await this.serviceService.updateService(id, updateServiceDto);
    }
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete('admin/DeleteService/:id')
  @Roles(UserRole.ADMIN)
  async deleteService(@Param('id') id: string): Promise<void> {
    {
      return await this.serviceService.deleteService(id);
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('admin/searchServices')
  async searchServices(@Query('search') search: string): Promise<Service[]> {
    {
      return await this.serviceService.searchServices(search);
    }
  }
}
