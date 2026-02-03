// Test del flujo completo optimizado
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';
import { 
  getAvailableStockFromTurso, 
  reserveStockInTurso, 
  confirmSaleInTurso,
  getSettingsFromTurso 
} from '../lib/turso-products-v2';

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function testCompleteFlow() {
  console.log('🧪 PRUEBA DE FLUJO COMPLETO\n');
  console.log('='.repeat(70));

  const productId = 'limito-test-001';
  const color = 'Negro';
  const sessionId1 = 'test-session-1-' + Date.now();
  const sessionId2 = 'test-session-2-' + Date.now();

  try {
    // 1. Verificar configuración
    console.log('\n📋 1. CONFIGURACIÓN');
    console.log('-'.repeat(70));
    const settings = await getSettingsFromTurso();
    console.log('  Configuración cargada:');
    Object.entries(settings).forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`);
    });

    // 2. Stock inicial
    console.log('\n📦 2. STOCK INICIAL');
    console.log('-'.repeat(70));
    const initialStock = await getAvailableStockFromTurso(productId, color);
    console.log(`  Stock disponible: ${initialStock} unidades`);

    // 3. Usuario 1 intenta reservar 3 unidades
    console.log('\n👤 3. USUARIO 1 - Reservar 3 unidades');
    console.log('-'.repeat(70));
    const reserve1 = await reserveStockInTurso(productId, color, 3, sessionId1);
    if (reserve1.success) {
      console.log(`  ✅ Reserva exitosa`);
      console.log(`  📊 Stock disponible después: ${reserve1.data?.available}`);
    } else {
      console.log(`  ❌ Error: ${reserve1.error}`);
    }

    // 4. Usuario 2 intenta reservar 3 unidades (debería fallar si solo hay 5)
    console.log('\n👤 4. USUARIO 2 - Reservar 3 unidades');
    console.log('-'.repeat(70));
    const reserve2 = await reserveStockInTurso(productId, color, 3, sessionId2);
    if (reserve2.success) {
      console.log(`  ✅ Reserva exitosa`);
      console.log(`  📊 Stock disponible después: ${reserve2.data?.available}`);
    } else {
      console.log(`  ❌ Error esperado: ${reserve2.error}`);
      console.log(`  📊 Stock disponible: ${reserve2.data?.available}`);
    }

    // 5. Usuario 2 intenta reservar 2 unidades (debería funcionar)
    console.log('\n👤 5. USUARIO 2 - Reservar 2 unidades');
    console.log('-'.repeat(70));
    const reserve2b = await reserveStockInTurso(productId, color, 2, sessionId2);
    if (reserve2b.success) {
      console.log(`  ✅ Reserva exitosa`);
      console.log(`  📊 Stock disponible después: ${reserve2b.data?.available}`);
    } else {
      console.log(`  ❌ Error: ${reserve2b.error}`);
    }

    // 6. Confirmar venta del Usuario 1
    console.log('\n💰 6. CONFIRMAR VENTA - Usuario 1');
    console.log('-'.repeat(70));
    const orderId1 = 'TEST-ORDER-' + Date.now();
    const sale1 = await confirmSaleInTurso(productId, color, 3, orderId1, sessionId1);
    if (sale1.success) {
      console.log(`  ✅ Venta confirmada`);
      console.log(`  📦 Orden: ${orderId1}`);
      
      // Verificar stock real
      const stockAfterSale = await tursoClient.execute({
        sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
        args: [productId, color]
      });
      console.log(`  📊 Stock real después: ${stockAfterSale.rows[0].stock}`);
    } else {
      console.log(`  ❌ Error: ${sale1.error}`);
    }

    // 7. Verificar auditoría
    console.log('\n📝 7. AUDITORÍA');
    console.log('-'.repeat(70));
    const auditResult = await tursoClient.execute({
      sql: `SELECT event_type, quantity_change, stock_before, stock_after, order_id, created_at 
            FROM stock_audit 
            WHERE product_id = ? AND color = ? 
            ORDER BY created_at DESC 
            LIMIT 5`,
      args: [productId, color]
    });
    
    console.log('  Últimos eventos:');
    auditResult.rows.forEach((row, i) => {
      const date = new Date(Number(row.created_at) * 1000).toLocaleString('es-CO');
      console.log(`    ${i + 1}. ${row.event_type}: ${row.quantity_change > 0 ? '+' : ''}${row.quantity_change} (${row.stock_before} → ${row.stock_after}) - ${date}`);
      if (row.order_id) console.log(`       Orden: ${row.order_id}`);
    });

    // 8. Verificar reservas activas
    console.log('\n🔒 8. RESERVAS ACTIVAS');
    console.log('-'.repeat(70));
    const reservationsResult = await tursoClient.execute({
      sql: 'SELECT session_id, quantity, expires_at FROM reservations WHERE product_id = ? AND color = ? AND expires_at > ?',
      args: [productId, color, Date.now()]
    });
    
    if (reservationsResult.rows.length > 0) {
      console.log('  Reservas pendientes:');
      reservationsResult.rows.forEach((row, i) => {
        const expiresIn = Math.round((Number(row.expires_at) - Date.now()) / 1000 / 60);
        console.log(`    ${i + 1}. Sesión: ${String(row.session_id).substring(0, 20)}... - ${row.quantity} unidades - Expira en ${expiresIn} min`);
      });
    } else {
      console.log('  No hay reservas activas');
    }

    // 9. Stock final disponible
    console.log('\n📊 9. STOCK FINAL');
    console.log('-'.repeat(70));
    const finalStock = await getAvailableStockFromTurso(productId, color);
    console.log(`  Stock disponible: ${finalStock} unidades`);
    console.log(`  Stock inicial: ${initialStock}`);
    console.log(`  Diferencia: ${initialStock - finalStock} (vendido: 3, reservado: 2)`);

    // Limpieza
    console.log('\n🧹 10. LIMPIEZA');
    console.log('-'.repeat(70));
    await tursoClient.execute({
      sql: 'DELETE FROM reservations WHERE session_id LIKE ?',
      args: ['test-session-%']
    });
    console.log('  ✅ Reservas de prueba eliminadas');

    console.log('\n' + '='.repeat(70));
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBA:', error);
  }
}

testCompleteFlow()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
