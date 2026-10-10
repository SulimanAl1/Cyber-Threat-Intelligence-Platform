import { X, RotateCcw, Sliders, Check } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { scoringWeights, updateScoringWeights, resetScoringWeights } = useData();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg p-6 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Priority Score Algorithm Settings</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust mathematical factor weights. Modifies live client ranking in memory.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">CISA KEV Catalog Weight</span>
              <span className="font-bold text-cyan-400">+{scoringWeights.cisaKev} pts</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={scoringWeights.cisaKev}
              onChange={(e) => updateScoringWeights({ ...scoringWeights, cisaKev: Number(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">Known Ransomware Campaign Use</span>
              <span className="font-bold text-red-400">+{scoringWeights.knownRansomware} pts</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={scoringWeights.knownRansomware}
              onChange={(e) => updateScoringWeights({ ...scoringWeights, knownRansomware: Number(e.target.value) })}
              className="w-full accent-red-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">FIRST EPSS Probability Max Points</span>
              <span className="font-bold text-amber-400">+{scoringWeights.epssFactor} pts</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={scoringWeights.epssFactor}
              onChange={(e) => updateScoringWeights({ ...scoringWeights, epssFactor: Number(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">CVSS Base Severity Max Points</span>
              <span className="font-bold text-yellow-400">+{scoringWeights.cvssFactor} pts</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={scoringWeights.cvssFactor}
              onChange={(e) => updateScoringWeights({ ...scoringWeights, cvssFactor: Number(e.target.value) })}
              className="w-full accent-yellow-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">Evidence Level Max Points</span>
              <span className="font-bold text-emerald-400">+{scoringWeights.evidenceTier} pts</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              value={scoringWeights.evidenceTier}
              onChange={(e) => updateScoringWeights({ ...scoringWeights, evidenceTier: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-300">Multi-Source Corroboration Max Points</span>
              <span className="font-bold text-indigo-400">+{scoringWeights.corroboration} pts</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={scoringWeights.corroboration}
              onChange={(e) => updateScoringWeights({ ...scoringWeights, corroboration: Number(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <button
            onClick={resetScoringWeights}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors font-sans"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Weights</span>
          </button>
        </div>
      </div>
    </div>
  );
};
