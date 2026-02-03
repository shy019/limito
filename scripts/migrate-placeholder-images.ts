import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrateImages() {
  console.log('🔄 Migrando imágenes placeholder a Cloudinary...\n');
  
  // Obtener todos los colores con imágenes placeholder
  const result = await turso.execute(
    "SELECT id, product_id, name, images FROM product_colors WHERE images LIKE '%placeholder%'"
  );
  
  if (result.rows.length === 0) {
    console.log('✅ No hay imágenes placeholder para migrar');
    return;
  }
  
  console.log(`📦 Encontrados ${result.rows.length} colores con placeholder\n`);
  
  for (const row of result.rows) {
    const images = JSON.parse(row.images as string);
    const colorName = row.name as string;
    const productId = row.product_id as string;
    
    console.log(`⚠️  ${productId} - ${colorName}: Usando placeholder`);
    console.log(`   Acción requerida: Subir imagen real desde el admin panel\n`);
  }
  
  console.log('💡 Recomendación:');
  console.log('   1. Ve al panel admin');
  console.log('   2. Edita cada producto');
  console.log('   3. Sube imágenes reales para cada color');
  console.log('   4. Las imágenes se optimizarán automáticamente (WebP, deduplicación)');
}

migrateImages().then(() => process.exit(0));
