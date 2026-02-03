import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkData() {
  console.log('🔍 Verificando datos en Turso...\n');
  
  const tables = ['products', 'product_colors', 'promo_codes', 'settings', 'orders', 'reservations', 'phone_subscriptions'];
  
  for (const table of tables) {
    try {
      const result = await turso.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`✅ ${table}: ${count} registros`);
    } catch (error) {
      console.log(`❌ ${table}: tabla no existe o error`);
    }
  }
  
  console.log('\n📋 Configuración actual:');
  try {
    const settings = await turso.execute('SELECT key, value FROM settings');
    if (settings.rows.length === 0) {
      console.log('⚠️  No hay configuración en settings');
    } else {
      settings.rows.forEach(row => {
        const value = row.value as string;
        const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        console.log(`  ${row.key}: ${displayValue}`);
      });
    }
  } catch (error) {
    console.log('❌ Error al leer settings');
  }
}

checkData().then(() => process.exit(0));
