import fs from 'fs';
import path from 'path';

const translations: Record<string, { es: string; en: string }> = {
  // Colores
  'Negro': { es: 'Negro', en: 'Black' },
  'Blanco': { es: 'Blanco', en: 'White' },
  'Beige': { es: 'Beige', en: 'Beige' },
  'Verde': { es: 'Verde', en: 'Green' },
  'Azul': { es: 'Azul', en: 'Blue' },
  'Rojo': { es: 'Rojo', en: 'Red' },
  'Amarillo': { es: 'Amarillo', en: 'Yellow' },
  'Gris': { es: 'Gris', en: 'Gray' },
  'Rosa': { es: 'Rosa', en: 'Pink' },
  'Naranja': { es: 'Naranja', en: 'Orange' },
  'Morado': { es: 'Morado', en: 'Purple' },
  'Negro/Blanco': { es: 'Negro/Blanco', en: 'Black/White' },
  
  // Features
  'Edición limitada': { es: 'Edición limitada', en: 'Limited edition' },
  'Numeración individual': { es: 'Numeración individual', en: 'Individual numbering' },
  'Logo bordado': { es: 'Logo bordado', en: 'Embroidered logo' },
  'Ajustable': { es: 'Ajustable', en: 'Adjustable' },
  'Malla transpirable': { es: 'Malla transpirable', en: 'Breathable mesh' },
  '100% algodón': { es: '100% algodón', en: '100% cotton' },
  'Lavable': { es: 'Lavable', en: 'Washable' },
  'Diseño exclusivo': { es: 'Diseño exclusivo', en: 'Exclusive design' },
  'Premium': { es: 'Premium', en: 'Premium' },
  'Bordado premium': { es: 'Bordado premium', en: 'Premium embroidery' },
};

export function autoTranslate(keys: string[]) {
  const messagesDir = path.join(process.cwd(), 'messages');
  const esPath = path.join(messagesDir, 'es.json');
  const enPath = path.join(messagesDir, 'en.json');

  const esMessages = JSON.parse(fs.readFileSync(esPath, 'utf-8'));
  const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

  let updated = false;

  keys.forEach(key => {
    // Si no existe traducción, usar el texto original como fallback
    if (!esMessages.catalog[key]) {
      if (translations[key]) {
        esMessages.catalog[key] = translations[key].es;
        enMessages.catalog[key] = translations[key].en;
      } else {
        // Fallback: usar el mismo texto en ambos idiomas
        esMessages.catalog[key] = key;
        enMessages.catalog[key] = key;
      }
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(esPath, JSON.stringify(esMessages, null, 2), 'utf-8');
    fs.writeFileSync(enPath, JSON.stringify(enMessages, null, 2), 'utf-8');
  }

  return updated;
}
