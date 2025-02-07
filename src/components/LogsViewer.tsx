import { useContractLogs } from "../hooks/useContractLogs";

export function LogsViewer({ contractId }: { contractId?: number }) {
  const { logs, loading, error } = useContractLogs(contractId);

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        Loading monitoring logs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        Error loading logs: {error}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No monitoring logs available yet. Add a contract to begin monitoring.
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
      <h3 className="text-lg font-medium text-white mb-4">Monitoring Logs</h3>
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-2 rounded ${
              log.level === "ERROR"
                ? "bg-red-900/20 border-red-900/50"
                : log.level === "WARNING"
                  ? "bg-yellow-900/20 border-yellow-900/50"
                  : "bg-blue-900/20 border-blue-900/50"
            } border`}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  log.level === "ERROR"
                    ? "bg-red-500/20 text-red-400"
                    : log.level === "WARNING"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                }`}
              >
                {log.level}
              </span>
            </div>
            <p className="text-white mt-1">{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
