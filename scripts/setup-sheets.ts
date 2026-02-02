import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SPREADSHEET_ID = '1NZOl7xjQIurs1ILrkZTJqV4QKTCtSMdb2b9TH0xpg_k';

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

async function setupSheets() {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient as any });

  // 1. Config sheet
  console.log('Creating config sheet...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'config!A1:B10',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['key', 'value'],
        ['store_mode', 'password'],
        ['password_until', ''],
        ['stripe_public_key', 'pk_test_YOUR_KEY_HERE'],
        ['stripe_secret_key', 'sk_test_YOUR_KEY_HERE'],
        ['admin_password', 'admin123'],
        ['promo_password', 'LMT#2024$9XP'],
      ],
    },
  });

  // 2. Promo codes sheet
  console.log('Creating promo_codes sheet...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'promo_codes!A1:G10',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['code', 'type', 'value', 'active', 'expiresAt', 'maxUses', 'currentUses'],
        ['LIMITO2024', 'access', '0', 'TRUE', '2026-12-31T23:59:59Z', '', '0'],
        ['FIRST10', 'percentage', '10', 'TRUE', '2025-12-31T23:59:59Z', '100', '0'],
        ['WELCOME5K', 'fixed', '5000', 'TRUE', '', '', '0'],
      ],
    },
  });

  // 3. Shipping rates sheet
  console.log('Creating shipping_rates sheet...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'shipping_rates!A1:E20',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['city', 'department', 'price', 'delivery_days_es', 'delivery_days_en'],
        ['Bogotá', 'Cundinamarca', '15000', '2-3 días hábiles', '2-3 business days'],
        ['Medellín', 'Antioquia', '18000', '3-4 días hábiles', '3-4 business days'],
        ['Cali', 'Valle del Cauca', '18000', '3-4 días hábiles', '3-4 business days'],
        ['Barranquilla', 'Atlántico', '20000', '4-5 días hábiles', '4-5 business days'],
        ['Cartagena', 'Bolívar', '20000', '4-5 días hábiles', '4-5 business days'],
      ],
    },
  });

  // 4. Products sheet
  console.log('Creating products sheet...');
  const productsFile = JSON.parse(fs.readFileSync('./public/data/products.json', 'utf-8'));
  const productsData = productsFile.products;
  const productRows = [
    ['id', 'name', 'edition', 'type', 'description', 'descriptionEn', 'price', 'stock', 'available', 'colors', 'features'],
  ];
  
  productsData.forEach((product: any) => {
    productRows.push([
      product.id,
      product.name,
      product.edition || '001',
      product.type || 'snapback',
      product.description,
      product.descriptionEn || product.description,
      (product.price || 0).toString(),
      (product.stock || 0).toString(),
      product.available ? 'TRUE' : 'FALSE',
      JSON.stringify(product.colors || []),
      (product.features || []).join(','),
    ]);
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'products!A1:K10',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: productRows,
    },
  });

  // 5. Orders sheet headers
  console.log('Setting up orders sheet headers...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'orders!A1:O1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['order_id', 'date', 'customer_name', 'email', 'phone', 'address', 'city', 'department', 'products', 'quantity', 'total', 'status', 'stripe_payment_id', 'carrier', 'tracking_number'],
      ],
    },
  });

  // 6. Customers sheet headers
  console.log('Setting up customers sheet headers...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'customers!A1:I1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['customer_id', 'name', 'email', 'phone', 'address', 'city', 'department', 'registration_date', 'total_purchases'],
      ],
    },
  });

  // 7. Inventory sheet headers
  console.log('Setting up inventory sheet headers...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'inventory!A1:G1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['product_id', 'name', 'edition', 'price', 'stock', 'available', 'last_updated'],
      ],
    },
  });

  // 8. Reservations sheet headers
  console.log('Setting up reservations sheet headers...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'reservations!A1:E1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        ['productId', 'color', 'quantity', 'expiresAt', 'sessionId'],
      ],
    },
  });

  console.log('✅ All sheets configured successfully!');
}

setupSheets().catch(console.error);
