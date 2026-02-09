const pg = require('pg');
const bcrypt = require('bcryptjs');

const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_I7V8ULHZNEde@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function testLogin() {
  try {
    // Get supervisor1 user
    const res = await pool.query('SELECT id, username, password, role FROM public.users WHERE username = $1', ['supervisor1']);
    
    if (res.rows.length === 0) {
      console.error('❌ User supervisor1 not found');
      pool.end();
      return;
    }
    
    const user = res.rows[0];
    console.log('Found user:', { id: user.id, username: user.username, role: user.role });
    console.log('Stored password hash:', user.password.substring(0, 20) + '...');
    
    // Test password comparison
    const passwordToTest = 'super123';
    const isValid = await bcrypt.compare(passwordToTest, user.password);
    
    console.log(`\nPassword test with '${passwordToTest}':`, isValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isValid) {
      // Try to understand what went wrong
      console.log('\nDebugging password issue:');
      console.log('Password length:', user.password.length);
      console.log('Password starts with $2a or $2b:', user.password.startsWith('$2a') || user.password.startsWith('$2b'));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

testLogin();
