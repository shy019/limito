'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Save, X, RefreshCw } from 'lucide-react';

interface SettingsData {
  store_mode: string;
  max_items_per_cart: string;
  max_items_per_color: string;
  reservation_duration_minutes: string;
  session_duration_minutes: string;
  low_stock_threshold: string;
  telegram_notifications_enabled: string;
  telegram_notify_on_sale: string;
  telegram_notify_on_stock_out: string;
  store_message: string;
}

interface Props {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function AdvancedSettings({ onSuccess, onError }: Props) {
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setOriginalSettings(data.settings);
        setSettings(data.settings);
        setHasChanges(false);
      } else {
        onError('Error al cargar configuración');
      }
    } catch (error) {
      onError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        
        if (data.success) {
          setOriginalSettings(data.settings);
          setSettings(data.settings);
          setHasChanges(false);
        } else {
          onError('Error al cargar configuración');
        }
      } catch (error) {
        onError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, []);

  useEffect(() => {
    if (originalSettings && settings) {
      const changed = JSON.stringify(originalSettings) !== JSON.stringify(settings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const handleChange = (key: keyof SettingsData, value: string) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setSaving(true);
      const updates = Object.entries(settings).filter(([key, value]) => 
        originalSettings && originalSettings[key as keyof SettingsData] !== value
      );

      for (const [key, value] of updates) {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error('Error al actualizar');
        }
      }

      onSuccess('Configuración guardada correctamente');
      await loadSettings();
    } catch (error) {
      onError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings({ ...originalSettings });
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <p className="text-sm font-bold text-yellow-800">
          ⚠️ No se pudo cargar la configuración
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modo de Tienda */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-black text-gray-900">Modo de Tienda</h3>
        </div>
        <select
          value={settings.store_mode}
          onChange={(e) => handleChange('store_mode', e.target.value)}
          disabled={saving}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
        >
          <option value="normal">🟢 Normal - Tienda abierta</option>
          <option value="password">🟡 Password - Pre-lanzamiento</option>
          <option value="soldout">🔴 Sold Out - Agotado</option>
          <option value="maintenance">🔧 Maintenance - Mantenimiento</option>
        </select>
      </div>

      {/* Límites de Carrito */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <h3 className="text-lg font-black mb-4 text-gray-900">Límites de Carrito</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Máx. items totales</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.max_items_per_cart}
              onChange={(e) => handleChange('max_items_per_cart', e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Máx. por producto</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_items_per_color}
              onChange={(e) => handleChange('max_items_per_color', e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Tiempos */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <h3 className="text-lg font-black mb-4 text-gray-900">Tiempos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Duración reserva (min)</label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.reservation_duration_minutes}
              onChange={(e) => handleChange('reservation_duration_minutes', e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Duración sesión (min)</label>
            <input
              type="number"
              min="10"
              max="120"
              value={settings.session_duration_minutes}
              onChange={(e) => handleChange('session_duration_minutes', e.target.value)}
              disabled={saving}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notificaciones Telegram */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <h3 className="text-lg font-black mb-4 text-gray-900">Notificaciones Telegram</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.telegram_notifications_enabled === 'true'}
              onChange={(e) => handleChange('telegram_notifications_enabled', e.target.checked ? 'true' : 'false')}
              disabled={saving}
              className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="font-bold text-gray-900">Activar notificaciones</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.telegram_notify_on_sale === 'true'}
              onChange={(e) => handleChange('telegram_notify_on_sale', e.target.checked ? 'true' : 'false')}
              disabled={saving || settings.telegram_notifications_enabled !== 'true'}
              className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="font-bold text-gray-900">Notificar ventas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.telegram_notify_on_stock_out === 'true'}
              onChange={(e) => handleChange('telegram_notify_on_stock_out', e.target.checked ? 'true' : 'false')}
              disabled={saving || settings.telegram_notifications_enabled !== 'true'}
              className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="font-bold text-gray-900">Notificar stock agotado</span>
          </label>
        </div>
      </div>

      {/* Stock */}
      <div className="bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <h3 className="text-lg font-black mb-4 text-gray-900">Alertas de Stock</h3>
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-700">Umbral de stock bajo</label>
          <input
            type="number"
            min="0"
            max="50"
            value={settings.low_stock_threshold}
            onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
            disabled={saving}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-900 focus:border-blue-500 focus:outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-2">Se alertará cuando el stock sea menor o igual a este valor</p>
        </div>
      </div>

      {/* Botones de acción */}
      {hasChanges && (
        <div className="sticky bottom-6 bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-xl shadow-2xl border-2 border-blue-500">
          <div className="flex items-center justify-between gap-4">
            <p className="text-white font-bold">⚠️ Tienes cambios sin guardar</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-3 bg-white text-gray-900 font-black rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-green-500 text-white font-black rounded-lg hover:bg-green-600 transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
