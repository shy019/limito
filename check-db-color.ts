import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSettingsFromTurso } from './lib/turso-products-v2';

async function checkColor() {
  const settings = await getSettingsFromTurso();
  console.log('Color actual:', settings?.accent_color);
  console.log('Todos los settings:', settings);
}

checkColor();
