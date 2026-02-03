import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function initTables() {
  console.log('🔧 Inicializando tablas faltantes...\n');
  
  // Crear tabla phone_subscriptions
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS phone_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `);
    await turso.execute('CREATE INDEX IF NOT EXISTS idx_phone_subscriptions_phone ON phone_subscriptions(phone)');
    console.log('✅ Tabla phone_subscriptions creada');
  } catch (error) {
    console.log('❌ Error creando phone_subscriptions:', error);
  }
  
  // Insertar códigos promo de ejemplo si no existen
  try {
    const existing = await turso.execute('SELECT COUNT(*) as count FROM promo_codes');
    if (existing.rows[0].count === 0) {
      console.log('\n📝 Insertando códigos promo de ejemplo...');
      
      const codes = [
        { code: 'LIMITO2024', type: 'access', value: 0, expires: '2026-12-31T23:59:00Z' },
        { code: 'FIRST10', type: 'percentage', value: 10, expires: '2025-12-31T23:59:00Z' },
        { code: 'WELCOME5K', type: 'fixed', value: 5000, expires: null }
      ];
      
      for (const c of codes) {
        const expiresAt = c.expires ? Math.floor(new Date(c.expires).getTime() / 1000) : null;
        await turso.execute({
          sql: 'INSERT INTO promo_codes (code, type, value, active, expires_at) VALUES (?, ?, ?, 1, ?)',
          args: [c.code, c.type, c.value, expiresAt]
        });
        console.log(`  ✅ ${c.code} (${c.type})`);
      }
    } else {
      console.log('\n✅ Ya existen códigos promo');
    }
  } catch (error) {
    console.log('❌ Error con promo_codes:', error);
  }
  
  // Verificar settings críticos
  try {
    const settings = await turso.execute("SELECT key FROM settings WHERE key IN ('store_mode', 'password_until', 'background_image')");
    const existingKeys = settings.rows.map(r => r.key);
    
    if (!existingKeys.includes('password_until')) {
      await turso.execute({
        sql: "INSERT INTO settings (key, value) VALUES ('password_until', '')",
        args: []
      });
      console.log('\n✅ Setting password_until inicializado');
    }
    
    if (!existingKeys.includes('background_image')) {
      await turso.execute({
        sql: "INSERT INTO settings (key, value) VALUES ('background_image', '')",
        args: []
      });
      console.log('✅ Setting background_image inicializado');
    }
  } catch (error) {
    console.log('❌ Error verificando settings:', error);
  }
  
  console.log('\n✅ Inicialización completa');
}

initTables().then(() => process.exit(0));
