import { config } from 'dotenv';
config({ path: '.env.local' });

import { updateSettingInTurso } from './lib/turso-products-v2';

async function setDefaultColor() {
  await updateSettingInTurso('accent_color', '#D4AF37', 'admin');
  console.log('✅ Color default establecido');
}

setDefaultColor();
