// Script para migrar datos de Google Sheets a Turso
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';
import { getProductsFromSheets } from '../lib/sheets-products';

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrateProducts() {
  console.log('📦 Migrando productos de Sheets a Turso...');
  
  const result = await getProductsFromSheets(false);
  
  if (!result.success || !result.data) {
    console.error('❌ Error al obtener productos de Sheets');
    return;
  }

  const products = result.data;
  console.log(`✅ Encontrados ${products.length} productos en Sheets`);

  for (const product of products) {
    try {
      // Insertar producto
      await tursoClient.execute({
        sql: `INSERT OR REPLACE INTO products (id, name, edition, type, description, description_en, available, colors, features) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          product.id,
          product.name,
          product.edition || '001',
          product.type || 'snapback',
          product.description || '',
          product.descriptionEn || '',
          product.available ? 1 : 0,
          JSON.stringify(product.colors),
          product.features?.join(',') || ''
        ]
      });

      // Insertar colores
      for (const color of product.colors) {
        await tursoClient.execute({
          sql: `INSERT INTO product_colors (product_id, name, hex, price, stock, images) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            product.id,
            color.name,
            color.hex,
            color.price,
            color.stock || 0,
            JSON.stringify(color.images || [])
          ]
        });
      }

      console.log(`  ✓ Migrado: ${product.name}`);
    } catch (error) {
      console.error(`  ✗ Error migrando ${product.name}:`, error);
    }
  }

  console.log('✅ Migración de productos completada');
}

async function main() {
  try {
    await migrateProducts();
    console.log('\n🎉 Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

main();
