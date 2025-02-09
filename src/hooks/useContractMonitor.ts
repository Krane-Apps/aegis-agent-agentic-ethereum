import { useState, useEffect } from 'react';
import { API_BASE } from 'src/utils/constants';
import { toast } from 'react-toastify';

interface Contract {
  id: number;
  address: string;
  network: string;
  description: string | null;
  status: 'Healthy' | 'Warning' | 'Critical';
  threatLevel: 'Low' | 'Medium' | 'High';
  monitoringFrequency: string;
  subgraphUrl?: string;
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

// Dummy data for fallback when API is down
const DUMMY_CONTRACTS: Contract[] = [
  {
    id: 1,
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    network: 'base',
    description: 'Example Contract (Dummy Data)',
    status: 'Healthy',
    threatLevel: 'Low',
    monitoringFrequency: '5min'
  },
  {
    id: 2,
    address: '0x123d35Cc6634C0532925a3b844Bc454e4438f789',
    network: 'base-sepolia',
    description: 'Test Contract (Dummy Data)',
    status: 'Warning',
    threatLevel: 'Medium',
    monitoringFrequency: '1min'
  }
];

const DUMMY_STATS: Stats = {
  contractsMonitored: 2,
  alertsToday: 5,
  activeThreats: 1
};

const DUMMY_ALERT_SETTINGS: AlertSettings = {
  emailNotifications: true,
  configuredEmails: ['example@test.com'],
  alertTypes: ['flash_loan', 'reentrancy', 'oracle_manipulation']
};

export function useContractMonitor() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDummyData, setIsUsingDummyData] = useState(false);

  // fetch all contracts
  const fetchContracts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contracts`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data.contracts);
      setIsUsingDummyData(false);
    } catch (err) {
      console.error('API Error:', err);
      setContracts(DUMMY_CONTRACTS);
      setIsUsingDummyData(true);
      toast.error('Backend service is down. Showing placeholder data. Please contact admin to restart the service.');
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
      await fetchContracts();
      return data;
    } catch (err) {
      if (isUsingDummyData) {
        // Simulate adding a contract in dummy mode
        const newContract: Contract = {
          id: DUMMY_CONTRACTS.length + 1,
          address: contractData.contractAddress,
          network: contractData.network,
          description: contractData.description || null,
          status: 'Healthy',
          threatLevel: 'Low',
          monitoringFrequency: contractData.monitoringFrequency || '5min'
        };
        setContracts([...DUMMY_CONTRACTS, newContract]);
        return { success: true, message: "Contract added (Dummy Mode)" };
      }
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
      setIsUsingDummyData(false);
    } catch (err) {
      console.error('API Error:', err);
      setStats(DUMMY_STATS);
      setIsUsingDummyData(true);
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
      setIsUsingDummyData(false);
    } catch (err) {
      console.error('API Error:', err);
      setAlertSettings(DUMMY_ALERT_SETTINGS);
      setIsUsingDummyData(true);
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
      if (isUsingDummyData) {
        // Simulate deletion in dummy mode
        setContracts(contracts.filter(c => c.id !== contractId));
        return;
      }

      const response = await fetch(`${API_BASE}/api/contracts/${contractId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete contract');
      
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
    isUsingDummyData,
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