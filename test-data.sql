-- Insertar producto de prueba
INSERT INTO products (id, name, edition, type, description, description_en, available, colors, features) 
VALUES (
  'limito-test-001',
  'LIMITØ Classic',
  '001',
  'snapback',
  'Gorra clásica de edición limitada',
  'Limited edition classic cap',
  1,
  '[]',
  'Ajustable,Premium,Edición Limitada'
);

-- Insertar colores
INSERT INTO product_colors (product_id, name, hex, price, stock, images) 
VALUES 
  ('limito-test-001', 'Negro', '#000000', 150000, 5, '["https://res.cloudinary.com/dm9wulgnq/image/upload/v1/limito/test-negro-1.jpg"]'),
  ('limito-test-001', 'Rojo', '#FF0000', 150000, 2, '["https://res.cloudinary.com/dm9wulgnq/image/upload/v1/limito/test-rojo-1.jpg"]');

-- Verificar
SELECT p.name, pc.name as color, pc.stock 
FROM products p 
JOIN product_colors pc ON p.id = pc.product_id;
