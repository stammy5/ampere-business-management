
const fetch = require('node-fetch');
const { CookieJar } = require('tough-cookie');
const fetchCookie = require('fetch-cookie/node-fetch');

// Create a cookie jar to persist cookies across requests
const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

const BASE_URL = 'http://localhost:3000';

async function testCompleteLoginFlow() {
    console.log('🚀 Starting complete login flow test...\n');
    
    try {
        // Step 1: Get the login page first to establish any necessary cookies
        console.log('📄 Step 1: Fetching login page...');
        const loginPageResponse = await fetchWithCookies(`${BASE_URL}/auth/login`);
        console.log(`Login page status: ${loginPageResponse.status}`);
        console.log(`Login page headers:`, Object.fromEntries(loginPageResponse.headers.entries()));
        
        // Step 2: Get initial session state
        console.log('\n🔍 Step 2: Checking initial session...');
        const initialSessionResponse = await fetchWithCookies(`${BASE_URL}/api/auth/session`);
        const initialSession = await initialSessionResponse.json();
        console.log('Initial session:', initialSession);
        
        // Step 3: Test debug session endpoint
        console.log('\n🔧 Step 3: Testing debug session endpoint...');
        const debugResponse = await fetchWithCookies(`${BASE_URL}/api/debug-session`);
        const debugData = await debugResponse.json();
        console.log('Debug session response:', JSON.stringify(debugData, null, 2));
        
        // Step 4: Attempt NextAuth login via signIn API
        console.log('\n🔐 Step 4: Testing NextAuth signIn endpoint...');
        const credentials = {
            email: 'zack',
            password: 'password123',
            callbackUrl: '/dashboard',
            json: true
        };
        
        const signInResponse = await fetchWithCookies(`${BASE_URL}/api/auth/signin/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        console.log(`SignIn response status: ${signInResponse.status}`);
        console.log(`SignIn response headers:`, Object.fromEntries(signInResponse.headers.entries()));
        
        const signInData = await signInResponse.text();
        console.log('SignIn response body:', signInData);
        
        // Step 5: Try alternative NextAuth callback endpoint
        console.log('\n🔄 Step 5: Testing NextAuth callback endpoint...');
        const callbackResponse = await fetchWithCookies(`${BASE_URL}/api/auth/callback/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'zack',
                password: 'password123',
                callbackUrl: '/dashboard'
            })
        });
        
        console.log(`Callback response status: ${callbackResponse.status}`);
        console.log(`Callback response headers:`, Object.fromEntries(callbackResponse.headers.entries()));
        
        // Step 6: Check session after NextAuth attempt
        console.log('\n🔍 Step 6: Checking session after NextAuth attempt...');
        const postNextAuthSessionResponse = await fetchWithCookies(`${BASE_URL}/api/auth/session`);
        const postNextAuthSession = await postNextAuthSessionResponse.json();
        console.log('Session after NextAuth:', postNextAuthSession);
        
        // Step 7: Test custom login endpoint
        console.log('\n🔧 Step 7: Testing custom login endpoint...');
        const customLoginResponse = await fetchWithCookies(`${BASE_URL}/api/custom-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'zack',
                password: 'password123'
            })
        });
        
        console.log(`Custom login response status: ${customLoginResponse.status}`);
        const customLoginData = await customLoginResponse.json();
        console.log('Custom login response:', customLoginData);
        
        // Step 8: Test dashboard access
        console.log('\n🏠 Step 8: Testing dashboard access...');
        const dashboardResponse = await fetchWithCookies(`${BASE_URL}/dashboard`);
        console.log(`Dashboard response status: ${dashboardResponse.status}`);
        console.log(`Dashboard response headers:`, Object.fromEntries(dashboardResponse.headers.entries()));
        
        if (dashboardResponse.status === 200) {
            const dashboardHtml = await dashboardResponse.text();
            console.log('Dashboard HTML snippet (first 500 chars):', dashboardHtml.substring(0, 500));
            
            if (dashboardHtml.includes('Welcome back')) {
                console.log('✅ Dashboard contains welcome message - SUCCESS!');
            } else if (dashboardHtml.includes('Loading')) {
                console.log('⏳ Dashboard shows loading state');
            } else {
                console.log('❓ Dashboard content unclear');
            }
        } else {
            console.log('❌ Dashboard access failed');
        }
        
        // Step 9: Final debug check
        console.log('\n🔧 Step 9: Final debug session check...');
        const finalDebugResponse = await fetchWithCookies(`${BASE_URL}/api/debug-session`);
        const finalDebugData = await finalDebugResponse.json();
        console.log('Final debug session response:', JSON.stringify(finalDebugData, null, 2));
        
        // Step 10: Check current cookies
        console.log('\n🍪 Step 10: Final cookie state...');
        console.log('All cookies in jar:');
        jar.getCookiesSync(BASE_URL).forEach(cookie => {
            console.log(`  ${cookie.key}: ${cookie.value ? 'SET' : 'EMPTY'}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testCompleteLoginFlow().then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
});
