import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto/profile.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  async list(@Req() req: any) {
    const userId = req.user?.id as string;
    return this.profiles.listProfiles(userId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateProfileDto) {
    const userId = req.user?.id as string;
    return this.profiles.createProfile(userId, dto.name, dto.role);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateProfileDto) {
    const userId = req.user?.id as string;
    return this.profiles.updateProfile(userId, id, dto.name, dto.role);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id as string;
    return this.profiles.deleteProfile(userId, id);
  }
}

