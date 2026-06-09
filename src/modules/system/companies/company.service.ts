import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../../prisma/prisma.service';
import { RegisterCompanyDto } from './dto/types';

import {UserType } from '../../../generated/prisma/enums';
import { Prisma } from '../../../generated/prisma/client';
import { Role } from '../../../common/constants';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerCompany(dto: RegisterCompanyDto) {
    const {
      companyName,
      companyCode,
      subdomain,
      firstName,
      lastName,
      email,
      password,
    } = dto;

    const normalizedSubdomain = subdomain.trim().toLowerCase();

    if (!/^[a-z0-9-]{3,30}$/.test(normalizedSubdomain)) {
      throw new BadRequestException('Invalid subdomain format');
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: {
        OR: [{ name: companyCode }, { subdomain: normalizedSubdomain }],
      },
    });

    if (existingCompany) {
      throw new ConflictException('Company code or subdomain already exists');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    return this.prisma.$transaction(async (tx) => {
      const adminRole = await tx.role.findUnique({
        where: {
          name: Role.COMPANY_ADMIN,
        },
      });

      if (!adminRole) {
        throw new InternalServerErrorException('COMPANY_ADMIN role not found');
      }

      const company = await tx.company.create({
        data: {
          name: companyName,
          code: companyCode,
          subdomain: normalizedSubdomain,
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          companyId: company.id,
          userType: UserType.TENANT,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      const payload = {
        sub: adminUser.id,
        email: adminUser.email,
        companyId: company.id,
        tenant: company.subdomain,
        roles: [Role.COMPANY_ADMIN],
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '1d',
      });

      const refreshToken = await this.jwtService.signAsync(
        {
          sub: adminUser.id,
          companyId: company.id,
        },
        {
          expiresIn: '7d',
        },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await tx.refreshToken.create({
        data: {
          token: await bcrypt.hash(refreshToken, 10),
          userId: adminUser.id,
          expiresAt,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'COMPANY_REGISTERED',
          entityType: 'Company',
          entityId: company.id,
          newData: {
            companyId: company.id,
            companyName: company.name,
            companyCode: company.code,
            subdomain: company.subdomain,
            adminEmail: adminUser.email,
          },
        },
      });

      const loginUrl =
        process.env.NODE_ENV === 'production'
          ? `https://${company.subdomain}.pmsship.com`
          : `http://${company.subdomain}.localhost:3000`;

      return {
        success: true,
        message: 'Company registered successfully',
        data: {
          company: {
            id: company.id,
            name: company.name,
            code: company.code,
            subdomain: company.subdomain,
            loginUrl,
          },
          adminUser: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
          },
          accessToken,
          refreshToken,
        },
      };
    });
  }

  async getCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const { page = 1, limit = 10, search } = params;

    const skip = (page - 1) * limit;

    const adminRole = await this.prisma.role.findUnique({
      where: {
        name: Role.COMPANY_ADMIN,
      },
    });

    if (!adminRole) {
      throw new NotFoundException('COMPANY_ADMIN role not found');
    }

    const where: Prisma.CompanyWhereInput = {
      isActive: true,
    };

    if (search?.trim()) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          code: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          subdomain: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          users: {
            some: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,

        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          name: true,
          code: true,
          subdomain: true,

          email: true,
          phone: true,
          address: true,

          isActive: true,

          createdAt: true,
          updatedAt: true,

          users: {
            where: {
              userRoles: {
                some: {
                  roleId: adminRole.id,
                },
              },
            },

            take: 1,

            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true,
            },
          },

          _count: {
            select: {
              users: true,
              vessels: true,
            },
          },
        },
      }),

      this.prisma.company.count({
        where,
      }),
    ]);

    return {
      success: true,

      data: companies.map((company) => ({
        id: company.id,
        name: company.name,
        code: company.code,

        subdomain: company.subdomain,

        email: company.email,
        phone: company.phone,
        address: company.address,

        isActive: company.isActive,

        companyAdmin: company.users.length > 0 ? company.users[0] : null,

        statistics: {
          totalUsers: company._count.users,
          totalVessels: company._count.vessels,
        },

        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),

        hasNextPage: page < Math.ceil(total / limit),

        hasPreviousPage: page > 1,
      },
    };
  }
}
