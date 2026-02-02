# LIMITØ - E-commerce de Gorras Edición Limitada

Plataforma de e-commerce para venta de gorras de edición limitada en Colombia.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Google Sheets (base de datos)
- Resend (emails)
- PayU (pagos)

## Instalación

```bash
npm install
cp .env.local.example .env.local
# Editar .env.local con credenciales
npm run dev
```

## Variables de Entorno

Ver `.env.local.example` para la lista completa.

## Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run test         # Tests unitarios
npm run test:e2e     # Tests E2E
npm run setup-sheets # Configurar Google Sheets
```

## Estructura

```
app/
├── admin/           # Panel administrativo
├── api/             # API routes
├── cart/            # Carrito
├── catalog/         # Catálogo
├── checkout/        # Proceso de pago
├── contact/         # Contacto
├── password/        # Acceso con contraseña
├── policies/        # Políticas legales
└── soldout/         # Página agotado

lib/
├── cart.ts          # Lógica carrito
├── google-sheets.ts # Conexión Sheets
├── payu.ts          # Integración PayU
└── email.ts         # Servicio emails
```

## Licencia

Privado - LIMITØ © 2025
