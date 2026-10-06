import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/user-schema';
import { CreateServicesBookingDto } from './dtos/create-services-booking.dto';
import { ServicesBookingFilterDto } from './dtos/services-booking-filter.dto';
import { UpdateServicesBookingStatusDto } from './dtos/update-services-booking-status.dto';
import { ServicesBookingService } from './services-booking.service';

@ApiTags('Services Booking')
@Controller('services-booking')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesBookingController {
  constructor(
    private readonly servicesBookingService: ServicesBookingService,
  ) {}

  private getUserId(req: any): string {
    return req.user?.id || req.user?._id?.toString() || req.user?._id;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new service booking' })
  @ApiResponse({
    status: 201,
    description: 'Service booking successfully created',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid serviceId' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Service does not exist',
  })
  async createBooking(
    @Request() req: any,
    @Body() createDto: CreateServicesBookingDto,
  ) {
    const userId = this.getUserId(req);
    return await this.servicesBookingService.createBooking(userId, createDto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all service bookings (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of bookings',
  })
  async findAllBookings(@Query() filterDto: ServicesBookingFilterDto) {
    return await this.servicesBookingService.findAllBookings(filterDto);
  }

  @Get('my-bookings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all bookings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns list of user bookings' })
  async findUserBookings(@Request() req: any) {
    const userId = this.getUserId(req);
    return await this.servicesBookingService.findUserBookings(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific booking by ID' })
  @ApiResponse({ status: 200, description: 'Returns booking details' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid bookingId' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized' })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Booking does not exist',
  })
  async findBookingById(@Param('id') id: string, @Request() req: any) {
    return await this.servicesBookingService.findBookingById(id, req.user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update booking status (Admin / Doctor)' })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid status transition',
  })
  async updateBookingStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateServicesBookingStatusDto,
  ) {
    return await this.servicesBookingService.updateBookingStatus(id, updateDto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel a completed booking',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized' })
  async cancelBooking(@Param('id') id: string, @Request() req: any) {
    const userId =
      req.user.role === UserRole.ADMIN ? undefined : this.getUserId(req);
    return await this.servicesBookingService.cancelBooking(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking (DELETE alias)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  async deleteBooking(@Param('id') id: string, @Request() req: any) {
    const userId =
      req.user.role === UserRole.ADMIN ? undefined : this.getUserId(req);
    return await this.servicesBookingService.cancelBooking(id, userId);
  }
}
