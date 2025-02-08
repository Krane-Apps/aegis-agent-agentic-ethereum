import { useContractLogs } from "../hooks/useContractLogs";
import { useMonitorControl } from "../hooks/useMonitorControl";
import { Button } from "./ui/button";
import { Play, Pause, Loader2 } from "lucide-react";

const getLogStyle = (log: any) => {
  // base styles
  let baseStyle = "p-2 rounded border ";

  // check for threat analysis emojis
  if (log.message.includes("🟢")) {
    return baseStyle + "bg-green-900/20 border-green-900/50 text-green-400";
  } else if (log.message.includes("🟡")) {
    return baseStyle + "bg-yellow-900/20 border-yellow-900/50 text-yellow-400";
  } else if (log.message.includes("🔴") || log.message.includes("🚨")) {
    return baseStyle + "bg-red-900/20 border-red-900/50 text-red-400";
  } else if (log.message.includes("🔍")) {
    return baseStyle + "bg-blue-900/20 border-blue-900/50 text-blue-400";
  } else if (log.message.includes("✅")) {
    return baseStyle + "bg-green-900/20 border-green-900/50 text-green-400";
  } else if (log.message.includes("❌")) {
    return baseStyle + "bg-red-900/20 border-red-900/50 text-red-400";
  } else if (log.message.includes("🛠️")) {
    return baseStyle + "bg-purple-900/20 border-purple-900/50 text-purple-400";
  }

  // default styles based on log level
  switch (log.level) {
    case "ERROR":
      return baseStyle + "bg-red-900/20 border-red-900/50 text-red-400";
    case "WARNING":
      return (
        baseStyle + "bg-yellow-900/20 border-yellow-900/50 text-yellow-400"
      );
    default:
      return baseStyle + "bg-blue-900/20 border-blue-900/50 text-blue-400";
  }
};

const getLogLevelStyle = (log: any) => {
  // style for the log level badge
  if (log.message.includes("🟢")) {
    return "bg-green-500/20 text-green-400";
  } else if (log.message.includes("🟡")) {
    return "bg-yellow-500/20 text-yellow-400";
  } else if (log.message.includes("🔴") || log.message.includes("🚨")) {
    return "bg-red-500/20 text-red-400";
  } else if (log.message.includes("🔍") || log.message.includes("🛠️")) {
    return "bg-blue-500/20 text-blue-400";
  }

  switch (log.level) {
    case "ERROR":
      return "bg-red-500/20 text-red-400";
    case "WARNING":
      return "bg-yellow-500/20 text-yellow-400";
    default:
      return "bg-blue-500/20 text-blue-400";
  }
};

export function LogsViewer({ contractId }: { contractId?: number }) {
  const { logs, loading: logsLoading, error } = useContractLogs(contractId);
  const {
    status,
    loading: monitorLoading,
    startMonitor,
    stopMonitor,
  } = useMonitorControl();

  if (logsLoading) {
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Monitoring Logs</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <div
              className={`w-2 h-2 rounded-full ${
                status.thread_alive ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-sm text-gray-400">
              {status.thread_alive ? "Monitor Active" : "Monitor Inactive"}
            </span>
          </div>
          <Button
            size="sm"
            variant={status.running ? "destructive" : "default"}
            className={
              status.running
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }
            onClick={status.running ? stopMonitor : startMonitor}
            disabled={monitorLoading}
          >
            {monitorLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status.running ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Monitor
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Monitor
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {logs.map((log) => (
          <div key={log.id} className={getLogStyle(log)}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">
                {new Date(log.timestamp).toLocaleString()}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${getLogLevelStyle(log)}`}
              >
                {log.level}
              </span>
            </div>
            <p className="mt-1">{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
