
const { execSync } = require('child_process');

console.log('🔍 Testing login flow...\n');

// Test 1: Check if login endpoint is accessible
console.log('1. Testing login endpoint accessibility...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/signin', { encoding: 'utf8' });
  console.log(`   Login endpoint status: ${response}`);
} catch (e) {
  console.log('   Login endpoint error:', e.message);
}

// Test 2: Check credentials API endpoint
console.log('\n2. Testing credentials endpoint...');
try {
  const credentialsTest = execSync(`curl -s -X POST http://localhost:3000/api/auth/callback/credentials \\
    -H "Content-Type: application/x-www-form-urlencoded" \\
    -d "email=zack&password=password123&callbackUrl=/dashboard&redirect=false" \\
    -w "\\nStatus: %{http_code}"`, { encoding: 'utf8' });
  console.log('   Credentials test response:', credentialsTest);
} catch (e) {
  console.log('   Credentials test error:', e.message);
}

// Test 3: Check session endpoint
console.log('\n3. Testing session endpoint...');
try {
  const sessionTest = execSync('curl -s http://localhost:3000/api/auth/session', { encoding: 'utf8' });
  console.log('   Session response:', sessionTest);
} catch (e) {
  console.log('   Session test error:', e.message);
}

// Test 4: Check database connection
console.log('\n4. Testing database user lookup...');
try {
  const dbTest = execSync('cd /home/ubuntu/ampere_business_management/app && node -e "const { prisma } = require(\'./lib/db\'); prisma.user.findFirst({ where: { name: \'zack\' } }).then(user => { console.log(\'Found user:\', user ? { name: user.name, role: user.role, isActive: user.isActive } : \'Not found\'); prisma.$disconnect(); })"', { encoding: 'utf8' });
  console.log('   Database test result:', dbTest);
} catch (e) {
  console.log('   Database test error:', e.message);
}

console.log('\n✅ Debug tests completed.');
