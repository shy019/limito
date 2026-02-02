import { ShoppingCart, TrendingUp, Package } from 'lucide-react';
import type { Stats } from '@/types/admin';

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-6 h-6" style={{ color: '#5433EB' }} />
          <h3 className="text-sm font-bold" style={{ color: '#6B6B6B' }}>Total Órdenes</h3>
        </div>
        <p className="text-4xl font-black" style={{ color: '#0A0A0A' }}>{stats.totalOrders}</p>
      </div>
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6" style={{ color: '#16A34A' }} />
          <h3 className="text-sm font-bold" style={{ color: '#6B6B6B' }}>Ingresos Totales</h3>
        </div>
        <p className="text-4xl font-black" style={{ color: '#0A0A0A' }}>${stats.totalRevenue.toLocaleString()}</p>
      </div>
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-6 h-6" style={{ color: '#ffd624' }} />
          <h3 className="text-sm font-bold" style={{ color: '#6B6B6B' }}>Pendientes</h3>
        </div>
        <p className="text-4xl font-black" style={{ color: '#0A0A0A' }}>{stats.pendingOrders}</p>
      </div>
    </div>
  );
}
