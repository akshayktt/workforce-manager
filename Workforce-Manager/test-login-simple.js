const http = require('http');

console.log('Attempting to connect to http://127.0.0.1:5000/api/auth/login');

const postData = JSON.stringify({
  username: 'supervisor1',
  password: 'super123'
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      console.log('Response:', JSON.parse(data));
    } catch (e) {
      console.log('Response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Connection Error: ${e.code} - ${e.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Request timed out');
  process.exit(1);
});

console.log('Sending request...');
req.write(postData);
req.end();
