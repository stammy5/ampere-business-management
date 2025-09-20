
const https = require('https');
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;
        
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = client.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data,
                    cookies: res.headers['set-cookie'] || []
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function testLogin() {
    console.log('🚀 Starting simple login test...\n');
    
    try {
        // Test 1: Check if server is running
        console.log('📡 Step 1: Testing server connectivity...');
        const serverTest = await makeRequest(`${BASE_URL}/`);
        console.log(`Server response status: ${serverTest.status}`);
        console.log(`Server redirects to: ${serverTest.headers.location || 'none'}`);
        
        // Test 2: Check login page
        console.log('\n📄 Step 2: Testing login page...');
        const loginPage = await makeRequest(`${BASE_URL}/auth/login`);
        console.log(`Login page status: ${loginPage.status}`);
        console.log(`Login page contains form: ${loginPage.data.includes('Sign in') ? 'Yes' : 'No'}`);
        
        // Test 3: Check session endpoint
        console.log('\n🔍 Step 3: Testing session endpoint...');
        const sessionTest = await makeRequest(`${BASE_URL}/api/auth/session`);
        console.log(`Session endpoint status: ${sessionTest.status}`);
        console.log(`Session response:`, sessionTest.data.substring(0, 200));
        
        // Test 4: Try custom login endpoint
        console.log('\n🔧 Step 4: Testing custom login endpoint...');
        const customLogin = await makeRequest(`${BASE_URL}/api/custom-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'zack',
                password: 'password123'
            })
        });
        console.log(`Custom login status: ${customLogin.status}`);
        console.log(`Custom login response:`, customLogin.data);
        console.log(`Custom login cookies:`, customLogin.cookies);
        
        // Test 5: Check debug endpoint
        console.log('\n🔍 Step 5: Testing debug endpoint...');
        const debugTest = await makeRequest(`${BASE_URL}/api/debug-session`);
        console.log(`Debug endpoint status: ${debugTest.status}`);
        console.log(`Debug response:`, debugTest.data.substring(0, 500));
        
        // Test 6: Check database users
        console.log('\n👥 Step 6: Checking users in database...');
        const usersTest = await makeRequest(`${BASE_URL}/api/users`);
        console.log(`Users endpoint status: ${usersTest.status}`);
        if (usersTest.status === 200) {
            try {
                const usersData = JSON.parse(usersTest.data);
                console.log(`Number of users found: ${usersData.length || 0}`);
                if (usersData.length > 0) {
                    console.log('Sample user:', {
                        name: usersData[0].name,
                        email: usersData[0].email,
                        role: usersData[0].role,
                        isActive: usersData[0].isActive
                    });
                }
            } catch (e) {
                console.log('Could not parse users response');
            }
        }
        
        console.log('\n✅ Test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLogin();
