import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function resetPassword() {
  const email = "alice@venturestudio.de";
  const newPassword = "rW6G@YD6zCGbdTt";

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log(`User ${email} not found. Creating...`);
    const hashed = await bcrypt.hash(newPassword, 12);
    const created = await prisma.user.create({
      data: {
        email,
        name: "Alice",
        password: hashed,
        role: "user",
      },
    });
    console.log(`Created user ${created.email} with id ${created.id}`);
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  console.log(`Password reset for ${email}`);
}

resetPassword()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
