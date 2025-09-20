
const { prisma } = require('./lib/db');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    const user = await prisma.user.findFirst({ 
      where: { name: 'zack' } 
    });
    
    if (user) {
      console.log('✅ Found user:', { 
        name: user.name, 
        role: user.role, 
        isActive: user.isActive,
        email: user.email
      });
    } else {
      console.log('❌ User "zack" not found');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('💥 Database error:', error.message);
    await prisma.$disconnect();
  }
}

testDatabase();
