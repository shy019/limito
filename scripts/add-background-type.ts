import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function addBackgroundType() {
  try {
    // Verificar si ya existe
    const check = await turso.execute("SELECT key FROM settings WHERE key = 'background_type'");
    
    if (check.rows.length === 0) {
      await turso.execute({
        sql: "INSERT INTO settings (key, value) VALUES ('background_type', 'image')",
        args: []
      });
      console.log('✅ Campo background_type agregado');
    } else {
      console.log('✅ Campo background_type ya existe');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addBackgroundType();
