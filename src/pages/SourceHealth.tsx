import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { SourceStatus as SourceStatusType } from '../types/schemas';

export const SourceHealth: React.FC = () => {
  const { sourceStatuses, refreshData } = useData();

  const healthyCount = sourceStatuses.filter((s: SourceStatusType) => s.status === 'healthy').length;
  const degradedCount = sourceStatuses.filter((s: SourceStatusType) => s.status === 'degraded').length;
  const errorCount = sourceStatuses.filter((s: SourceStatusType) => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Threat Intelligence Source Health</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              {healthyCount}/{sourceStatuses.length} Online
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed telemetry, ingestion latency, failure rates, and upstream licensing terms.
          </p>
        </div>

        <button
          onClick={() => refreshData()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Poll Feeds</span>
        </button>
      </div>

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Connected Feeds</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">{sourceStatuses.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Registry configured</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Operational (HTTP 200)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{healthyCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">100% payload integrity</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Degraded / Retained</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">{degradedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Last-good snapshot active</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Offline / Error</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black font-mono text-red-400">{errorCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Isolated in runner</div>
        </div>
      </div>

      {/* Telemetry Detail Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 font-sans">
              <tr>
                <th className="py-3 px-4">Source / Feed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trust Tier</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Last Success</th>
                <th className="py-3 px-4">License / Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sourceStatuses.map((st: SourceStatusType) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-semibold text-slate-200">{st.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{st.url}</div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                    {st.status === 'healthy' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>HEALTHY</span>
                      </span>
                    ) : st.status === 'degraded' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>STALE / RET</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        <XCircle className="w-3 h-3" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                    <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      Tier {st.trustTier} {st.trustTier === 1 ? '(Authoritative)' : st.trustTier === 2 ? '(News)' : '(Claimed)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                    {st.latencyMs} ms
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-bold text-cyan-400">
                    {st.itemCount}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                    {st.lastSuccess ? new Date(st.lastSuccess).toLocaleTimeString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400 font-sans max-w-xs truncate">
                    {st.license}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
