'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Package, LogOut, Upload, Key, Tag, CheckCircle, XCircle, Calendar, Percent, DollarSign, Menu } from 'lucide-react';
import type { Product } from '@/lib/products';
import type { StoreMode } from '@/lib/store-config';
import type { Order, PromoCode, Stats } from '@/types/admin';
import LoadingScreen from '@/components/LoadingScreen';
import Toast from '@/components/Toast';
import StatsCards from '@/components/admin/StatsCards';
import OrderCard from '@/components/admin/OrderCard';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdvancedSettings from '@/components/admin/AdvancedSettings';
import { useBackground } from '@/contexts/BackgroundContext';

export default function AdminPage() {
  const { setBackgroundImage, accentColor, setAccentColor } = useBackground();
  const [authenticated, setAuthenticated] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'config' | 'access' | 'promos' | 'settings'>('orders');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [pendingImages, setPendingImages] = useState<Record<string, string[]>>({});

  const [storeMode, setStoreMode] = useState<StoreMode>('password');
  const [passwordUntil, setPasswordUntil] = useState('');
  const [newAccessCode, setNewAccessCode] = useState('');
  const [newAccessExpiry, setNewAccessExpiry] = useState('');
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [newPromoValue, setNewPromoValue] = useState(0);
  const [newPromoExpiry, setNewPromoExpiry] = useState('');
  const [accessCodes, setAccessCodes] = useState<PromoCode[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadData = async () => {
    if (isLoadingData) return; // Prevenir llamadas duplicadas
    try {
      setIsLoadingData(true);
      const res = await fetch('/api/admin/products/all?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setProducts(data.products || []);
      await loadOrders();
      await loadStoreConfig();
    } catch {
      setToast({ message: 'Error al cargar datos', type: 'error' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const hasValidated = useRef(false);

  useEffect(() => {
    if (hasValidated.current) return; // Prevenir segunda ejecución
    hasValidated.current = true;
    
    const validate = async () => {
      try {
        const res = await fetch('/api/admin/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (data.valid) {
          setAuthenticated(true);
          loadData();
        }
        setTimeout(() => setPageLoading(false), 100);
      } catch (err) {
        console.error('Validation error:', err);
        setTimeout(() => setPageLoading(false), 100);
      }
    };
    
    validate();
  }, []);

  // Renovar token cada 5 minutos mientras el usuario esté activo
  useEffect(() => {
    if (!authenticated) return;

    const renewToken = async () => {
      try {
        await fetch('/api/admin/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('Token renewal error:', err);
      }
    };

    const interval = setInterval(renewToken, 5 * 60 * 1000); // Cada 5 minutos
    return () => clearInterval(interval);
  }, [authenticated]);

  // Recargar códigos cuando cambies a esas tabs
  useEffect(() => {
    if (authenticated && (activeTab === 'access' || activeTab === 'promos')) {
      loadStoreConfig();
    }
  }, [activeTab, authenticated]);

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      setOrders(data.orders || []);

      const totalRevenue = data.orders.reduce((sum: number, o: Order) => sum + o.total, 0);
      const pendingOrders = data.orders.filter((o: Order) => o.status === 'pending').length;
      setStats({
        totalOrders: data.orders.length,
        totalRevenue,
        pendingOrders
      });
    } catch {
      setToast({ message: 'Error al cargar órdenes', type: 'error' });
    }
  };

  const loadStoreConfig = async () => {
    try {
      const res = await fetch('/api/store-config');
      const data = await res.json();
      setStoreMode(data.config.mode);
      setPasswordUntil(data.config.passwordUntil || '');

      const promoRes = await fetch('/api/admin/config?action=get_promo_codes');
      if (promoRes.ok) {
        const promoData = await promoRes.json();
        const allCodes = promoData.codes?.data || promoData.codes || [];
        setAccessCodes(allCodes.filter((c: PromoCode) => c.type === 'access'));
        setPromoCodes(allCodes.filter((c: PromoCode) => c.type !== 'access'));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveStoreSettings = async () => {
    if (storeMode === 'password' && !passwordUntil) {
      setToast({ message: 'Debes seleccionar una fecha para el modo password', type: 'error' });
      return;
    }
    
    // Confirmación para cambios críticos
    if (storeMode === 'soldout') {
      if (!confirm('⚠️ ¿Estás seguro de cambiar a modo AGOTADO?\n\nLos usuarios verán la página de agotado y no podrán comprar.')) {
        return;
      }
    }
    
    if (storeMode === 'maintenance') {
      if (!confirm('⚠️ ¿Estás seguro de activar modo MANTENIMIENTO?\n\nLos usuarios no podrán acceder a la tienda.')) {
        return;
      }
    }
    
    try {
      await fetch('/api/store-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: storeMode,
          passwordUntil: storeMode === 'password' ? passwordUntil : null,
        }),
      });
      await loadStoreConfig();
      setToast({ message: 'Configuración guardada correctamente', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error al guardar configuración', type: 'error' });
    }
  };

  const updateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      await fetch('/api/admin/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...updates }),
      });
      await loadOrders();
    } catch {
      setToast({ message: 'Error al actualizar orden', type: 'error' });
    }
  };

  const startEdit = (productId: string) => {
    const freshProduct = products.find(p => p.id === productId);
    if (freshProduct) {
      setEditingProduct(productId);
      const form = JSON.parse(JSON.stringify(freshProduct));
      if (!Array.isArray(form.colors)) {
        form.colors = [];
      }
      setEditForm(form);
    }
  };

  const cancelEdit = () => {
    setPendingImages({});
    setEditingProduct(null);
    setEditForm({});
  };

  const saveProduct = async () => {
    // Validar que tenga nombre
    if (!editForm.name?.trim()) {
      setToast({ message: 'El producto debe tener un nombre', type: 'error' });
      return;
    }

    // Validar que tenga al menos un color
    if (!Array.isArray(editForm.colors) || editForm.colors.length === 0) {
      setToast({ message: 'El producto debe tener al menos un color', type: 'error' });
      return;
    }

    // Validar que cada color tenga precio y stock
    for (const color of editForm.colors) {
      if (!color.price || color.price <= 0) {
        setToast({ message: `El color "${color.name}" debe tener un precio válido`, type: 'error' });
        return;
      }
      if (color.stock === undefined || color.stock < 0) {
        setToast({ message: `El color "${color.name}" debe tener stock definido (puede ser 0)`, type: 'error' });
        return;
      }
    }

    // Validar nombre de producto duplicado
    const duplicateName = products.find(p => 
      p.id !== editForm.id && 
      p.name.toLowerCase().trim() === editForm.name?.toLowerCase().trim()
    );
    if (duplicateName) {
      setToast({ message: `Ya existe un producto con el nombre: ${editForm.name}`, type: 'error' });
      return;
    }

    // Validar nombres de color duplicados
    if (Array.isArray(editForm.colors)) {
      const colorNames = editForm.colors.map(c => c.name.toLowerCase().trim());
      const duplicateColor = colorNames.find((name, idx) => colorNames.indexOf(name) !== idx);
      if (duplicateColor) {
        setToast({ message: `Color duplicado: ${duplicateColor}`, type: 'error' });
        return;
      }
    }

    try {
      // Subir imágenes pendientes a Cloudinary
      const updatedColors = [...(editForm.colors || [])];
      for (const [key, base64Array] of Object.entries(pendingImages)) {
        const [colorIdx, imgIdx] = key.split('-').map(Number);
        const base64 = base64Array[0];
        
        if (base64.startsWith('data:image')) {
          const res = await fetch('/api/admin/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'upload',
              productId: editForm.id,
              colorName: updatedColors[colorIdx].name,
              index: imgIdx + 1,
              base64Image: base64
            })
          });
          
          const data = await res.json();
          if (data.success) {
            updatedColors[colorIdx].images[imgIdx] = data.path;
          }
        }
      }
      
      // Limpiar imágenes pendientes
      setPendingImages({});
      
      // Actualizar editForm con URLs de Cloudinary
      const finalForm = { ...editForm, colors: updatedColors };

      // Verificar si es nuevo: debe tener ID temporal Y no existir en la lista de productos
      const isNew = finalForm.id?.startsWith('limito-new-') && !products.find(p => p.id === finalForm.id);

      const saveRes = await fetch('/api/admin/products', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalForm),
      });

      if (!saveRes.ok) {
        throw new Error('Error al guardar');
      }

      setEditingProduct(null);
      setEditForm({});

      const res = await fetch('/api/admin/products/all?t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setProducts(data.products || []);

      setToast({ message: isNew ? 'Producto creado correctamente' : 'Producto actualizado correctamente', type: 'success' });
    } catch (error) {
      if (error instanceof TypeError) {
        setToast({ message: 'Error de conexión. Verifica tu internet.', type: 'error' });
      } else {
        setToast({ message: 'Error al guardar producto', type: 'error' });
      }
    }
  };

  const uploadImage = async (file: File, colorIdx: number, imgIdx: number) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Solo se permiten archivos de imagen', type: 'error' });
      return;
    }
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'La imagen no puede superar 5MB', type: 'error' });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      if ('colors' in editForm && Array.isArray(editForm.colors)) {
        const base64 = reader.result as string;
        const key = `${colorIdx}-${imgIdx}`;
        
        // Guardar base64 en estado temporal
        setPendingImages(prev => ({ ...prev, [key]: [base64] }));
        
        // Actualizar preview en el formulario
        const newColors = [...editForm.colors];
        newColors[colorIdx].images[imgIdx] = base64;
        setEditForm({ ...editForm, colors: newColors });
      }
    };
    reader.readAsDataURL(file);
  };

  const addImage = (colorIdx: number, file: File) => {
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Solo se permiten archivos de imagen', type: 'error' });
      return;
    }
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'La imagen no puede superar 5MB', type: 'error' });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      if ('colors' in editForm && Array.isArray(editForm.colors)) {
        try {
          const currentImages = editForm.colors[colorIdx].images;
          const res = await fetch('/api/admin/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'upload',
              productId: editForm.id,
              colorName: editForm.colors[colorIdx].name,
              index: currentImages.length + 1,
              base64Image: reader.result as string
            })
          });

          const data = await res.json();
          if (data.success) {
            const newColors = [...editForm.colors];
            newColors[colorIdx].images.push(data.path);
            setEditForm({ ...editForm, colors: newColors });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          setToast({ message: 'Error al subir imagen', type: 'error' });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const getColorName = (hex: string): string | null => {
    const colorMap: Record<string, string> = {
      '#000000': 'Negro',
      '#ffffff': 'Blanco',
      '#ff0000': 'Rojo',
      '#8b0000': 'Rojo Oscuro',
      '#dc143c': 'Carmesí',
      '#0000ff': 'Azul',
      '#000080': 'Azul Marino',
      '#4169e1': 'Azul Rey',
      '#1e90ff': 'Azul Cielo',
      '#00bfff': 'Azul Profundo',
      '#87ceeb': 'Azul Claro',
      '#00ff00': 'Verde',
      '#008000': 'Verde Oscuro',
      '#00ff7f': 'Verde Primavera',
      '#32cd32': 'Verde Lima',
      '#90ee90': 'Verde Claro',
      '#ffff00': 'Amarillo',
      '#ffd700': 'Dorado',
      '#ffa500': 'Naranja',
      '#ff8c00': 'Naranja Oscuro',
      '#ff4500': 'Naranja Rojizo',
      '#800080': 'Morado',
      '#9370db': 'Púrpura Medio',
      '#8a2be2': 'Violeta',
      '#4b0082': 'Índigo',
      '#ffc0cb': 'Rosa',
      '#ff69b4': 'Rosa Fuerte',
      '#ff1493': 'Rosa Profundo',
      '#808080': 'Gris',
      '#c0c0c0': 'Plata',
      '#696969': 'Gris Oscuro',
      '#d3d3d3': 'Gris Claro',
      '#a52a2a': 'Café',
      '#8b4513': 'Marrón',
      '#d2691e': 'Chocolate',
      '#deb887': 'Beige',
      '#f5deb3': 'Trigo',
      '#00ffff': 'Cian',
      '#ff00ff': 'Magenta',
      '#00ced1': 'Turquesa',
      '#20b2aa': 'Verde Agua',
      'var(--accent-color, #ffd624)': 'Amarillo Limito',
    };

    const normalized = hex.toLowerCase();
    if (colorMap[normalized]) return colorMap[normalized];

    const hexToRgb = (h: string) => {
      const r = parseInt(h.slice(1, 3), 16);
      const g = parseInt(h.slice(3, 5), 16);
      const b = parseInt(h.slice(5, 7), 16);
      return { r, g, b };
    };

    const distance = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }) => {
      return Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
    };

    const inputRgb = hexToRgb(normalized);
    let closestColor = null;
    let minDistance = 150;

    for (const [hexColor, name] of Object.entries(colorMap)) {
      const colorRgb = hexToRgb(hexColor);
      const dist = distance(inputRgb, colorRgb);
      if (dist < minDistance) {
        minDistance = dist;
        closestColor = name;
      }
    }

    return closestColor;
  };

  const removeImage = (colorIdx: number, imgIdx: number) => {
    if ('colors' in editForm && Array.isArray(editForm.colors)) {
      const newColors = [...editForm.colors];
      newColors[colorIdx].images.splice(imgIdx, 1);
      setEditForm({ ...editForm, colors: newColors });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Hash password on client side before sending
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash }),
      });

      const resData = await res.json();

      if (resData.access) {
        setAuthenticated(true);
        const prodRes = await fetch('/api/admin/products/all');
        const prodData = await prodRes.json();
        setProducts(prodData.products);
      } else {
        setError('Contraseña incorrecta');
        setPassword('');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const handleLogout = async () => {
    setPendingImages({});
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  };

  // Early returns
  if (pageLoading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-[10%] md:px-[25%]" style={{ backgroundColor: '#F5F1E8' }}>
        <div className="bg-white/95 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full">
          <h1 className="text-3xl font-black mb-6 text-center" style={{ color: '#0A0A0A' }}>LIMITØ ADMIN</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Contraseña de admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-[98%] px-6 py-4 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
            />
            {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
            <button
              type="submit"
              className="w-full bg-black text-white py-4 text-base font-black uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-all"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F1E8' }}>
      {/* Header mejorado */}
      <header className="bg-gradient-to-r from-black via-gray-900 to-black text-white shadow-2xl sticky top-0 z-50 border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-black tracking-tight">LIMITØ ADMIN</h1>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all shadow-lg hover:shadow-xl font-bold hover:scale-105"
          >
            <LogOut className="w-5 h-5" />
            Salir
          </button>
        </div>
      </header>

      {/* Sidebar mejorado */}
      <AdminSidebar
        activeTab={activeTab}
        sidebarOpen={sidebarOpen}
        onTabChange={setActiveTab}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="mx-auto py-10 px-[10%] md:px-[25%]" style={{ backgroundColor: '#F5F1E8', minHeight: 'calc(100vh - 88px)' }}>
        {activeTab === 'orders' && (
          <div>
            <StatsCards stats={stats} />

            <h2 className="text-2xl font-black mb-6" style={{ color: '#0A0A0A' }}>Gestión de Órdenes</h2>
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdate={updateOrder} />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4" style={{ color: '#6B6B6B' }} />
                  <p className="text-xl font-bold" style={{ color: '#6B6B6B' }}>No hay órdenes aún</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black" style={{ color: '#0A0A0A' }}>Gestión de Productos</h2>
              <button
                onClick={() => {
                  const newProduct = {
                    id: `limito-new-${Date.now()}`,
                    name: '',
                    edition: '001',
                    type: 'snapback',
                    description: '',
                    descriptionEn: '',
                    available: true,
                    colors: [{
                      name: 'Negro',
                      hex: '#000000',
                      price: 0,
                      stock: 0,
                      images: []
                    }],
                    features: ['Edición limitada', 'Logo bordado', 'Ajustable']
                  };
                  setEditingProduct(newProduct.id);
                  setEditForm(newProduct);
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-black uppercase rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
              >
                <span className="text-2xl">+</span>
                Añadir Producto
              </button>
            </div>
            {(editingProduct?.startsWith('limito-new-') 
              ? [editForm as Product, ...products.filter(p => p.id !== editForm.id)] 
              : products
            ).map((product) => (
              <div key={product.id} className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg">
                {editingProduct === product.id ? (
                  <div>
                    <div className="bg-gradient-to-r from-black to-gray-800 px-8 py-6">
                      <h3 className="text-xl font-black text-white">EDITANDO: {product.name}</h3>
                    </div>

                    <div className="p-8 space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <label htmlFor="product-name" className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Nombre del Producto</label>
                          <input
                            id="product-name"
                            name="product-name"
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="product-edition" className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Edición</label>
                          <input
                            id="product-edition"
                            name="product-edition"
                            type="text"
                            value={editForm.edition}
                            onChange={(e) => setEditForm({ ...editForm, edition: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                            placeholder="001"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="product-availability" className="block text-xs font-black mb-2 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Disponibilidad</label>
                        <select
                          id="product-availability"
                          name="product-availability"
                          value={editForm.available ? 'true' : 'false'}
                          onChange={(e) => setEditForm({ ...editForm, available: e.target.value === 'true' })}
                          className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                        >
                          <option value="true">✓ Disponible</option>
                          <option value="false">✗ No Disponible</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="product-description" className="block text-xs font-black mb-3 uppercase tracking-wide" style={{ color: '#6B6B6B' }}>Descripción del Producto</label>
                        <textarea
                          id="product-description"
                          name="product-description"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-medium leading-relaxed"
                          rows={4}
                          placeholder="Descripción detallada del producto..."
                        />
                      </div>

                      <div className="border-t-2 border-gray-200 pt-8 mt-8">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-base font-black uppercase tracking-wide flex items-center gap-2" style={{ color: '#0A0A0A' }}>
                            <Upload className="w-5 h-5" />
                            Galería de Imágenes por Color
                          </h4>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              if ('colors' in editForm && Array.isArray(editForm.colors)) {
                                const newColor = {
                                  name: 'Nuevo Color',
                                  hex: '#000000',
                                  price: 0,
                                  stock: 0,
                                  images: []
                                };
                                setEditForm({ ...editForm, colors: [...editForm.colors, newColor] });
                              }
                            }}
                            className="px-6 py-3 bg-[var(--accent-color, #ffd624)] text-black text-sm font-black rounded-lg hover:brightness-110 transition-all"
                          >
                            + Añadir Color
                          </button>
                        </div>
                        <div className="space-y-6">
                          {Array.isArray(editForm.colors) && editForm.colors.map((color: Product['colors'][0], colorIdx: number) => (
                            <div key={colorIdx} className="border-2 border-gray-200 rounded-lg p-4 md:p-6 hover:border-black transition-all bg-gray-50 mb-8 overflow-hidden">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <input
                                    id={`color-picker-${colorIdx}`}
                                    name={`color-picker-${colorIdx}`}
                                    type="color"
                                    value={color.hex}
                                    onChange={(e) => {
                                      const newColors = [...(editForm.colors || [])];
                                      newColors[colorIdx].hex = e.target.value;

                                      const detectedName = getColorName(e.target.value);
                                      if (detectedName) {
                                        newColors[colorIdx].name = detectedName;
                                      }

                                      setEditForm({ ...editForm, colors: newColors });
                                    }}
                                    className="w-8 h-8 rounded-full border-2 border-black shadow-md cursor-pointer"
                                  />
                                  <input
                                    id={`color-name-${colorIdx}`}
                                    name={`color-name-${colorIdx}`}
                                    type="text"
                                    value={color.name}
                                    onChange={(e) => {
                                      const newColors = [...(editForm.colors || [])];
                                      newColors[colorIdx].name = e.target.value;
                                      setEditForm({ ...editForm, colors: newColors });
                                    }}
                                    className="text-base font-black px-2 py-1 border-2 border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-black"
                                    style={{ color: '#0A0A0A' }}
                                  />
                                  <span className="text-xs font-bold px-2 py-1 bg-white rounded-full" style={{ color: '#6B6B6B' }}>
                                    {color.images.length} {color.images.length === 1 ? 'foto' : 'fotos'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label htmlFor={`color-price-${colorIdx}`} className="block text-xs font-bold mb-1" style={{ color: '#6B6B6B' }}>Precio</label>
                                    <input
                                      id={`color-price-${colorIdx}`}
                                      name={`color-price-${colorIdx}`}
                                      type="number"
                                      value={color.price || 0}
                                      onChange={(e) => {
                                        const newColors = [...(editForm.colors || [])];
                                        newColors[colorIdx].price = parseInt(e.target.value) || 0;
                                        setEditForm({ ...editForm, colors: newColors });
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label htmlFor={`color-stock-${colorIdx}`} className="block text-xs font-bold mb-1" style={{ color: '#6B6B6B' }}>Stock</label>
                                    <input
                                      id={`color-stock-${colorIdx}`}
                                      name={`color-stock-${colorIdx}`}
                                      type="number"
                                      min="0"
                                      value={color.stock || 0}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        if (val < 0) return;
                                        const newColors = [...(editForm.colors || [])];
                                        newColors[colorIdx].stock = val;
                                        setEditForm({ ...editForm, colors: newColors });
                                      }}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-bold"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <label htmlFor={`color-image-${colorIdx}`} className="flex-1 px-4 py-2 bg-black text-white text-xs font-black rounded-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <Upload className="w-4 h-4" />
                                    Añadir Foto
                                    <input
                                      id={`color-image-${colorIdx}`}
                                      name={`color-image-${colorIdx}`}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          addImage(colorIdx, file);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                  </label>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if ('colors' in editForm && Array.isArray(editForm.colors)) {
                                        const newColors = [...editForm.colors];
                                        newColors.splice(colorIdx, 1);
                                        setEditForm({ ...editForm, colors: newColors });
                                      }
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-500 text-white text-xs font-black rounded-lg hover:bg-red-600 transition-all"
                                  >
                                    Eliminar Color
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mt-4">
                                {color.images.map((img: string, idx: number) => {
                                  return (
                                  <div key={idx} className="relative aspect-square rounded-lg border-2 border-gray-200 hover:border-black transition-all group" style={{ minHeight: '80px' }}>
                                    <Image src={img} alt={`${color.name} ${idx + 1}`} fill className="object-cover rounded-lg" loading="lazy" sizes="(max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw" unoptimized />
                                    <div className="absolute inset-x-0 bottom-0 flex gap-2 p-2 bg-black/60 backdrop-blur-sm rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <label className="flex-1 h-10 bg-[var(--accent-color, #ffd624)] rounded-lg flex items-center justify-center cursor-pointer hover:brightness-110 transition-all shadow-lg">
                                        <Upload className="w-5 h-5 text-black" />
                                        <input
                                          id={`replace-image-${colorIdx}-${idx}`}
                                          name={`replace-image-${colorIdx}-${idx}`}
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              uploadImage(file, colorIdx, idx);
                                              e.target.value = '';
                                            }
                                          }}
                                        />
                                      </label>
                                      <button
                                        onClick={(e) => { e.preventDefault(); removeImage(colorIdx, idx); }}
                                        className="flex-1 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center font-bold text-xl transition-all shadow-lg"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )})}
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>

                    <div className="px-8 py-6 border-t-2 border-gray-200 bg-gray-50">
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={cancelEdit}
                          className="px-10 py-4 bg-white text-gray-700 text-base font-black uppercase rounded-xl hover:bg-gray-100 transition-all border-2 border-gray-300 shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <span className="text-xl">✕</span>
                          Cancelar
                        </button>
                        <button
                          onClick={saveProduct}
                          className="px-10 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-base font-black uppercase rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                        >
                          <span className="text-xl">💾</span>
                          Guardar Cambios
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="text-2xl font-black" style={{ color: '#0A0A0A' }}>{product.name}</h3>
                          <span className={`px-3 py-1 text-xs font-black uppercase rounded-full ${
                            product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {product.available ? '✓ Activo' : '✗ Inactivo'}
                          </span>
                        </div>
                        <p className="text-sm mb-4" style={{ color: '#6B6B6B' }}>{product.description}</p>
                        <div className="space-y-3 text-sm mb-6">
                          <div>
                            <span className="text-xs font-bold" style={{ color: '#6B6B6B' }}>Edición: </span>
                            <span className="font-black" style={{ color: '#0A0A0A' }}>{product.edition}</span>
                          </div>
                          <div>
                            <span className="text-xs font-bold" style={{ color: '#6B6B6B' }}>Stock Total: </span>
                            <span className="font-black text-lg" style={{ color: Array.isArray(product.colors) && product.colors.reduce((sum, c) => sum + c.stock, 0) > 10 ? '#16A34A' : '#DC2626' }}>
                              {Array.isArray(product.colors) ? product.colors.reduce((sum, c) => sum + c.stock, 0) : 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-bold" style={{ color: '#6B6B6B' }}>Colores:</span>
                            <div className="mt-2 space-y-2">
                              {Array.isArray(product.colors) && product.colors.map((color, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                  <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color.hex }}></span>
                                  <span className="font-black min-w-[100px]" style={{ color: '#0A0A0A' }}>{color.name}</span>
                                  <span className="font-black min-w-[80px]" style={{ color: '#0A0A0A' }}>${color.price.toLocaleString()}</span>
                                  <span className="text-xs font-bold" style={{ color: '#6B6B6B' }}>Stock:</span>
                                  <span className="font-black text-lg" style={{ color: color.stock > 5 ? '#16A34A' : '#DC2626' }}>{color.stock}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="lg:text-right">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => startEdit(product.id)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-black uppercase rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <span>✏️</span>
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm('¿Estás seguro de eliminar este producto?')) return;
                              try {
                                await fetch('/api/admin/products', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: product.id }),
                                });
                                await loadData();
                                setToast({ message: 'Producto eliminado', type: 'success' });
                              } catch {
                                setToast({ message: 'Error al eliminar', type: 'error' });
                              }
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-black uppercase rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <span>🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-black mb-4" style={{ color: '#0A0A0A' }}>Estado Actual</h3>
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  storeMode === 'password' ? 'bg-[var(--accent-color, #ffd624)]' : 
                  storeMode === 'active' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                } animate-pulse`}></div>
                <p className="text-base font-bold" style={{ color: '#0A0A0A' }}>
                  {storeMode === 'password' && 'Modo Password Activo'}
                  {storeMode === 'active' && 'Tienda Activa'}
                  {storeMode === 'soldout' && 'Agotado'}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {storeMode === 'password' && 'Los usuarios ven la página de contraseña'}
                {storeMode === 'active' && 'Los usuarios pueden acceder al catálogo'}
                {storeMode === 'soldout' && 'Los usuarios ven la página de agotado'}
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-black mb-6" style={{ color: '#0A0A0A' }}>Configuración General</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>Modo de tienda</label>
                <select
                  value={storeMode}
                  onChange={(e) => setStoreMode(e.target.value as StoreMode)}
                  className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                >
                  <option value="password">Password (Pre-lanzamiento)</option>
                  <option value="active">Activo (Ventas abiertas)</option>
                  <option value="soldout">Sold Out (Agotado)</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  {storeMode === 'password' && 'Los usuarios verán la página de contraseña'}
                  {storeMode === 'active' && 'Los usuarios serán redirigidos al catálogo'}
                  {storeMode === 'soldout' && 'Los usuarios verán la página de agotado'}
                </p>
              </div>

              {storeMode === 'password' && (
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>Modo password hasta</label>
                  <input
                    type="date"
                    value={passwordUntil ? passwordUntil.split('T')[0] : ''}
                    onChange={(e) => {
                      setPasswordUntil(e.target.value + 'T23:59');
                      e.target.blur();
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Después de esta fecha, cambiará automáticamente a modo activo (Formato: YYYY-MM-DD)
                  </p>
                </div>
              )}

              <button
                onClick={saveStoreSettings}
                className="w-full bg-gradient-to-r from-gray-800 to-black text-white py-4 text-sm font-black uppercase tracking-wider rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span className="text-xl">💾</span>
                Guardar Configuración de Tienda
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-black mb-6" style={{ color: '#0A0A0A' }}>Fondo de la App</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>1. Imagen o Video Principal</label>
                <input
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');
                      try {
                        const res = await fetch('/api/admin/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await res.json();
                        if (data.success) {
                          setBackgroundImage(data.path + '?t=' + Date.now());
                          setToast({ message: 'Fondo actualizado', type: 'success' });
                        }
                      } catch (error) {
                        console.error('Error uploading background:', error);
                        setToast({ message: 'Error al subir archivo', type: 'error' });
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                />
                <p className="text-xs text-gray-600 mt-2">
                  • Si subes IMAGEN: se usa en toda la app<br/>
                  • Si subes VIDEO: se reproduce en /password, /contact, /policies
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>2. Imagen para Catalog/Cart (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('field', 'static');
                      try {
                        const res = await fetch('/api/admin/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        const data = await res.json();
                        if (data.success) {
                          setToast({ message: 'Imagen estática actualizada', type: 'success' });
                        }
                      } catch (error) {
                        console.error('Error uploading static background:', error);
                        setToast({ message: 'Error al subir imagen', type: 'error' });
                      }
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-500 rounded-lg focus:outline-none focus:border-black font-bold text-lg"
                />
                <p className="text-xs text-gray-600 mt-2">
                  • Si NO subes nada aquí y subiste video arriba: se usa el primer frame del video<br/>
                  • Si subes imagen aquí: se usa esta imagen personalizada en catalog/cart/product
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>3. Color de Acento</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={async (e) => {
                      const color = e.target.value;
                      setAccentColor(color);
                      try {
                        const res = await fetch('/api/store-config', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            mode: 'password',
                            accentColor: color
                          }),
                          cache: 'no-store'
                        });
                        if (res.ok) {
                          // Forzar recarga del cache
                          await fetch('/api/store-config?t=' + Date.now(), { cache: 'no-store' });
                          setToast({ message: 'Color actualizado', type: 'success' });
                        }
                      } catch (error) {
                        console.error('Error updating color:', error);
                        setToast({ message: 'Error al actualizar color', type: 'error' });
                      }
                    }}
                    className="w-20 h-12 border-2 border-gray-500 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    Este color se usa en botones, hovers, badges y elementos destacados
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black" style={{ color: '#0A0A0A' }}>Códigos de Acceso</h2>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Códigos para acceder a la tienda en modo password</p>
              </div>
            </div>

            <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-purple-700" />
                <h3 className="text-lg font-black" style={{ color: '#0A0A0A' }}>Crear Nuevo Código de Acceso</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>
                    <Tag className="w-4 h-4" />
                    Código
                  </label>
                  <input
                    type="text"
                    value={newAccessCode}
                    onChange={(e) => setNewAccessCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 font-bold text-lg bg-white"
                    placeholder="LIMITO2025"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>
                    <Calendar className="w-4 h-4" />
                    Fecha de Caducidad
                  </label>
                  <input
                    type="date"
                    value={newAccessExpiry ? newAccessExpiry.split('T')[0] : ''}
                    onChange={(e) => {
                      setNewAccessExpiry(e.target.value + 'T23:59');
                      e.target.blur();
                    }}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-600 font-bold text-lg bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: YYYY-MM-DD</p>
                </div>

                <button
                  onClick={async () => {
                    if (!newAccessCode || !newAccessExpiry) {
                      setToast({ message: 'Completa todos los campos', type: 'error' });
                      return;
                    }
                    
                    // Validar formato
                    if (!/^[A-Z0-9]+$/.test(newAccessCode)) {
                      setToast({ message: 'El código solo puede contener letras mayúsculas y números', type: 'error' });
                      return;
                    }
                    
                    // Validar duplicados
                    if (accessCodes.some(c => c.code === newAccessCode)) {
                      setToast({ message: 'Este código ya existe', type: 'error' });
                      return;
                    }
                    
                    try {
                      const res = await fetch('/api/admin/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'add_access_code',
                          code: newAccessCode,
                          expiresAt: newAccessExpiry,
                        }),
                      });
                      if (res.ok) {
                        setNewAccessCode('');
                        setNewAccessExpiry('');
                        await loadStoreConfig();
                        setToast({ message: 'Código de acceso creado correctamente', type: 'success' });
                      } else {
                        const data = await res.json();
                        setToast({ message: data.error || 'Error al crear código', type: 'error' });
                      }
                    } catch (error) {
                      if (error instanceof TypeError) {
                        setToast({ message: 'Error de conexión. Verifica tu internet.', type: 'error' });
                      } else {
                        setToast({ message: 'Error al crear código', type: 'error' });
                      }
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 text-sm font-black uppercase tracking-wider rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Crear Código de Acceso
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#0A0A0A' }}>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Códigos de Acceso Registrados
              </h3>
              <div className="space-y-3">
                {accessCodes.filter(c => new Date(c.expiresAt || '9999-12-31') > new Date()).map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 hover:border-green-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-xl" style={{ color: '#0A0A0A' }}>{code.code}</p>
                        <p className="text-sm flex items-center gap-1" style={{ color: '#6B6B6B' }}>
                          <Calendar className="w-3 h-3" />
                          {code.expiresAt && `Caduca: ${new Date(code.expiresAt).toLocaleDateString('es-CO')}`}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 text-xs font-black uppercase rounded-full bg-green-500 text-white shadow-md flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Activo
                    </span>
                  </div>
                ))}
                {accessCodes.filter(c => c.expiresAt && new Date(c.expiresAt) <= new Date()).map((code, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-300 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-xl" style={{ color: '#0A0A0A' }}>{code.code}</p>
                        <p className="text-sm flex items-center gap-1" style={{ color: '#6B6B6B' }}>
                          <Calendar className="w-3 h-3" />
                          Caducó: {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('es-CO') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 text-xs font-black uppercase rounded-full bg-red-500 text-white shadow-md flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Expirado
                    </span>
                  </div>
                ))}
                {accessCodes.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Key className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-bold" style={{ color: '#6B6B6B' }}>No hay códigos de acceso</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'promos' && (
          <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black" style={{ color: '#0A0A0A' }}>Códigos de Descuento</h2>
                <p className="text-sm" style={{ color: '#6B6B6B' }}>Códigos promocionales para aplicar descuentos en el carrito</p>
              </div>
            </div>

            <div className="mb-8 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-black" style={{ color: '#0A0A0A' }}>Crear Nuevo Código de Descuento</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>
                    <Tag className="w-4 h-4" />
                    Código
                  </label>
                  <input
                    type="text"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-orange-500 font-bold text-lg bg-white"
                    placeholder="DESCUENTO10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>
                      <Percent className="w-4 h-4" />
                      Tipo
                    </label>
                    <select
                      value={newPromoType}
                      onChange={(e) => setNewPromoType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-orange-500 font-bold text-lg bg-white"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto Fijo ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>
                      <DollarSign className="w-4 h-4" />
                      Valor
                    </label>
                    <input
                      type="number"
                      value={newPromoValue}
                      onChange={(e) => setNewPromoValue(parseInt(e.target.value) || 0)}
                      onFocus={(e) => e.target.select()}
                      className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-orange-500 font-bold text-lg bg-white"
                      placeholder={newPromoType === 'percentage' ? '10' : '5000'}
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#0A0A0A' }}>
                    <Calendar className="w-4 h-4" />
                    Fecha de Caducidad (Opcional)
                  </label>
                  <input
                    type="date"
                    value={newPromoExpiry ? newPromoExpiry.split('T')[0] : ''}
                    onChange={(e) => {
                      setNewPromoExpiry(e.target.value + 'T23:59');
                      e.target.blur();
                    }}
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-orange-500 font-bold text-lg bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Formato: YYYY-MM-DD</p>
                </div>

                <button
                  onClick={async () => {
                    if (!newPromoCode || !newPromoValue) {
                      setToast({ message: 'Completa código y valor', type: 'error' });
                      return;
                    }
                    
                    // Validar formato
                    if (!/^[A-Z0-9]+$/.test(newPromoCode)) {
                      setToast({ message: 'El código solo puede contener letras mayúsculas y números', type: 'error' });
                      return;
                    }
                    
                    // Validar duplicados
                    if (promoCodes.some(p => p.code === newPromoCode)) {
                      setToast({ message: 'Este código ya existe', type: 'error' });
                      return;
                    }
                    
                    // Validar valor
                    if (newPromoType === 'percentage' && (newPromoValue <= 0 || newPromoValue > 100)) {
                      setToast({ message: 'El porcentaje debe estar entre 1 y 100', type: 'error' });
                      return;
                    }
                    
                    try {
                      const res = await fetch('/api/admin/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'add_promo_code',
                          code: newPromoCode,
                          type: newPromoType,
                          value: newPromoValue,
                          expiresAt: newPromoExpiry || null,
                        }),
                      });
                      if (res.ok) {
                        setNewPromoCode('');
                        setNewPromoValue(0);
                        setNewPromoExpiry('');
                        await loadStoreConfig();
                        setToast({ message: 'Código de descuento creado correctamente', type: 'success' });
                      } else {
                        const data = await res.json();
                        setToast({ message: data.error || 'Error al crear código', type: 'error' });
                      }
                    } catch (error) {
                      if (error instanceof TypeError) {
                        setToast({ message: 'Error de conexión. Verifica tu internet.', type: 'error' });
                      } else {
                        setToast({ message: 'Error al crear código', type: 'error' });
                      }
                    }
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 text-sm font-black uppercase tracking-wider rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Crear Código de Descuento
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: '#0A0A0A' }}>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Códigos de Descuento Registrados
              </h3>
              <div className="space-y-3">
                {promoCodes.filter(p => !p.expiresAt || new Date(p.expiresAt) > new Date()).map((promo, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 hover:border-green-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                        {promo.type === 'percentage' ? <Percent className="w-5 h-5 text-white" /> : <DollarSign className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-black text-xl" style={{ color: '#0A0A0A' }}>{promo.code}</p>
                        <p className="text-sm flex items-center gap-2" style={{ color: '#6B6B6B' }}>
                          <span className="font-bold">
                            {promo.type === 'percentage' ? `${promo.value}% descuento` : `$${promo.value.toLocaleString()} descuento`}
                          </span>
                          {promo.expiresAt && (
                            <>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              Caduca: {new Date(promo.expiresAt).toLocaleDateString('es-CO')}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 text-xs font-black uppercase rounded-full bg-green-500 text-white shadow-md flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Activo
                    </span>
                  </div>
                ))}
                {promoCodes.filter(p => p.expiresAt && new Date(p.expiresAt) <= new Date()).map((promo, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-300 opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                        {promo.type === 'percentage' ? <Percent className="w-5 h-5 text-white" /> : <DollarSign className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-black text-xl" style={{ color: '#0A0A0A' }}>{promo.code}</p>
                        <p className="text-sm flex items-center gap-2" style={{ color: '#6B6B6B' }}>
                          <span className="font-bold">
                            {promo.type === 'percentage' ? `${promo.value}% descuento` : `$${promo.value.toLocaleString()} descuento`}
                          </span>
                          <span>•</span>
                          <Calendar className="w-3 h-3" />
                          Caducó: {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('es-CO') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 text-xs font-black uppercase rounded-full bg-red-500 text-white shadow-md flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Expirado
                    </span>
                  </div>
                ))}
                {promoCodes.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Tag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-bold" style={{ color: '#6B6B6B' }}>No hay códigos de descuento</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <AdvancedSettings 
            onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
            onError={(msg) => setToast({ message: msg, type: 'error' })}
          />
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
