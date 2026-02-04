# LIMITØ - E-commerce de Gorras Edición Limitada

Plataforma de e-commerce para venta de gorras de edición limitada en Colombia.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Turso (SQLite database)
- Resend (emails)
- PayU (pagos)
- Cloudinary (imágenes)

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
├── turso-*.ts       # Operaciones Turso
├── payu.ts          # Integración PayU
├── cloudinary.ts    # Gestión imágenes
└── email.ts         # Servicio emails
```

## Licencia

Privado - LIMITØ © 2025
