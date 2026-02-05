import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function addAccentColor() {
  try {
    // Verificar si la columna ya existe
    const check = await turso.execute(`
      SELECT COUNT(*) as count 
      FROM pragma_table_info('settings') 
      WHERE name = 'accent_color'
    `);

    if (check.rows[0].count === 0) {
      await turso.execute(`
        ALTER TABLE settings ADD COLUMN accent_color TEXT DEFAULT '#D4AF37'
      `);
      console.log('✅ Campo accent_color agregado exitosamente');
    } else {
      console.log('ℹ️  Campo accent_color ya existe');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addAccentColor();
