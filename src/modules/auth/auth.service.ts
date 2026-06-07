import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleCode } from '../../generated/prisma/enums';
import { prisma } from '../../prisma/prisma.service';
import { RegisterCompanyDto } from '../dto/register-company.dto';
import { JwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async registerCompany(registerDto: RegisterCompanyDto) {
    const {
      companyName,
      companyCode,
      subdomain,
      firstName,
      lastName,
      email,
      password,
    } = registerDto;

    // Validate subdomain format
    const normalizedSubdomain = subdomain.trim().toLowerCase();
    const subdomainRegex = /^[a-z0-9-]{3,30}$/;

    if (!subdomainRegex.test(normalizedSubdomain)) {
      throw new BadRequestException(
        'Subdomain must be 3-30 characters and contain only lowercase letters, numbers, and hyphens',
      );
    }

    // Check for existing company
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [{ name: companyCode }, { subdomain: normalizedSubdomain }],
      },
    });

    if (existingCompany) {
      throw new ConflictException('Company code or subdomain already exists');
    }

    // Check for existing user with same email
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Start transaction
    return prisma.$transaction(async (tx) => {
      // Find COMPANY_ADMIN role by code
      let adminRole = await tx.role.findUnique({
        where: {
          name: RoleCode.COMPANY_ADMIN,
        },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: 'COMPANY_ADMIN',
          },
        });
      }

      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          code: companyCode,
          subdomain: normalizedSubdomain,
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
        },
      });

      // Create admin user
      const adminUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          companyId: company.id,
          isActive: true,
          userType: 'TENANT',
        },
      });

      // Assign COMPANY_ADMIN role to user
      await tx.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      });

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken({
        userId: adminUser.id,
        email: adminUser.email,
        companyId: company.id,
        tenant: company.subdomain,
        roles: ['COMPANY_ADMIN'],
        role: 'COMPANY_ADMIN',
      });

      const refreshToken = this.jwtService.generateRefreshToken({
        userId: adminUser.id,
        companyId: company.id,
      });

      // Hash refresh token before storing
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Store refresh token
      await tx.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          userId: adminUser.id,
          expiresAt,
        },
      });

      // Create audit log
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
            adminUserId: adminUser.id,
            adminEmail: adminUser.email,
          },
        },
      });

      // Generate login URL based on environment
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
          user: {
            id: adminUser.id,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            email: adminUser.email,
          },
          accessToken,
          refreshToken,
        },
      };
    });
  }
}
