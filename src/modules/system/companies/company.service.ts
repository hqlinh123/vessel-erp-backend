import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../../prisma/prisma.service';
import { InviteUserDto, RegisterCompanyDto, UpdateCompanyDto } from './dto/types';

import { Role } from '../../../common/constants';
import { Prisma } from '../../../generated/prisma/client';
import { InviteStatus, UserType } from '../../../generated/prisma/enums';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
     private readonly jwtService: JwtService,
  ) { }

  async registerCompany(dto: RegisterCompanyDto) {
    const {
      companyName,
      companyCode,
      subdomain,
      firstName,
      lastName,
      email,
      adminPassword,
      adminEmail,
      address,
      phone,
    } = dto;

    const normalizedSubdomain = subdomain.trim().toLowerCase();
    const normalizedCompanyCode = companyCode.trim().toUpperCase();
    if (!/^[a-z0-9-]{3,30}$/.test(normalizedSubdomain)) {
      // throw new BadRequestException('Invalid subdomain format');
      return {
        success: false,
        message: 'Invalid subdomain format',
        data: null
      };
    }

    const existingCompany = await this.prisma.company.findFirst({
      where: {
        OR: [{ name: normalizedCompanyCode }, { subdomain: normalizedSubdomain }],
      },
    });

    if (existingCompany) {
      // throw new ConflictException('Company code or subdomain already exists');
      return {
        success: false,
        message: 'Company code or subdomain already exists',
        data: null
      };
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: adminEmail.toLowerCase(),
      },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'Email already registered',
        data: null
      };
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    return this.prisma.$transaction(async (tx) => {
      const adminRole = await tx.role.findUnique({
        where: {
          name: Role.COMPANY_ADMIN,
        },
      });

      if (!adminRole) {
        // throw new InternalServerErrorException('COMPANY_ADMIN role not found');
        return {
          success: false,
          message: 'COMPANY_ADMIN role not found',
          data: null
        };
      }

      const company = await tx.company.create({
        data: {
          name: companyName,
          code: normalizedCompanyCode,
          subdomain: normalizedSubdomain,
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
          phone,
          address,
          email
        },
      });

      const adminUser = await tx.user.create({
        data: {
          email: adminEmail.toLowerCase(),
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

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);


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
      // throw new NotFoundException('COMPANY_ADMIN role not found');
      return {
        success: false,
        message: 'COMPANY_ADMIN role not found',
        data: null
      };
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

    const isTempCompany = companies.some((com)=> com.subdomain === "admin")
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
      })).filter((com) => com.subdomain !== "admin"),

      meta: {
        page,
        limit,
        total : !isTempCompany ? total : 0,
        totalPages: !isTempCompany ? Math.ceil(total / limit) : 0,
        hasNextPage: !isTempCompany ? page < Math.ceil(total / limit) : 0,
        hasPreviousPage: !isTempCompany ? page > 1: null,
      },
    };
  }

  async getCompanyById(companyId: string) {
    const adminRole = await this.prisma.role.findUnique({
      where: {
        name: Role.COMPANY_ADMIN,
      },
    });

    if (!adminRole) {
      throw new NotFoundException('COMPANY_ADMIN role not found');
    }

    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
        isActive: true,
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
    });

    if (!company) {
      // throw new NotFoundException('Company not found');
      return {
        success: false,
        message: 'Company not found',
        data: null
      };
    }

    return {
      success: true,
      data: {
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
      },
    };
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    const { name, code, subdomain, email, phone, address, isActive } = dto;

    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      // throw new NotFoundException('Company not found');
      return {
        success: false,
        message: 'Company not found',
        data: null
      };
    }

    // Check for duplicate code or subdomain if they're being updated
    if (code || subdomain) {
      const duplicateCompany = await this.prisma.company.findFirst({
        where: {
          OR: [
            ...(code ? [{ code }] : []),
            ...(subdomain ? [{ subdomain: subdomain.toLowerCase() }] : []),
          ],
          NOT: { id: companyId },
        },
      });

      if (duplicateCompany) {
        // throw new ConflictException('Company code or subdomain already exists');
        return {
          success: false,
          message: 'Company code or subdomain already exists',
          data: null
        };
      }
    }

    // Validate subdomain format if provided
    if (subdomain) {
      const normalizedSubdomain = subdomain.trim().toLowerCase();
      if (!/^[a-z0-9-]{3,30}$/.test(normalizedSubdomain)) {
        // throw new BadRequestException('Invalid subdomain format');
        return {
          success: false,
          message: 'Invalid subdomain format',
          data: null
        };
      }
    }

    // Update company
    const updatedCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(subdomain && { subdomain: subdomain.trim().toLowerCase() }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
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
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'COMPANY_UPDATED',
        entityType: 'Company',
        entityId: companyId,
        newData: {
          ...dto,
          changes: {
            ...(name && { name: { from: existingCompany.name, to: name } }),
            ...(code && { code: { from: existingCompany.code, to: code } }),
            ...(subdomain && {
              subdomain: { from: existingCompany.subdomain, to: subdomain },
            }),
          },
        },
      },
    });

    return {
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany,
    };
  }

  async deleteCompany(companyId: string, softDelete: boolean = true) {
    // Check if company exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            vessels: true,
          },
        },
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Company not found');
    }

    if (softDelete) {
      // Soft delete - just mark as inactive
      const updatedCompany = await this.prisma.company.update({
        where: { id: companyId },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      });

      // Also soft delete all users in this company
      await this.prisma.user.updateMany({
        where: { companyId },
        data: { isActive: false },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'COMPANY_DEACTIVATED',
          entityType: 'Company',
          entityId: companyId,
          newData: {
            companyName: existingCompany.name,
            companyCode: existingCompany.code,
            totalUsers: existingCompany._count.users,
            totalVessels: existingCompany._count.vessels,
            deactivatedAt: new Date(),
          },
        },
      });

      return {
        success: true,
        message: 'Company deactivated successfully',
        data: updatedCompany,
      };
    } else {
      // Hard delete - check for dependencies
      if (existingCompany._count.users > 0 || existingCompany._count.vessels > 0) {
        throw new BadRequestException(
          `Cannot delete company with ${existingCompany._count.users} users and ${existingCompany._count.vessels} vessels. Please delete or reassign them first.`,
        );
      }

      // Hard delete the company
      await this.prisma.company.delete({
        where: { id: companyId },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'COMPANY_DELETED',
          entityType: 'Company',
          entityId: companyId,
          newData: {
            companyName: existingCompany.name,
            companyCode: existingCompany.code,
            deletedAt: new Date(),
          },
        },
      });

      return {
        success: true,
        message: 'Company permanently deleted successfully',
      };
    }
  }

  async restoreCompany(companyId: string) {
    // Check if company exists and is inactive
    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      throw new NotFoundException('Company not found');
    }

    if (existingCompany.isActive) {
      throw new BadRequestException('Company is already active');
    }

    // Restore company
    const restoredCompany = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        subdomain: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Restore all users in this company
    await this.prisma.user.updateMany({
      where: { companyId },
      data: { isActive: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'COMPANY_RESTORED',
        entityType: 'Company',
        entityId: companyId,
        newData: {
          companyName: existingCompany.name,
          companyCode: existingCompany.code,
          restoredAt: new Date(),
        },
      },
    });

    return {
      success: true,
      message: 'Company restored successfully',
      data: restoredCompany,
    };
  }

  async toggleCompanyStatus(id: string, isActive: boolean) {
    return this.updateCompany(id, { isActive });
  }

  async inviteUser(
    companyId: string,
    invitedBy: string,
    dto: InviteUserDto,
  ) {
    const { email, firstName, lastName, roleId, message } = dto;

    // Check if company exists and is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found or inactive');
    }

    // Check if user already exists in the company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists in this company');
    }

    // Check if there's a pending invite for this email
    const existingInvite = await this.prisma.userInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        companyId,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException('User already has a pending invite');
    }

    // Check if role exists and belongs to the company's available roles
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if invited user has permission to assign this role
    const inviterRoles = await this.prisma.userRole.findMany({
      where: { userId: invitedBy },
      include: { role: true },
    });

    const canAssignRole = this.canAssignRole(inviterRoles, role.name);
    if (!canAssignRole) {
      throw new ForbiddenException('You do not have permission to assign this role');
    }

    // Generate invite token
    const token = this.jwtService.sign(
      {
        email: email.toLowerCase(),
        companyId,
        roleId,
        firstName,
        lastName,
      },
      { expiresIn: '7d' },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invite record
    const invite = await this.prisma.userInvite.create({
      data: {
        email: email.toLowerCase(),
        token,
        firstName,
        lastName,
        roleId,
        companyId,
        invitedBy,
        status: InviteStatus.PENDING,
        expiresAt,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: invitedBy,
        action: 'USER_INVITED',
        entityType: 'UserInvite',
        entityId: invite.id,
        newData: {
          email: invite.email,
          role: invite.role.name,
          companyId: invite.companyId,
        },
      },
    });

    // Generate invite URL
    const inviteUrl = `${process.env.FRONTEND_URL}/auth/accept-invite?token=${token}`;

    // TODO: Send email with invite link
    // await this.sendInviteEmail(email, inviteUrl, company.name, message);

    return {
      success: true,
      message: 'Invitation sent successfully',
      data: {
        token,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
        role: invite.role,
      },
    };
  }

  async acceptInvite(token: string, password: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const { email, companyId, roleId, firstName, lastName } = payload;

    // Check if invite exists and is valid
    const invite = await this.prisma.userInvite.findFirst({
      where: {
        token,
        email,
        companyId,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (!invite) {
      throw new BadRequestException('Invite not found or expired');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email, companyId },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Check if company is active
    const company = await this.prisma.company.findUnique({
      where: { id: companyId, isActive: true },
    });

    if (!company) {
      throw new BadRequestException('Company is no longer active');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          companyId,
          isActive: true,
          userType: 'INVITE',
          firstName: firstName || invite.firstName,
          lastName: lastName || invite.lastName
        },
      });

      // Assign role
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId,
        },
      });

      // Update invite status
      await tx.userInvite.update({
        where: { id: invite.id },
        data: { status: InviteStatus.ACCEPTED },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_ACCEPTED_INVITE',
          entityType: 'User',
          entityId: newUser.id,
          newData: {
            email: newUser.email,
            roleId,
            companyId,
          },
        },
      });

      return newUser;
    });

    // Generate tokens for the new user
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      roles: [roleId],
    });

    return {
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
      },
    };
  }

  async getCompanyUsers(
    companyId: string,
    userId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    },
  ) {
    const { page = 1, limit = 10, search, role } = params;
    const skip = (page - 1) * limit;

    // Check if user has permission to view users
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const canViewAllUsers = this.canViewAllUsers(userRoles);

    const where: any = {
      companyId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && !canViewAllUsers) {
      // Non-admin users can only see their own role and below
      const allowedRoles = this.getAllowedRoles(userRoles);
      where.userRoles = {
        some: {
          role: {
            name: { in: allowedRoles },
          },
        },
      };
    } else if (role && canViewAllUsers) {
      where.userRoles = {
        some: {
          role: { name: role },
        },
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        roles: user.userRoles.map((ur) => ur.role),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingInvites(companyId: string) {
    const invites = await this.prisma.userInvite.findMany({
      where: {
        companyId,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        role: invite.role,
        invitedBy: invite.invitedByUser,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
    };
  }

  async cancelInvite(companyId: string, inviteId: string, userId: string) {
    const invite = await this.prisma.userInvite.findFirst({
      where: {
        id: inviteId,
        companyId,
        status: InviteStatus.PENDING,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    // Check permission
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const canCancelInvite = this.canCancelInvite(userRoles, invite.invitedBy);
    if (!canCancelInvite) {
      throw new ForbiddenException('You do not have permission to cancel this invite');
    }

    await this.prisma.userInvite.update({
      where: { id: inviteId },
      data: { status: InviteStatus.CANCELLED },
    });

    return {
      success: true,
      message: 'Invite cancelled successfully',
    };
  }

  async resendInvite(companyId: string, inviteId: string, userId: string) {
    const invite = await this.prisma.userInvite.findFirst({
      where: {
        id: inviteId,
        companyId,
        status: InviteStatus.PENDING,
      },
      include: {
        company: true,
        role: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    // Generate new token
    const token = this.jwtService.sign(
      {
        email: invite.email,
        companyId: invite.companyId,
        roleId: invite.roleId,
        firstName: invite.firstName,
        lastName: invite.lastName,
      },
      { expiresIn: '7d' },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invite with new token
    await this.prisma.userInvite.update({
      where: { id: inviteId },
      data: {
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/auth/accept-invite?token=${token}`;

    // TODO: Resend email
    // await this.sendInviteEmail(invite.email, inviteUrl, invite.company.name);

    return {
      success: true,
      message: 'Invite resent successfully',
      data: {
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  // Permission helper methods
  private canAssignRole(inviterRoles: any[], targetRole: string): boolean {
    const roleHierarchy = ['SYSTEM_SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'USER'];
    const inviterHighestRole = this.getHighestRole(inviterRoles);
    const targetRoleLevel = roleHierarchy.indexOf(targetRole);
    const inviterRoleLevel = roleHierarchy.indexOf(inviterHighestRole);

    return inviterRoleLevel < targetRoleLevel;
  }

  private getHighestRole(roles: any[]): string {
    const roleHierarchy = ['SYSTEM_SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'USER'];
    let highestRole = 'USER';
    let highestLevel = roleHierarchy.length;

    for (const userRole of roles) {
      const level = roleHierarchy.indexOf(userRole.role.name);
      if (level < highestLevel) {
        highestLevel = level;
        highestRole = userRole.role.name;
      }
    }

    return highestRole;
  }

  private canViewAllUsers(userRoles: any[]): boolean {
    return userRoles.some(
      (ur) => ur.role.name === 'SYSTEM_SUPER_ADMIN' || ur.role.name === 'COMPANY_ADMIN',
    );
  }

  private getAllowedRoles(userRoles: any[]): string[] {
    const roleHierarchy = ['SYSTEM_SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'USER'];
    const highestRole = this.getHighestRole(userRoles);
    const highestLevel = roleHierarchy.indexOf(highestRole);
    return roleHierarchy.slice(highestLevel);
  }

  private canCancelInvite(userRoles: any[], invitedBy: string | null): boolean {
    const isAdmin = userRoles.some((ur) => ur.role.name === 'COMPANY_ADMIN');
    const isSuperAdmin = userRoles.some((ur) => ur.role.name === 'SYSTEM_SUPER_ADMIN');
    
    if (isSuperAdmin) return true;
    if (isAdmin) return true;
    
    // Users can only cancel their own invites
    return userRoles.some((ur) => ur.userId === invitedBy);
  }
}

