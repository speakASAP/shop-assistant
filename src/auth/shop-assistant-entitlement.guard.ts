import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_APP_ROLES = new Set([
  'global:superadmin',
  'app:shop-assistant:admin',
  'app:shop-assistant:user',
]);

@Injectable()
export class ShopAssistantEntitlementGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = typeof user?.id === 'string' ? user.id : '';
    if (!userId) {
      throw new ForbiddenException('Shop Assistant access requires an authenticated user');
    }

    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
    if (roles.some((role) => ALLOWED_APP_ROLES.has(role))) {
      return true;
    }

    try {
      const now = new Date();
      const entitlement = await this.prisma.userEntitlement.findFirst({
        where: {
          userId,
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { id: true },
      });
      if (entitlement) {
        return true;
      }
    } catch {
      throw new ForbiddenException('Shop Assistant entitlement check failed');
    }

    throw new ForbiddenException('Shop Assistant access requires an active entitlement or app role');
  }
}
