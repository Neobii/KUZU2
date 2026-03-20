import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@kuzu.fm'
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'changeme'
  const passwordHash = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({
    where: { email },
  })
  if (existing) {
    console.log('Admin user already exists:', email)
    return
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      isAdmin: true,
      isProducer: true,
    },
  })
  console.log('Created admin user:', email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
