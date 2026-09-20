const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  const email = "alice@venturestudio.de";
  const password = "rW6G@YD6zCGbdTt";
  const name = "Alice";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("User already exists:", email);
    await prisma.$disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "user" },
    select: { id: true, email: true, name: true },
  });

  console.log("Created user:", user);
  await prisma.$disconnect();
}

createUser().catch(e => { console.error(e); process.exit(1); });
