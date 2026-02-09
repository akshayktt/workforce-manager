// Test script to simulate login API call
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'supervisor1',
    password: 'super123'
  })
};

fetch('http://127.0.0.1:5000/api/auth/login', options)
  .then(res => res.json())
  .then(data => {
    console.log('Login response:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.error('Login error:', err.message);
  });
