import { ShoppingCart, Package, Settings, Key, Tag, Sliders } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: 'orders' | 'products' | 'config' | 'access' | 'promos' | 'settings';
  sidebarOpen: boolean;
  onTabChange: (tab: 'orders' | 'products' | 'config' | 'access' | 'promos' | 'settings') => void;
  onClose: () => void;
}

export default function AdminSidebar({ activeTab, sidebarOpen, onTabChange, onClose }: AdminSidebarProps) {
  const tabs = [
    { id: 'orders', label: 'Órdenes', icon: ShoppingCart, color: 'purple' },
    { id: 'products', label: 'Productos', icon: Package, color: 'blue' },
    { id: 'config', label: 'Configuración', icon: Settings, color: 'gray' },
    { id: 'settings', label: 'Configuración Avanzada', icon: Sliders, color: 'green' },
    { id: 'access', label: 'Claves de Acceso', icon: Key, color: 'indigo' },
    { id: 'promos', label: 'Códigos de Descuento', icon: Tag, color: 'yellow' },
  ] as const;

  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50" 
          style={{ zIndex: 40 }}
          onClick={onClose}
        />
      )}
      
      <aside 
        className={`fixed top-0 left-0 w-80 shadow-2xl transform transition-all duration-300 rounded-r-3xl border-r-4 border-black ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ zIndex: 50, backgroundColor: '#F5F1E8', height: 'auto', maxHeight: '100vh' }}
      >
        <div className="flex flex-col">
          <nav className="p-4 space-y-2">
            {tabs.filter(tab => tab.id !== activeTab).map((tab) => (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-200 text-gray-700 hover:bg-gray-100 hover:shadow-md hover:scale-105 group"
              >
                <div className={`w-10 h-10 rounded-lg bg-${tab.color}-100 flex items-center justify-center group-hover:bg-${tab.color}-200 transition-all duration-200 shadow-sm`}>
                  <tab.icon className={`w-5 h-5 text-${tab.color}-600`} />
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="p-4">
            <div className="text-sm text-gray-700 text-center font-black bg-white px-4 py-2 rounded-lg shadow-md border-2 border-gray-300">
              <p>{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
