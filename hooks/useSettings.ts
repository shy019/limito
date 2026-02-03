// Hook para gestionar settings de Turso
import { useState, useEffect } from 'react';

interface Settings {
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

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (data.success) {
        await loadSettings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { settings, loading, updateSetting, reload: loadSettings };
}
