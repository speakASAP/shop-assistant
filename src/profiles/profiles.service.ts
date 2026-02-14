import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  async listProfiles(userId: string) {
    this.logging.debug('List profiles request', { userId, context: 'ProfilesService' });
    const items = await this.prisma.accountProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    this.logging.info('Profiles listed', { userId, count: items.length, context: 'ProfilesService' });
    return { items };
  }

  async createProfile(userId: string, name: string, role?: string) {
    this.logging.debug('Create profile request', { userId, hasRole: !!role, context: 'ProfilesService' });
    const profile = await this.prisma.accountProfile.create({
      data: {
        userId,
        name,
        role: role || null,
      },
    });
    this.logging.info('Profile created', { userId, profileId: profile.id, context: 'ProfilesService' });
    return profile;
  }

  async updateProfile(userId: string, id: string, name?: string, role?: string) {
    this.logging.debug('Update profile request', { userId, profileId: id, context: 'ProfilesService' });
    const existing = await this.prisma.accountProfile.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      this.logging.warn('Profile not found for update', { userId, profileId: id, context: 'ProfilesService' });
      throw new NotFoundException('Profile not found');
    }
    const profile = await this.prisma.accountProfile.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        role: typeof role === 'undefined' ? existing.role : role || null,
      },
    });
    this.logging.info('Profile updated', { userId, profileId: id, context: 'ProfilesService' });
    return profile;
  }

  async deleteProfile(userId: string, id: string) {
    this.logging.debug('Delete profile request', { userId, profileId: id, context: 'ProfilesService' });
    const existing = await this.prisma.accountProfile.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      this.logging.warn('Profile not found for delete', { userId, profileId: id, context: 'ProfilesService' });
      throw new NotFoundException('Profile not found');
    }
    await this.prisma.accountProfile.delete({ where: { id } });
    this.logging.info('Profile deleted', { userId, profileId: id, context: 'ProfilesService' });
    return { success: true };
  }
}

