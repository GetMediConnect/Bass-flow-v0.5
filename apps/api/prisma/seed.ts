import { PrismaClient, Genre, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo users
  const password = await bcrypt.hash('bassflow2025', 12);

  const maduki = await prisma.user.upsert({
    where: { email: 'maduki@bassflow.io' },
    update: {},
    create: {
      username: 'DJ_MADUKI',
      email: 'maduki@bassflow.io',
      passwordHash: password,
      role: UserRole.DJ,
      xp: 8800,
      bio: 'Neurofunk & liquid DnB from the UK. Founder of BassFlow.',
    },
  });

  const liquidSoul = await prisma.user.upsert({
    where: { email: 'liquid@bassflow.io' },
    update: {},
    create: {
      username: 'LiquidSoul',
      email: 'liquid@bassflow.io',
      passwordHash: password,
      xp: 3400,
      bio: 'Liquid vibes all day, every day.',
    },
  });

  const prototype = await prisma.user.upsert({
    where: { email: 'prototype@bassflow.io' },
    update: {},
    create: {
      username: 'DJ_Prototype',
      email: 'prototype@bassflow.io',
      passwordHash: password,
      xp: 5500,
      bio: 'Heavy bass from London.',
    },
  });

  console.log(`✅ Users: ${maduki.username}, ${liquidSoul.username}, ${prototype.username}`);

  // Demo DJ set
  await prisma.dJSet.upsert({
    where: { id: 'seed-set-01' },
    update: {},
    create: {
      id: 'seed-set-01',
      name: 'Neurofunk Journey',
      userId: maduki.id,
      tracks: [
        { title: 'Neural Collapse', artist: 'DJ MADUKI', bpm: 174, key: '8A', energy: 8 },
        { title: 'Liquid Dreams', artist: 'LiquidSoul', bpm: 170, key: '9A', energy: 5 },
        { title: 'Dark Matter', artist: 'NR-7', bpm: 176, key: '8A', energy: 9 },
        { title: 'Soft Landing', artist: 'LiquidSoul', bpm: 170, key: '10A', energy: 4 },
        { title: 'System Overload', artist: 'DJ Prototype', bpm: 174, key: '7A', energy: 10 },
      ],
    },
  });

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
