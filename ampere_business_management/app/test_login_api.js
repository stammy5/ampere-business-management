
const { default: fetch, FormData, Headers } = require('node-fetch');

async function testLoginAPI() {
  console.log('🔍 Testing NextAuth login API...\n');
  
  try {
    // Test 1: Get CSRF token first
    console.log('1. Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('   CSRF token:', csrfData.csrfToken ? 'received' : 'missing');
    
    if (!csrfData.csrfToken) {
      console.log('❌ No CSRF token received');
      return;
    }

    // Test 2: Attempt login with credentials
    console.log('\n2. Attempting login with credentials...');
    
    const loginFormData = new URLSearchParams();
    loginFormData.append('email', 'zack');
    loginFormData.append('password', 'password123');
    loginFormData.append('callbackUrl', '/dashboard');
    loginFormData.append('redirect', 'false');
    loginFormData.append('csrfToken', csrfData.csrfToken);
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Auth-Return-Redirect': '1',
      },
      body: loginFormData.toString(),
      redirect: 'manual'
    });
    
    console.log('   Login response status:', loginResponse.status);
    console.log('   Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    if (loginResponse.status === 302) {
      console.log('   Redirect location:', loginResponse.headers.get('location'));
    }
    
    try {
      const loginResponseText = await loginResponse.text();
      console.log('   Login response body length:', loginResponseText.length);
      if (loginResponseText.length < 500) {
        console.log('   Login response body:', loginResponseText);
      }
    } catch (e) {
      console.log('   Could not read response body');
    }

    // Test 3: Check session after login attempt
    console.log('\n3. Checking session...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
      headers: {
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      }
    });
    
    const sessionData = await sessionResponse.json();
    console.log('   Session data:', sessionData);
    
  } catch (error) {
    console.error('💥 API test error:', error.message);
  }
}

testLoginAPI();
