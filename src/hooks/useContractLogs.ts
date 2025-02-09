import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { API_BASE } from 'src/utils/constants';

interface Log {
  id: number;
  timestamp: string;
  level: string;
  source: string;
  message: string;
  contract_id?: number;
}

export function useContractLogs(contractId?: number) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const url = contractId 
        ? `${API_BASE}/api/contracts/${contractId}/logs`
        : `${API_BASE}/api/logs`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setError(null);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to fetch logs');
      toast.error('Failed to fetch monitoring logs');
    } finally {
      setLoading(false);
    }
  };

  // fetch logs periodically
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, [contractId]);

  return {
    logs,
    loading,
    error,
    refreshLogs: fetchLogs
  };
} 