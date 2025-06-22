import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { User } from 'firebase/auth';

export type AdminSettings = {
  maintenanceMode: boolean;
  userRegistration: boolean;
  lastUpdated?: string;
  updatedBy?: string;
  // Add other settings fields as needed
};

type ServerStatus = {
  status: 'online' | 'offline';
  data?: any;
  error?: string;
};

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings>({
    maintenanceMode: false,
    userRegistration: true,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, firebaseUser } = useAuth();

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data.data || data);
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching admin settings:', error);
      setError('Failed to load admin settings');
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Function to refresh settings
  const refreshSettings = useCallback(() => {
    return fetchSettings();
  }, [fetchSettings]);

  // Update settings via API
  const updateSettings = async (updates: Partial<AdminSettings>) => {
    if (!user || !firebaseUser) return;

    try {
      setUpdating(true);
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...settings,
          ...updates,
          updatedBy: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        ...(data.data || data),
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id,
      }));
      toast.success('Settings updated successfully');
      return data.data || data;
    } catch (err) {
      const error = err as Error;
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Failed to update settings');
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Toggle maintenance mode
  const toggleMaintenanceMode = async (enabled: boolean) => {
    if (!user || !firebaseUser) return;

    try {
      setUpdating(true);
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          maintenanceMode: enabled,
          userRegistration: settings.userRegistration,
          updatedBy: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update settings');
      }

      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        ...(data.data || data),
        lastUpdated: new Date().toISOString(),
        updatedBy: user.id,
      }));
      toast.success('Maintenance mode updated successfully');
    } catch (err) {
      const error = err as Error;
      console.error('Error updating maintenance mode:', error);
      toast.error(error.message || 'Failed to update maintenance mode');
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  // Toggle user registration
  const toggleUserRegistration = async (enabled: boolean) => {
    return updateSettings({ userRegistration: enabled });
  };

  // Check server status
  const checkServerStatus = useCallback(async (): Promise<ServerStatus> => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Server is not responding');
      }
      const data = await response.json();
      return { status: 'online', data };
    } catch (err) {
      const error = err as Error;
      return { status: 'offline', error: error.message };
    }
  }, []);

  // Clear all settings
  const clearSettings = async () => {
    if (!user || !firebaseUser) return;

    try {
      setUpdating(true);
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('/api/admin/settings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to clear settings');
      }

      setSettings({
        maintenanceMode: false,
        userRegistration: true,
      });
      toast.success('Settings cleared successfully');
    } catch (err) {
      const error = err as Error;
      console.error('Error clearing settings:', error);
      toast.error(error.message || 'Failed to clear settings');
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  return {
    settings,
    loading,
    updating,
    error,
    refreshSettings,
    updateSettings,
    toggleMaintenanceMode,
    toggleUserRegistration,
    checkServerStatus,
    clearSettings,
  };
};
