
const fetch = require('node-fetch');

async function testLoginFlow() {
  console.log('🧪 Testing Complete Login Flow...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Test custom login API
    console.log('1. Testing Custom Login API...');
    const loginResponse = await fetch(`${baseUrl}/api/custom-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'zack',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login Response Status:', loginResponse.status);
    console.log('   Login Response:', loginData);
    
    // Get cookies from the response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('   Set-Cookie Header:', cookies);
    
    if (!loginResponse.ok || !loginData.success) {
      console.log('❌ Login API failed');
      return;
    }
    
    // Step 2: Extract session token
    let sessionToken = null;
    if (cookies) {
      const sessionMatch = cookies.match(/session-token=([^;]+)/);
      if (sessionMatch) {
        sessionToken = sessionMatch[1];
        console.log('   Session Token Found:', sessionToken.substring(0, 50) + '...');
      }
    }
    
    if (!sessionToken) {
      console.log('❌ No session token found in cookies');
      return;
    }
    
    // Step 3: Test dashboard access
    console.log('\n2. Testing Dashboard Access...');
    const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
      headers: {
        'Cookie': `session-token=${sessionToken}`
      },
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log('   Dashboard Response Status:', dashboardResponse.status);
    console.log('   Dashboard Response Headers:', Object.fromEntries(dashboardResponse.headers.entries()));
    
    if (dashboardResponse.status === 307 || dashboardResponse.status === 302) {
      const location = dashboardResponse.headers.get('location');
      console.log('   Redirected to:', location);
      
      if (location === '/auth/login') {
        console.log('❌ Still redirecting to login - session not recognized');
      } else {
        console.log('✅ Redirected somewhere else:', location);
      }
    } else if (dashboardResponse.status === 200) {
      const dashboardText = await dashboardResponse.text();
      if (dashboardText.includes('Welcome') || dashboardText.includes('Dashboard')) {
        console.log('✅ Dashboard loaded successfully');
      } else {
        console.log('❓ Dashboard response unclear:', dashboardText.substring(0, 200));
      }
    }
    
    // Step 4: Test session validation API
    console.log('\n3. Testing Session Validation...');
    const sessionResponse = await fetch(`${baseUrl}/api/test-session`, {
      headers: {
        'Cookie': `session-token=${sessionToken}`
      }
    });
    
    const sessionData = await sessionResponse.json();
    console.log('   Session Validation:', sessionData);
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testLoginFlow();
