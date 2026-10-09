import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/user-schema';
import { AppointmentsService } from './../appointments/appointments.service';
import { Appointment } from './appointment-schema';
import { UpdateAppointmentDto } from './dtos/updateAppointmentDto';

@ApiTags('Appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentService: AppointmentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/create-appointment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        patientId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
        slotId: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d2' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Appointment successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'Conflict - Slot already booked' })
  async addAppointmet(
    @Body('patientId') patientId: string,
    @Body('slotId') slotId: string,
    @Request() req: any,
  ): Promise<Appointment | undefined> {
    return this.appointmentService.addAppointmet(patientId, slotId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/cancel-appointment/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an existing appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment cancelled successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancelAppointmet(
    @Param('id') appointmentId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.appointmentService.cancelAppointmet(appointmentId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/get-my-appointments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get appointments for currently logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of user appointments',
  })
  async getMyAppointments(
    @Request() req: any,
  ): Promise<{ appointments: Appointment[]; total: number }> {
    return await this.appointmentService.getMyAppointments(req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('/get-appointments/:slotId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all appointments booked for a specific slot ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of appointments booked for the slot',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid slotId format',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Slot does not exist in collection',
  })
  async getSlotAppointments(
    @Param('slotId') slotId: string,
    @Request() req: any,
  ): Promise<Appointment[]> {
    return await this.appointmentService.getSlotAppointments(slotId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/get-appointment/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get single appointment by ID' })
  @ApiResponse({ status: 200, description: 'Returns appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getAppointmentById(
    @Request() req: any,
    @Param('id') appointmentId: string,
  ): Promise<Appointment> {
    return await this.appointmentService.getAppointmentById(
      req.user,
      appointmentId,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('/get-all-appointments')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all system appointments (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of all appointments',
  })
  async getAllAppointments(): Promise<Appointment[]> {
    return await this.appointmentService.getAllAppointments();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('/update-appointment/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment details (Admin / Doctor)' })
  @ApiResponse({ status: 200, description: 'Appointment updated successfully' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async updateAppointment(
    @Param('id') appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return await this.appointmentService.updateAppointment(
      updateAppointmentDto,
      appointmentId,
    );
  }
}
