#!/bin/bash

for file in app/password/page.tsx app/contact/page.tsx app/policies/page.tsx app/page.tsx; do
  if [ -f "$file" ]; then
    # Agregar import
    if ! grep -q "store-config-cache" "$file"; then
      sed -i '' "1a\\
import { fetchStoreConfig } from '@/lib/store-config-cache';\\
" "$file"
    fi
    
    # Reemplazar fetch con fetchStoreConfig
    sed -i '' "s/fetch('\/api\/store-config'[^)]*)/fetchStoreConfig()/g" "$file"
    sed -i '' "s/\.then(res => res\.json())/\.then(data => data)/g" "$file"
    
    echo "✅ $file"
  fi
done
