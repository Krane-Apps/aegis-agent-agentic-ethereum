import { useState, useEffect } from 'react';

interface Contract {
  id: number;
  address: string;
  network: string;
  description: string | null;
  status: 'Healthy' | 'Warning' | 'Critical';
  threatLevel: 'Low' | 'Medium' | 'High';
}

interface Stats {
  contractsMonitored: number;
  alertsToday: number;
  activeThreats: number;
}

interface AlertSettings {
  emailNotifications: boolean;
  configuredEmails: string[];
  alertTypes: string[];
}

export function useContractMonitor() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://127.0.0.1:5000';

  // fetch all contracts
  const fetchContracts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contracts`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data.contracts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contracts');
    }
  };

  // add new contract
  const addContract = async (contractData: {
    contractAddress: string;
    network: string;
    emergencyFunction: string;
    emails: string[];
    description?: string;
    alertThreshold?: string;
    monitoringFrequency?: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/api/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });
      
      if (!response.ok) throw new Error('Failed to add contract');
      
      const data = await response.json();
      await fetchContracts(); // Refresh the contracts list
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add contract');
    }
  };

  // fetch monitoring stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  };

  // fetch alert settings
  const fetchAlertSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts/settings`);
      if (!response.ok) throw new Error('Failed to fetch alert settings');
      const data = await response.json();
      setAlertSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alert settings');
    }
  };

  // load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchContracts(),
          fetchStats(),
          fetchAlertSettings(),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const deleteContract = async (contractId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/contracts/${contractId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete contract');
      
      // refresh data after successful deletion
      await fetchContracts();
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  };

  return {
    contracts,
    stats,
    alertSettings,
    loading,
    error,
    addContract,
    deleteContract,
    refreshData: async () => {
      await Promise.all([
        fetchContracts(),
        fetchStats(),
        fetchAlertSettings(),
      ]);
    },
  };
} 