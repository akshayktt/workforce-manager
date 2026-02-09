const pg = require('pg');
const pool = new pg.Pool({
  connectionString: 'postgresql://neondb_owner:npg_I7V8ULHZNEde@ep-patient-dust-air2gcev-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

pool.query('SELECT id, username, full_name, role FROM public.users LIMIT 20', (err, res) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('Users in database:');
    if (res.rows.length === 0) {
      console.log('No users found');
    } else {
      res.rows.forEach(u => console.log(`- ${u.username} (${u.full_name}): ${u.role}`));
    }
  }
  pool.end();
});
