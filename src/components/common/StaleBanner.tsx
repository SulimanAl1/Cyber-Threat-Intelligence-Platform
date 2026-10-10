import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const StaleBanner: React.FC = () => {
  const { isStale, meta, refreshData } = useData();

  if (!isStale && meta) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Data Freshness Notice:</strong> Intelligence snapshot was generated at{' '}
          {meta ? new Date(meta.generatedAt).toLocaleString() : 'an earlier date'}. Some upstream feeds may be stale or awaiting scheduled pipeline refresh.
        </span>
      </div>
      <button
        onClick={() => refreshData()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-medium transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Reload Snapshot</span>
      </button>
    </div>
  );
};
