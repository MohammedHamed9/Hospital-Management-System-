import { AuthGuard } from '@nestjs/passport';
import { SlotsService } from './slots.service';
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
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/users/user-schema';
import { Slot } from './slot-schema';
import { CreateSlotDto } from './dtos/createSlotDto';
import { RolesGuard } from 'src/auth/guards/role.guard';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post('/add-slot')
  @Roles(UserRole.DOCTOR)
  async addSlot(
    @Body() createSlotDto: CreateSlotDto,
    @Request() req,
  ): Promise<Slot> {
    return this.slotsService.addSlot(createSlotDto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('/update-slot/:id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async updateSlot(
    @Body() createSlotDto: CreateSlotDto,
    @Request() req,
    @Param('id') slotId: string,
  ): Promise<Slot> {
    return this.slotsService.updateSlot(createSlotDto, req.user, slotId);
  }

  @Get('/get-slot/:id')
  async getSlot(@Param('id') slotId: string): Promise<Slot> {
    return this.slotsService.getSlot(slotId);
  }
  @Get('/get-ALL-doctor-slots/:id')
  async getDoctorSlots(@Param('id') doctorId: string): Promise<Slot[]> {
    return this.slotsService.getDoctorSlots(doctorId);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Patch('/cancel-slot/:id')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async cancelSlot(@Param('id') slotId: string, @Request() req): Promise<Slot> {
    return this.slotsService.cancelSlot(slotId, req.user);
  }
}
