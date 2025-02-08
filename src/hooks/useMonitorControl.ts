import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface MonitorStatus {
  running: boolean;
  thread_alive: boolean;
}

export function useMonitorControl() {
  const [status, setStatus] = useState<MonitorStatus>({ running: false, thread_alive: false });
  const [loading, setLoading] = useState(false);

  const API_BASE = 'http://127.0.0.1:5000';

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/monitor/status`);
      if (!response.ok) throw new Error('Failed to fetch monitor status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching monitor status:', error);
      toast.error('Failed to fetch monitor status');
    }
  };

  const startMonitor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/monitor/start`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start monitor');
      const data = await response.json();
      if (data.success) {
        toast.success('Monitoring started successfully');
        await fetchStatus();
      } else {
        toast.warning(data.message);
      }
    } catch (error) {
      console.error('Error starting monitor:', error);
      toast.error('Failed to start monitoring');
    } finally {
      setLoading(false);
    }
  };

  const stopMonitor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/monitor/stop`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to stop monitor');
      const data = await response.json();
      if (data.success) {
        toast.success('Monitoring stopped successfully');
        await fetchStatus();
      } else {
        toast.warning(data.message);
      }
    } catch (error) {
      console.error('Error stopping monitor:', error);
      toast.error('Failed to stop monitoring');
    } finally {
      setLoading(false);
    }
  };

  // fetch status periodically
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    loading,
    startMonitor,
    stopMonitor,
  };
} 