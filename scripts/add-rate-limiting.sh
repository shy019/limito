#!/bin/bash

FILES=(
  "app/api/admin/settings/route.ts"
  "app/api/admin/products/all/route.ts"
  "app/api/admin/products/route.ts"
  "app/api/admin/orders/route.ts"
  "app/api/admin/orders/update/route.ts"
  "app/api/checkout/route.ts"
  "app/api/newsletter/route.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Agregar import si no existe
    if ! grep -q "rateLimit" "$file"; then
      sed -i '' "1a\\
import { rateLimit } from '@/lib/rate-limit';\\
" "$file"
      
      # Agregar rate limit al inicio de cada función GET/POST
      sed -i '' '/export async function GET/a\
  const ip = req.headers.get("x-forwarded-for") || "unknown";\
  if (!rateLimit(`api-${ip}`, 30, 60000).success) {\
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });\
  }\
' "$file"
      
      sed -i '' '/export async function POST/a\
  const ip = req.headers.get("x-forwarded-for") || "unknown";\
  if (!rateLimit(`api-${ip}`, 20, 60000).success) {\
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });\
  }\
' "$file"
      
      echo "✅ $file"
    fi
  fi
done
