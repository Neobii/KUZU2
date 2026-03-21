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
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        isAdmin: true,
        isProducer: true,
      },
    })
    console.log('Created admin user:', email)
  } else {
    console.log('Admin user already exists:', email)
  }

  await seedWelcomePostsIfEmpty()
}

/** Idempotent: only adds sample posts when the table is empty (fresh DB). */
async function seedWelcomePostsIfEmpty() {
  const count = await prisma.post.count()
  if (count > 0) return

  await prisma.post.createMany({
    data: [
      {
        title: 'Welcome to Kuzu',
        visibleBy: ['public'],
        content:
          '<p>This is a sample update visible to everyone. Admins can edit or delete it from <strong>Admin → Posts</strong>.</p>',
        postDate: new Date(),
      },
      {
        title: 'Producer tips',
        visibleBy: ['evergreen'],
        content:
          '<p>This post is only visible to <strong>non-pioneer producers</strong> (evergreen). Pioneer-only posts use <code>pioneer</code> visibility.</p>',
        postDate: new Date(),
      },
    ],
  })
  console.log('Seeded sample posts (empty table only).')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
