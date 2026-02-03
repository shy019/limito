// Comparación de rendimiento: Sheets vs Turso
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';
import { getProductsFromSheets } from '../lib/sheets-products';
import { getAvailableStockFromSheets, reserveStockInSheets } from '../lib/sheets-reservations';

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function benchmark() {
  console.log('⚡ COMPARACIÓN DE RENDIMIENTO: SHEETS vs TURSO\n');
  console.log('='.repeat(60));

  // Test 1: Obtener productos
  console.log('\n📦 TEST 1: Obtener productos');
  console.log('-'.repeat(60));

  console.log('  Sheets...');
  const sheetsStart1 = Date.now();
  const sheetsProducts = await getProductsFromSheets(false);
  const sheetsTime1 = Date.now() - sheetsStart1;
  console.log(`  ✓ Sheets: ${sheetsTime1}ms (${sheetsProducts.data?.length || 0} productos)`);

  console.log('  Turso...');
  const tursoStart1 = Date.now();
  const tursoProducts = await tursoClient.execute(`
    SELECT COUNT(DISTINCT p.id) as total
    FROM products p
    WHERE p.available = 1
  `);
  const tursoTime1 = Date.now() - tursoStart1;
  console.log(`  ✓ Turso: ${tursoTime1}ms (${tursoProducts.rows[0].total} productos)`);

  const improvement1 = Math.round((sheetsTime1 / tursoTime1) * 10) / 10;
  console.log(`  🚀 Turso es ${improvement1}x más rápido`);

  // Test 2: Crear reserva
  console.log('\n🔒 TEST 2: Crear reserva');
  console.log('-'.repeat(60));

  const sessionId = 'benchmark-' + Date.now();

  console.log('  Sheets...');
  const sheetsStart2 = Date.now();
  await reserveStockInSheets('limito-test-001', 'Negro', 1, sessionId + '-sheets');
  const sheetsTime2 = Date.now() - sheetsStart2;
  console.log(`  ✓ Sheets: ${sheetsTime2}ms`);

  console.log('  Turso...');
  const tursoStart2 = Date.now();
  await tursoClient.execute({
    sql: `INSERT INTO reservations (product_id, color, quantity, expires_at, session_id) 
          VALUES (?, ?, ?, ?, ?)`,
    args: ['limito-test-001', 'Negro', 1, Date.now() + 900000, sessionId + '-turso']
  });
  const tursoTime2 = Date.now() - tursoStart2;
  console.log(`  ✓ Turso: ${tursoTime2}ms`);

  const improvement2 = Math.round((sheetsTime2 / tursoTime2) * 10) / 10;
  console.log(`  🚀 Turso es ${improvement2}x más rápido`);

  // Test 3: Calcular stock disponible
  console.log('\n📊 TEST 3: Calcular stock disponible');
  console.log('-'.repeat(60));

  console.log('  Sheets...');
  const sheetsStart3 = Date.now();
  await getAvailableStockFromSheets('limito-test-001', 'Negro', 5);
  const sheetsTime3 = Date.now() - sheetsStart3;
  console.log(`  ✓ Sheets: ${sheetsTime3}ms`);

  console.log('  Turso...');
  const tursoStart3 = Date.now();
  const stockResult = await tursoClient.execute({
    sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
    args: ['limito-test-001', 'Negro']
  });
  const reservedResult = await tursoClient.execute({
    sql: `SELECT COALESCE(SUM(quantity), 0) as reserved 
          FROM reservations 
          WHERE product_id = ? AND color = ? AND expires_at > ?`,
    args: ['limito-test-001', 'Negro', Date.now()]
  });
  const tursoTime3 = Date.now() - tursoStart3;
  console.log(`  ✓ Turso: ${tursoTime3}ms`);

  const improvement3 = Math.round((sheetsTime3 / tursoTime3) * 10) / 10;
  console.log(`  🚀 Turso es ${improvement3}x más rápido`);

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📈 RESUMEN');
  console.log('='.repeat(60));

  const avgSheets = Math.round((sheetsTime1 + sheetsTime2 + sheetsTime3) / 3);
  const avgTurso = Math.round((tursoTime1 + tursoTime2 + tursoTime3) / 3);
  const avgImprovement = Math.round((avgSheets / avgTurso) * 10) / 10;

  console.log(`\n  Sheets promedio:  ${avgSheets}ms`);
  console.log(`  Turso promedio:   ${avgTurso}ms`);
  console.log(`\n  🎉 Turso es ${avgImprovement}x más rápido en promedio`);

  // Experiencia de usuario
  console.log('\n👤 EXPERIENCIA DE USUARIO');
  console.log('='.repeat(60));
  console.log(`  Agregar al carrito con Sheets: ~${Math.round(avgSheets / 1000)}s`);
  console.log(`  Agregar al carrito con Turso:  ~${Math.round(avgTurso / 1000)}s`);
  
  if (avgSheets > 1000) {
    console.log(`\n  ⚠️  Sheets: Usuario percibe LENTITUD`);
  }
  if (avgTurso < 500) {
    console.log(`  ✅ Turso: Usuario percibe INSTANTANEIDAD`);
  }

  // Limpieza
  console.log('\n🧹 Limpiando datos de prueba...');
  await tursoClient.execute({
    sql: 'DELETE FROM reservations WHERE session_id LIKE ?',
    args: [sessionId + '%']
  });
  console.log('  ✓ Limpieza completada\n');
}

benchmark()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
