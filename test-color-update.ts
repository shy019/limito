import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

async function testColorUpdate() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!
  });
  
  console.log('1. Color actual:');
  let result = await client.execute("SELECT value FROM settings WHERE key = 'accent_color'");
  console.log('   ', result.rows[0]?.value);
  
  console.log('\n2. Actualizando a azul (#0066cc)...');
  await client.execute({
    sql: "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?",
    args: ['#0066cc', 'accent_color']
  });
  
  console.log('\n3. Color después de actualizar:');
  result = await client.execute("SELECT value FROM settings WHERE key = 'accent_color'");
  console.log('   ', result.rows[0]?.value);
  
  console.log('\n✅ Actualización funcionó');
}

testColorUpdate();
