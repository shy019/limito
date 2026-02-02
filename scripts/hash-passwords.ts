import bcrypt from 'bcryptjs';
import { getConfigFromSheets, saveConfigToSheets } from '../lib/sheets-config';

export async function hashExistingPasswords() {
  const config = await getConfigFromSheets();
  
  if (!config) {
    console.error('No config found');
    return;
  }

  const adminPass = config.admin_password || '';
  const promoPass = config.promo_password || '';

  if (adminPass && adminPass.length < 30) {
    const hashed = await bcrypt.hash(adminPass, 10);
    await saveConfigToSheets('admin_password', hashed);
    console.log('✅ Admin password hashed');
  } else {
    console.log('ℹ️  Admin password already hashed');
  }

  if (promoPass && promoPass.length < 30) {
    const hashed = await bcrypt.hash(promoPass, 10);
    await saveConfigToSheets('promo_password', hashed);
    console.log('✅ Promo password hashed');
  } else {
    console.log('ℹ️  Promo password already hashed');
  }
}

hashExistingPasswords();
