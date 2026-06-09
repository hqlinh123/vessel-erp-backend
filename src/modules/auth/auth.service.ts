import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Role } from '../../common/constants';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto, tenant?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        isActive: true,
      },
      include: {
        company: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = user.userRoles.map((item) => item.role.name);

    const isSystemUser =
      roles?.includes(Role.SYSTEM_SUPER_ADMIN) ||
      roles?.includes(Role.SYSTEM_SUPPORT);

    /**
     * admin.pmsship.com
     */
    if (tenant === 'admin') {
      if (!isSystemUser) {
        throw new ForbiddenException('Only system users can login here');
      }
    }

    /**
     * tenant portals
     */
    if (tenant !== 'admin') {
      if (isSystemUser) {
        throw new ForbiddenException(
          'System users cannot login to tenant portal',
        );
      }

      console.log('subdomain', user.company.subdomain);
      console.log('tenant', tenant);

      if (user.company?.subdomain !== tenant) {
        throw new ForbiddenException('Wrong company portal');
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      tenant: user.company?.subdomain ?? null,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
      },
      {
        expiresIn: '7d',
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      success: true,
      message: 'Login successful',

      data: {
        accessToken,
        refreshToken,

        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
        },

        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
              subdomain: user.company.subdomain,
            }
          : null,
      },
    };
  }
}
