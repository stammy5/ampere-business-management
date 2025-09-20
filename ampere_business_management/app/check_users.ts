
import { prisma } from './lib/db';

async function checkUsers() {
  try {
    console.log('🔍 Checking all users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('👥 Found', users.length, 'users:');
    users.forEach(user => {
      console.log('  -', user.name || 'no-name', '|', user.email || 'no-email', '|', user.role, '| Active:', user.isActive);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('💥 Database error:', error);
    await prisma.$disconnect();
  }
}

checkUsers();
