import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function addStaticBackground() {
  try {
    const check = await turso.execute("SELECT key FROM settings WHERE key = 'static_background_image'");
    
    if (check.rows.length === 0) {
      await turso.execute({
        sql: "INSERT INTO settings (key, value) VALUES ('static_background_image', '')",
        args: []
      });
      console.log('✅ Campo static_background_image agregado');
    } else {
      console.log('✅ Campo static_background_image ya existe');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addStaticBackground();
