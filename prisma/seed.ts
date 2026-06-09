import bcrypt from 'bcrypt';
import { Role } from '../src/common/constants';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('🌱 Start seeding...');

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  /*
   * 1. SYSTEM COMPANY
   */
  const systemCompany = await prisma.company.upsert({
    where: { code: 'SYSTEM' },
    update: {},
    create: {
      name: 'PMSSHIP System',
      code: 'SYSTEM',
      subdomain: 'admin',
      isActive: true,
      timezone: 'Asia/Ho_Chi_Minh',
    },
  });

  /*
   * 2. ROLES (UPSERT SAFE)
   */
  const superAdminRole = await prisma.role.upsert({
    where: { name: Role.SYSTEM_SUPER_ADMIN },
    update: {},
    create: { name: Role.SYSTEM_SUPER_ADMIN },
  });

  await prisma.role.upsert({
    where: { name: Role.SYSTEM_SUPPORT },
    update: {},
    create: { name: Role.SYSTEM_SUPPORT },
  });

 await prisma.role.upsert({
    where: { name: Role.COMPANY_ADMIN },
    update: {},
    create: { name: Role.COMPANY_ADMIN },
  });

  /*
   * 3. PERMISSIONS
   */
  await prisma.permission.createMany({
    data: [
      { code: 'system:all', name: 'Full System Access' },
      { code: 'company:manage', name: 'Manage Companies' },
    ],
    skipDuplicates: true,
  });

  /*
   * 4. SYSTEM ADMIN USER
   */
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@pmsship.com' },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@pmsship.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
        userType: 'SYSTEM', // must match Prisma enum
        companyId: systemCompany.id,
      },
    });

    console.log('✅ Super Admin created');
  }

  /*
   * 5. ASSIGN ROLE (UPSERT SAFE)
   */
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  console.log('🚀 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });