# Configuración de Google Sheets - Reservations

## Hoja: reservations

Para soportar compras concurrentes sin Redis, el sistema usa Google Sheets como fuente de verdad para reservas de stock.

### Estructura de la Hoja

Crear una hoja llamada `reservations` con las siguientes columnas:

| Columna | Nombre | Tipo | Descripción |
|---------|--------|------|-------------|
| A | productId | string | ID del producto (ej: limito-snap-001) |
| B | color | string | Nombre del color (ej: Negro, Blanco) |
| C | quantity | number | Cantidad reservada |
| D | expiresAt | number | Timestamp de expiración (milisegundos) |
| E | sessionId | string | ID de sesión del usuario |

### Encabezados (Fila 1)

```
productId | color | quantity | expiresAt | sessionId
```

### Ejemplo de Datos (Fila 2+)

```
limito-snap-001 | Negro | 2 | 1738368000000 | sess_abc123xyz
limito-snap-001 | Blanco | 1 | 1738368900000 | sess_def456uvw
limito-dad-002 | Rojo | 3 | 1738369800000 | sess_ghi789rst
```

### Funcionamiento

1. **Reserva**: Cuando un usuario agrega al carrito, se crea/actualiza una fila con su sessionId
2. **Expiración**: Las reservas expiran automáticamente después de 15 minutos (900000ms)
3. **Limpieza**: El sistema limpia reservas expiradas antes de cada operación
4. **Concurrencia**: Múltiples usuarios pueden comprar simultáneamente sin conflictos
5. **Liberación**: Al completar compra o abandonar carrito, se elimina la reserva

### Ventajas vs Archivo Local

- ✅ Persistente entre deploys
- ✅ Sincronizado entre múltiples instancias
- ✅ No requiere Redis (sin costos adicionales)
- ✅ Visible y auditable desde Google Sheets
- ✅ Backup automático de Google

### Permisos Requeridos

El service account debe tener permisos de **Editor** en el spreadsheet para:
- Leer reservas existentes
- Crear nuevas reservas
- Actualizar reservas existentes
- Eliminar reservas expiradas

### Monitoreo

Puedes ver las reservas activas directamente en Google Sheets para:
- Detectar problemas de stock
- Auditar reservas
- Limpiar manualmente si es necesario
