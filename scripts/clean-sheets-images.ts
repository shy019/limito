import { readSheet, updateSheet } from '../lib/google-sheets';

async function cleanSheetsImages() {
  try {
    console.log('Leyendo productos de Google Sheets...');
    const rows = await readSheet('products', 'A2:I100');
    
    console.log(`Encontrados ${rows.length} productos`);
    
    const cleanedRows = rows.map((row, index) => {
      if (!row[0]) return row;
      
      try {
        const colorsJson = row[7];
        if (colorsJson) {
          const colors = JSON.parse(String(colorsJson));
          const cleanedColors = colors.map((color: any) => ({
            ...color,
            images: [] // Limpiar todas las imágenes
          }));
          
          row[7] = JSON.stringify(cleanedColors);
          console.log(`✓ Limpiado producto: ${row[1]}`);
        }
      } catch (error) {
        console.error(`Error procesando fila ${index + 2}:`, error);
      }
      
      return row;
    });
    
    console.log('\nActualizando Google Sheets...');
    await updateSheet('products', 'A2:I100', cleanedRows);
    
    console.log('✓ Google Sheets actualizado correctamente');
    console.log('\nTodas las imágenes base64 han sido eliminadas.');
    console.log('Ahora puedes subir nuevas imágenes desde el panel de admin.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanSheetsImages();
