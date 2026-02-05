import type { Order } from '@/types/admin';

interface OrderCardProps {
  order: Order;
  onUpdate: (orderId: string, updates: Partial<Order>) => void;
}

export default function OrderCard({ order, onUpdate }: OrderCardProps) {
  return (
    <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-black mb-1" style={{ color: '#0A0A0A' }}>#{order.id}</h3>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>{new Date(order.createdAt).toLocaleString('es-CO')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: '#0A0A0A' }}>${order.total.toLocaleString()}</p>
          <select
            value={order.status}
            onChange={(e) => onUpdate(order.id, { status: e.target.value as Order['status'] })}
            className="mt-2 px-3 py-1 text-sm font-bold rounded-lg border-2"
            style={{
              borderColor: order.status === 'pending' ? 'var(--accent-color, #ffd624)' : order.status === 'shipped' ? '#5433EB' : '#16A34A',
              color: order.status === 'pending' ? '#000' : '#fff',
              backgroundColor: order.status === 'pending' ? 'var(--accent-color, #ffd624)' : order.status === 'shipped' ? '#5433EB' : '#16A34A'
            }}
          >
            <option value="pending">Pendiente</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: '#6B6B6B' }}>Cliente</p>
          <p className="font-bold" style={{ color: '#0A0A0A' }}>{order.customerName}</p>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>{order.customerEmail}</p>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>{order.customerPhone}</p>
        </div>
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: '#6B6B6B' }}>Dirección</p>
          <p className="text-sm" style={{ color: '#0A0A0A' }}>{order.shippingAddress.line1}</p>
          <p className="text-sm" style={{ color: '#0A0A0A' }}>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-bold mb-2" style={{ color: '#6B6B6B' }}>Productos</p>
        {order.items.map((item, idx) => (
          <p key={idx} className="text-sm" style={{ color: '#0A0A0A' }}>
            {item.name} - {item.color} x{item.quantity}
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Número de guía"
          defaultValue={order.trackingNumber || ''}
          onBlur={(e) => e.target.value && onUpdate(order.id, { trackingNumber: e.target.value, carrier: 'Coordinadora' })}
          className="flex-1 px-4 py-2 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black text-sm font-bold"
        />
        <select
          defaultValue={order.carrier || 'Coordinadora'}
          onChange={(e) => onUpdate(order.id, { carrier: e.target.value })}
          className="px-4 py-2 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black text-sm font-bold"
        >
          <option value="Coordinadora">Coordinadora</option>
          <option value="Servientrega">Servientrega</option>
          <option value="Deprisa">Deprisa</option>
          <option value="Interrapidisimo">Interrapidisimo</option>
        </select>
      </div>
    </div>
  );
}
