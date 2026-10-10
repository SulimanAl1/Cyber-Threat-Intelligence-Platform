import React, { useState } from 'react';
import { PriorityFactorBreakdown } from '../../types/schemas';
import { Info, X } from 'lucide-react';

interface Props {
  score: number;
  factors: PriorityFactorBreakdown;
  className?: string;
}

export const PriorityScoreChip: React.FC<Props> = ({ score, factors, className = '' }) => {
  const [showModal, setShowModal] = useState(false);

  let colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  if (score >= 80) {
    colorClasses = 'bg-red-500/15 text-red-400 border-red-500/30';
  } else if (score >= 60) {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else if (score >= 40) {
    colorClasses = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-bold border transition-colors hover:brightness-125 ${colorClasses} ${className}`}
        title="View calculated Priority Score factor breakdown"
      >
        <span>{score}</span>
        <span className="text-[10px] font-sans font-normal opacity-80">/100</span>
        <Info className="w-3 h-3 opacity-70" />
      </button>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md p-6 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Priority Score: {score}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">0 - 100</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Factor breakdown & transparent math calculation</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-300">CISA KEV Catalog Listing</span>
                <span className="font-bold text-cyan-400">+{factors.cisaKevPoints} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-300">Known Ransomware Campaign Use</span>
                <span className="font-bold text-red-400">+{factors.ransomwarePoints} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-300">FIRST EPSS Exploitation Probability</span>
                <span className="font-bold text-amber-400">+{factors.epssPoints} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-300">CVSS Base Severity Normalized</span>
                <span className="font-bold text-yellow-400">+{factors.cvssPoints} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-300">Evidence Reliability Level</span>
                <span className="font-bold text-emerald-400">+{factors.evidencePoints} pts</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-300">Multi-Source Corroboration</span>
                <span className="font-bold text-indigo-400">+{factors.corroborationPoints} pts</span>
              </div>
              {factors.recencyDecay > 0 && (
                <div className="flex justify-between items-center p-2 rounded bg-red-950/40 border border-red-800/40">
                  <span className="text-red-300">Incident Age Decay Penalty</span>
                  <span className="font-bold text-red-400">-{factors.recencyDecay} pts</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded bg-slate-950/70 border border-cyan-900/40 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-cyan-400 block mb-1 font-sans">Dashboard Notice:</strong>
              Dashboard priority score (calculated). Not a CVSS score and not an independently verified rating. Configurable via Settings.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
