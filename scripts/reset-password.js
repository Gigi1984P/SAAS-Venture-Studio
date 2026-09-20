const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  const email = "alice@venturestudio.de";
  const password = "rW6G@YD6zCGbdTt";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found:", email);
    await prisma.$disconnect();
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  console.log("Password reset for:", email);
  await prisma.$disconnect();
}

resetPassword().catch(e => { console.error(e); process.exit(1); });
