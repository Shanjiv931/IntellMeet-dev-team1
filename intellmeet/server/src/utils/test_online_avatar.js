const ONLINE_BACKEND_URL = 'https://intellmeet-backend-5j5a.onrender.com/api';

async function verify() {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const email = `avatar-test-${randomSuffix}@example.com`;
  console.log(`Sending registration request to: ${email}`);

  try {
    const res = await fetch(`${ONLINE_BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Avatar Verification User',
        email,
        password: 'Password123!'
      })
    });
    
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log('Result User object:', data.data?.user);
    if (data.data?.user && 'avatar' in data.data.user) {
      console.log('SUCCESS: Newly deployed backend is LIVE and user payload contains the "avatar" field!');
      process.exit(0);
    } else {
      console.log('INFO: Deployed backend does not have "avatar" field yet. Still running old build.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(2);
  }
}

verify();
