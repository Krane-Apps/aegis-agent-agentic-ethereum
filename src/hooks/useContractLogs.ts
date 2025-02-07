import { useState, useEffect } from 'react';

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
        ? `http://127.0.0.1:5000/api/contracts/${contractId}/logs`
        : 'http://127.0.0.1:5000/api/logs';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // poll every 5 seconds for more real-time updates
    const interval = setInterval(fetchLogs, 5000);
    
    return () => clearInterval(interval);
  }, [contractId]);

  return { logs, loading, error, refreshLogs: fetchLogs };
} 