// Test de Turso
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function testTurso() {
  console.log('🧪 Probando Turso...\n');

  // 1. Obtener productos
  console.log('1️⃣ Obteniendo productos...');
  const start1 = Date.now();
  const products = await tursoClient.execute(`
    SELECT p.name, pc.name as color, pc.stock, pc.price
    FROM products p
    JOIN product_colors pc ON p.id = pc.product_id
  `);
  const time1 = Date.now() - start1;
  console.log(`   ✅ ${products.rows.length} colores encontrados en ${time1}ms`);
  products.rows.forEach(row => {
    console.log(`      - ${row.name} ${row.color}: ${row.stock} unidades ($${row.price})`);
  });

  // 2. Crear reserva
  console.log('\n2️⃣ Creando reserva...');
  const sessionId = 'test-session-' + Date.now();
  const start2 = Date.now();
  await tursoClient.execute({
    sql: `INSERT INTO reservations (product_id, color, quantity, expires_at, session_id) 
          VALUES (?, ?, ?, ?, ?)`,
    args: ['limito-test-001', 'Negro', 2, Date.now() + 900000, sessionId]
  });
  const time2 = Date.now() - start2;
  console.log(`   ✅ Reserva creada en ${time2}ms`);

  // 3. Calcular stock disponible
  console.log('\n3️⃣ Calculando stock disponible...');
  const start3 = Date.now();
  
  const stockResult = await tursoClient.execute({
    sql: 'SELECT stock FROM product_colors WHERE product_id = ? AND name = ?',
    args: ['limito-test-001', 'Negro']
  });
  const totalStock = Number(stockResult.rows[0].stock);

  const reservedResult = await tursoClient.execute({
    sql: `SELECT COALESCE(SUM(quantity), 0) as reserved 
          FROM reservations 
          WHERE product_id = ? AND color = ? AND expires_at > ?`,
    args: ['limito-test-001', 'Negro', Date.now()]
  });
  const reserved = Number(reservedResult.rows[0].reserved);
  const available = totalStock - reserved;
  const time3 = Date.now() - start3;
  
  console.log(`   ✅ Stock calculado en ${time3}ms`);
  console.log(`      Total: ${totalStock}, Reservado: ${reserved}, Disponible: ${available}`);

  // 4. Limpiar reserva de prueba
  console.log('\n4️⃣ Limpiando reserva de prueba...');
  await tursoClient.execute({
    sql: 'DELETE FROM reservations WHERE session_id = ?',
    args: [sessionId]
  });
  console.log('   ✅ Limpieza completada');

  console.log('\n🎉 Todas las pruebas pasaron!');
  console.log(`\n⚡ Rendimiento promedio: ${Math.round((time1 + time2 + time3) / 3)}ms`);
}

testTurso()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
