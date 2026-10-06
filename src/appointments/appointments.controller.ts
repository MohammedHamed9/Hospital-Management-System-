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
  async addAppointmet(
    @Body('patientId') patientId: string,
    @Body('slotId') slotId: string,
    @Request() req: any,
  ): Promise<Appointment | undefined> {
    return this.appointmentService.addAppointmet(patientId, slotId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/cancel-appointment/:id')
  async cancelAppointmet(
    @Param('id') appointmentId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.appointmentService.cancelAppointmet(appointmentId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/get-my-appointments')
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
  async getAllAppointments(): Promise<Appointment[]> {
    return await this.appointmentService.getAllAppointments();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('/update-appointment/:id')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
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
