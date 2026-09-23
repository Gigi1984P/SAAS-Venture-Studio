
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'alice@venturestudio.de' }
  });
  if (user) {
    console.log('FOUND:', user.email);
    console.log('Has password:', !!user.password);
    console.log('PW prefix:', user.password ? user.password.substring(0,30) : 'none');
    console.log('Verified:', user.emailVerified);
  } else {
    console.log('NOT_FOUND');
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error('ERROR:', e.message); prisma.$disconnect(); });
