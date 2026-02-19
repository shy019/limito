# LIMITØ — Checklist de Lanzamiento

## 1. Integración PayU

### 1.1 Obtener credenciales de PayU
- [ ] Crear cuenta en PayU Latam (https://merchants.payulatam.com)
- [ ] Obtener `PAYU_MERCHANT_ID`
- [ ] Obtener `PAYU_API_KEY`
- [ ] Obtener `PAYU_API_LOGIN`
- [ ] Obtener `PAYU_ACCOUNT_ID`

### 1.2 Configurar variables de entorno
Agregar en `.env.local` (y en el hosting de producción):
```
PAYU_MERCHANT_ID=tu_merchant_id
PAYU_API_KEY=tu_api_key
PAYU_API_LOGIN=tu_api_login
PAYU_ACCOUNT_ID=tu_account_id
PAYU_TEST_MODE=true          # cambiar a false en producción
NEXT_PUBLIC_BASE_URL=https://tudominio.com
```

### 1.3 Probar en sandbox
- [ ] Configurar `PAYU_TEST_MODE=true`
- [ ] Hacer una compra completa de prueba
- [ ] Verificar que el formulario redirige a PayU checkout
- [ ] Verificar que la orden se crea en la DB con status `pending`
- [ ] Verificar que el webhook (`/api/webhooks/payu`) recibe la confirmación
- [ ] Verificar que la orden cambia a `paid` cuando se aprueba
- [ ] Verificar que el stock se descuenta con `confirmSaleInTurso`
- [ ] Verificar las páginas de respuesta: `/checkout/success`, `/checkout/failed`, `/checkout/pending`
- [ ] Probar pago rechazado — verificar que la orden queda como `declined`
- [ ] Probar pago pendiente (PSE) — verificar que queda como `pending`

### 1.4 Validar firma (signature)
- [ ] Verificar que `generateSignature` en `lib/payu.ts` usa el formato correcto: `ApiKey~MerchantId~ReferenceCode~Amount~Currency`
- [ ] Verificar que `validateSignature` en el webhook incluye `transactionState` en la firma de respuesta
- [ ] Probar con la herramienta de verificación de PayU

### 1.5 Configurar webhook en PayU
- [ ] En el panel de PayU, configurar URL de confirmación: `https://tudominio.com/api/webhooks/payu`
- [ ] Verificar que el webhook acepta `POST` con `formData` (no JSON)

### 1.6 Pasar a producción
- [ ] Cambiar `PAYU_TEST_MODE=false`
- [ ] Actualizar `NEXT_PUBLIC_BASE_URL` al dominio real
- [ ] Hacer una compra real de prueba con monto mínimo
- [ ] Verificar flujo completo: carrito → PayU → webhook → orden confirmada

---

## 2. Archivos a modificar cuando tengas las credenciales

| Archivo | Qué hacer |
|---------|-----------|
| `.env.local` | Agregar las 5 variables de PayU |
| `lib/payu.ts` | Ya está listo, solo necesita las env vars |
| `app/api/checkout/payu/route.ts` | Ya está listo |
| `app/api/webhooks/payu/route.ts` | Ya está listo |
| `app/checkout/response/page.tsx` | Verificar que parsea los query params de PayU correctamente |
| `app/checkout/success/page.tsx` | Verificar diseño y mensaje |
| `app/checkout/failed/page.tsx` | Verificar diseño y mensaje |
| `app/checkout/pending/page.tsx` | Verificar diseño y mensaje |

---

## 3. Impuestos (IVA)

- [ ] Revisar cálculo de IVA en `app/api/checkout/payu/route.ts` línea: `const tax = Math.round(total * 0.19)`
- [ ] Confirmar si los productos incluyen IVA o si se suma aparte
- [ ] Si los precios ya incluyen IVA: `tax = Math.round(total - total / 1.19)` y `taxReturnBase = Math.round(total / 1.19)`
- [ ] Si los productos están exentos de IVA: `tax = 0` y `taxReturnBase = 0`

---

## 4. Telegram (notificaciones)

- [ ] Crear bot en Telegram con @BotFather
- [ ] Obtener `TELEGRAM_BOT_TOKEN`
- [ ] Crear grupo/canal y obtener `TELEGRAM_CHAT_ID`
- [ ] Agregar variables en `.env.local`
- [ ] Activar en admin: `telegram_notify_on_sale` y `telegram_notify_on_stock_out`
- [ ] Probar que llegan notificaciones al vender y al agotar stock

---

## 5. Dominio y hosting

- [ ] Configurar dominio en el hosting (Vercel, etc.)
- [ ] Actualizar `NEXT_PUBLIC_BASE_URL` con el dominio final
- [ ] Configurar SSL (HTTPS obligatorio para PayU)
- [ ] Configurar variables de entorno en el hosting

---

## 6. Checks finales antes de lanzar

### Funcionalidad
- [ ] Flujo completo: password → catálogo → modal producto → carrito → checkout → pago
- [ ] Cambio de idioma funciona en todas las páginas
- [ ] Reserva de stock funciona (agregar al carrito reduce disponible)
- [ ] Liberación de stock funciona (quitar del carrito devuelve disponible)
- [ ] Expiración de reservas funciona (stock se libera automáticamente)
- [ ] Página de contacto envía emails correctamente
- [ ] Modo soldout redirige correctamente
- [ ] Modo active permite acceso libre al catálogo
- [ ] Modo password requiere código de acceso

### Mobile
- [ ] Modal de producto scrollea correctamente
- [ ] Footer se ve solo al final del scroll
- [ ] Botón de volver siempre visible
- [ ] Carrito se ve bien y funciona
- [ ] Checkout se ve bien en mobile

### Seguridad
- [ ] Variables de entorno NO están expuestas al cliente (solo `NEXT_PUBLIC_*`)
- [ ] Admin panel requiere autenticación
- [ ] Rate limiting activo en: checkout, reservas, contacto, teléfonos
- [ ] Datos del cliente se encriptan en tránsito (encryptData/decryptFromTransit)
- [ ] Middleware lee modo de la DB, no de cookies

### SEO y legal
- [ ] Página de políticas (`/policies`) tiene contenido completo
- [ ] `robots.ts` y `sitemap.ts` configurados con dominio real
- [ ] Meta tags y Open Graph configurados en `layout.tsx`
- [ ] Favicon actualizado

---

## 7. Post-lanzamiento

- [ ] Monitorear logs de errores (logger)
- [ ] Verificar que webhooks de PayU llegan correctamente
- [ ] Revisar órdenes en admin panel
- [ ] Monitorear stock disponible
- [ ] Configurar alertas de Telegram para ventas y stock agotado
