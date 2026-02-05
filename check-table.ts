import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

async function checkTable() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
  });
  
  const result = await client.execute("SELECT * FROM settings WHERE key = 'accent_color'");
  console.log('Rows:', result.rows);
  
  if (result.rows.length === 0) {
    console.log('\n❌ NO existe el registro accent_color');
    console.log('Insertando...');
    await client.execute({
      sql: "INSERT INTO settings (key, value, updated_by) VALUES (?, ?, ?)",
      args: ['accent_color', '#D4AF37', 'admin']
    });
    console.log('✅ Insertado');
  }
}

checkTable();
