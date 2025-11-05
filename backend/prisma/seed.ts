import { PrismaClient, UserRole, CampaignStatus, PlanInterval } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting seed...');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.webPushSubscription.deleteMany();
  await prisma.pushToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'Admin123!@#',
    Number(process.env.BCRYPT_ROUNDS) || 10,
  );

  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@godescontos.com',
      passwordHash: adminPassword,
      name: 'Admin GoDescontos',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Regular Users
  console.log('👥 Creating regular users...');
  const userPassword = await bcrypt.hash('User123!@#', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'joao.silva@example.com',
        passwordHash: userPassword,
        name: 'João Silva',
        role: UserRole.USER,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria.santos@example.com',
        passwordHash: userPassword,
        name: 'Maria Santos',
        role: UserRole.USER,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ ${users.length} users created`);

  // Create Merchant Users and Merchants
  console.log('🏪 Creating merchants...');
  const merchantPassword = await bcrypt.hash('Merchant123!@#', 10);

  const merchantUser1 = await prisma.user.create({
    data: {
      email: 'contato@pizzariabellanapoli.com',
      passwordHash: merchantPassword,
      name: 'Carlos Pizzaiolo',
      role: UserRole.MERCHANT,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const merchant1 = await prisma.merchant.create({
    data: {
      userId: merchantUser1.id,
      name: 'Pizzaria Bella Napoli',
      cnpj: '12.345.678/0001-90',
      address: 'Rua das Pizzas, 123',
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
      zipCode: '01234-567',
      phone: '+55 11 98765-4321',
      description: 'Autêntica pizzaria italiana com receitas tradicionais de Nápoles.',
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  const merchantUser2 = await prisma.user.create({
    data: {
      email: 'contato@academiaformaativa.com',
      passwordHash: merchantPassword,
      name: 'Ana Personal',
      role: UserRole.MERCHANT,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const merchant2 = await prisma.merchant.create({
    data: {
      userId: merchantUser2.id,
      name: 'Academia Forma Ativa',
      cnpj: '98.765.432/0001-10',
      address: 'Av. da Saúde, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'BR',
      zipCode: '20000-000',
      phone: '+55 21 91234-5678',
      description: 'Academia completa com musculação, crossfit, natação e aulas coletivas.',
      isApproved: true,
      approvedAt: new Date(),
    },
  });

  console.log(`✅ ${2} merchants created`);

  // Create Plans
  console.log('💳 Creating subscription plans...');
  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        name: 'Básico',
        description: 'Plano ideal para começar',
        stripePriceId: 'price_basic_monthly',
        stripeProductId: 'prod_basic',
        price: 49.90,
        currency: 'BRL',
        interval: 'month',
        features: {
          maxCampaigns: 5,
          featuredCampaigns: 0,
          analytics: 'basic',
          support: 'email',
        },
        maxCampaigns: 5,
        isActive: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Profissional',
        description: 'Para negócios em crescimento',
        stripePriceId: 'price_pro_monthly',
        stripeProductId: 'prod_pro',
        price: 99.90,
        currency: 'BRL',
        interval: 'month',
        features: {
          maxCampaigns: 20,
          featuredCampaigns: 2,
          analytics: 'advanced',
          support: 'priority',
        },
        maxCampaigns: 20,
        isActive: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Enterprise',
        description: 'Solução completa para grandes empresas',
        stripePriceId: 'price_enterprise_monthly',
        stripeProductId: 'prod_enterprise',
        price: 299.90,
        currency: 'BRL',
        interval: 'month',
        features: {
          maxCampaigns: -1, // unlimited
          featuredCampaigns: 10,
          analytics: 'premium',
          support: '24/7',
          customBranding: true,
        },
        maxCampaigns: 999,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ ${plans.length} plans created`);

  // Create Sample Campaigns
  console.log('🎯 Creating sample campaigns...');

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const campaign1 = await prisma.campaign.create({
    data: {
      merchantId: merchant1.id,
      title: 'Pizza Grande + Refri 2L - Promoção Especial',
      slug: 'pizza-grande-refri-2l-promo-especial',
      description:
        'Saboreie uma deliciosa pizza grande (8 fatias) de qualquer sabor do nosso cardápio + Refrigerante 2L. Válido de segunda a quinta-feira.',
      shortDescription: 'Pizza Grande + Refri 2L com desconto especial',
      priceOriginal: 89.90,
      pricePromo: 49.90,
      discountPercent: 44,
      category: 'Alimentação',
      tags: ['pizza', 'delivery', 'italiano', 'promoção'],
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
      startAt: now,
      endAt: twoWeeksFromNow,
      totalQuantity: 100,
      status: CampaignStatus.PUBLISHED,
      terms:
        'Válido apenas de segunda a quinta-feira. Não acumulativo com outras promoções. Delivery grátis para pedidos acima de R$ 50.',
      isPaid: true,
      isFeatured: true,
      publishedAt: now,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      merchantId: merchant2.id,
      title: 'Plano Trimestral Academia - 50% OFF',
      slug: 'plano-trimestral-academia-50-off',
      description:
        'Plano trimestral com acesso total à academia: musculação, aulas coletivas, natação e crossfit. Taxa de matrícula grátis!',
      shortDescription: '3 meses de academia com 50% de desconto',
      priceOriginal: 597.00,
      pricePromo: 298.50,
      discountPercent: 50,
      category: 'Fitness',
      tags: ['academia', 'fitness', 'saúde', 'musculação'],
      city: 'Rio de Janeiro',
      state: 'RJ',
      country: 'BR',
      startAt: now,
      endAt: oneMonthFromNow,
      totalQuantity: 50,
      status: CampaignStatus.PUBLISHED,
      terms: 'Válido para novos alunos. Atestado médico obrigatório. Taxa de matrícula grátis nesta promoção.',
      isPaid: true,
      isFeatured: true,
      publishedAt: now,
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      merchantId: merchant1.id,
      title: 'Rodízio de Pizza - Finais de Semana',
      slug: 'rodizio-pizza-finais-semana',
      description:
        'Rodízio completo de pizzas com mais de 30 sabores! Inclui pizzas doces e bebidas (exceto alcóolicas).',
      shortDescription: 'Rodízio de pizza com mais de 30 sabores',
      priceOriginal: 69.90,
      pricePromo: 39.90,
      discountPercent: 43,
      category: 'Alimentação',
      tags: ['pizza', 'rodízio', 'família', 'fim-de-semana'],
      city: 'São Paulo',
      state: 'SP',
      country: 'BR',
      startAt: now,
      endAt: oneWeekFromNow,
      totalQuantity: 200,
      status: CampaignStatus.PUBLISHED,
      terms: 'Válido apenas aos sábados e domingos. Crianças até 6 anos não pagam. Reservas recomendadas.',
      isPaid: true,
      publishedAt: now,
    },
  });

  console.log(`✅ ${3} campaigns created`);

  // Create Coupons for campaigns
  console.log('🎫 Creating coupons...');
  const coupons = [];

  // Create 10 coupons for campaign1
  for (let i = 0; i < 10; i++) {
    const coupon = await prisma.coupon.create({
      data: {
        campaignId: campaign1.id,
        code: `PIZZA-${campaign1.id.substring(0, 8).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        expiresAt: twoWeeksFromNow,
      },
    });
    coupons.push(coupon);
  }

  // Assign some coupons to users
  await prisma.coupon.update({
    where: { id: coupons[0].id },
    data: {
      userId: users[0].id,
      reservedAt: now,
    },
  });

  console.log(`✅ ${coupons.length} coupons created`);

  // Create Customers for merchants
  console.log('👨‍💼 Creating customers...');
  await Promise.all([
    prisma.customer.create({
      data: {
        merchantId: merchant1.id,
        userId: users[0].id,
        email: users[0].email,
        name: users[0].name,
        phone: '+55 11 99999-0001',
      },
    }),
    prisma.customer.create({
      data: {
        merchantId: merchant1.id,
        email: 'pedro.costa@example.com',
        name: 'Pedro Costa',
        phone: '+55 11 99999-0002',
      },
    }),
    prisma.customer.create({
      data: {
        merchantId: merchant2.id,
        userId: users[1].id,
        email: users[1].email,
        name: users[1].name,
        phone: '+55 21 99999-0003',
      },
    }),
  ]);
  console.log('✅ Customers created');

  // Create sample notifications
  console.log('🔔 Creating sample notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[0].id,
        type: 'NEW_CAMPAIGN',
        title: 'Nova promoção de pizza!',
        body: 'Pizza Grande + Refri 2L por apenas R$ 49,90. Corre que é por tempo limitado!',
        data: { campaignId: campaign1.id },
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id,
        type: 'NEW_CAMPAIGN',
        title: 'Academia com 50% OFF',
        body: 'Plano trimestral com metade do preço. Não perca essa oportunidade!',
        data: { campaignId: campaign2.id },
      },
    }),
  ]);
  console.log('✅ Notifications created');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`  - Users: ${(await prisma.user.count())} (1 admin, 2 regular, 2 merchants)`);
  console.log(`  - Merchants: ${await prisma.merchant.count()}`);
  console.log(`  - Campaigns: ${await prisma.campaign.count()}`);
  console.log(`  - Coupons: ${await prisma.coupon.count()}`);
  console.log(`  - Plans: ${await prisma.plan.count()}`);
  console.log(`  - Customers: ${await prisma.customer.count()}`);
  console.log(`  - Notifications: ${await prisma.notification.count()}`);
  console.log('');
  console.log('🔐 Default credentials:');
  console.log('  Admin:    admin@godescontos.com / Admin123!@#');
  console.log('  User 1:   joao.silva@example.com / User123!@#');
  console.log('  User 2:   maria.santos@example.com / User123!@#');
  console.log('  Merchant 1: contato@pizzariabellanapoli.com / Merchant123!@#');
  console.log('  Merchant 2: contato@academiaformaativa.com / Merchant123!@#');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
