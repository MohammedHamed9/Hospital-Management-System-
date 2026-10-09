import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreatePrescriptionDto } from './dtos/create-prescription.dto';
import { PrescriptionFilterDto } from './dtos/prescription-filter.dto';
import { UpdatePrescriptionDto } from './dtos/update-prescription.dto';
import { PrescriptionService } from './prescriptions.service';

@ApiTags('Prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  private getUserId(req: any): string {
    return req.user?.id || req.user?._id?.toString() || req.user?._id;
  }

  @Post()
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create draft prescription for patient' })
  @ApiResponse({
    status: 201,
    description: 'Prescription created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 404, description: 'Appointment or patient not found' })
  async createPrescription(
    @Body() createDto: CreatePrescriptionDto,
    @Request() req: any,
  ) {
    const doctorId = this.getUserId(req);
    return await this.prescriptionService.createPrescription(
      createDto,
      doctorId,
      req.user,
    );
  }

  @Get('doctor/:id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get prescriptions issued by specific doctor' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated doctor prescriptions',
  })
  async getDoctorPrescriptions(
    @Query() filterDto: PrescriptionFilterDto,
    @Param('id') doctorId: string,
    @Request() req: any,
  ) {
    return await this.prescriptionService.getDoctorPrescriptions(
      doctorId,
      req.user,
      filterDto,
    );
  }

  @Get('')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @ApiOperation({
    summary: 'Get prescriptions based on user role and query filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns filtered list of prescriptions',
  })
  async getPrescriptions(
    @Query() filterDto: PrescriptionFilterDto,
    @Request() req: any,
  ) {
    return await this.prescriptionService.getPrescriptions(filterDto, req.user);
  }

  @Get(':id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT)
  @ApiOperation({ summary: 'Get single prescription by ID' })
  @ApiResponse({ status: 200, description: 'Returns prescription details' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  async getPrescriptionById(@Param('id') id: string, @Request() req: any) {
    return await this.prescriptionService.getPrescriptionById(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update draft prescription details' })
  @ApiResponse({
    status: 200,
    description: 'Prescription updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update finalized prescription',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updatePrescription(
    @Param('id') id: string,
    @Body() updateDto: UpdatePrescriptionDto,
    @Request() req: any,
  ) {
    const doctorId = this.getUserId(req);
    return await this.prescriptionService.updatePrescription(
      id,
      updateDto,
      doctorId,
    );
  }

  @Patch(':id/finalize')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({
    summary: 'Finalize prescription and mark appointment completed',
  })
  @ApiResponse({
    status: 200,
    description: 'Prescription finalized successfully',
  })
  @ApiResponse({ status: 400, description: 'Already finalized or no items' })
  async finalizePrescription(@Param('id') id: string, @Request() req: any) {
    return await this.prescriptionService.finalizePrescription(id, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete draft prescription' })
  @ApiResponse({
    status: 200,
    description: 'Prescription deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete finalized prescription',
  })
  async deletePrescription(@Param('id') id: string, @Request() req: any) {
    const doctorId = this.getUserId(req);
    return await this.prescriptionService.deletePrescription(id, doctorId);
  }
}
