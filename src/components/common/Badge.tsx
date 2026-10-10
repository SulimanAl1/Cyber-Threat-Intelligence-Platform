import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  HelpCircle,
  Radio,
  FileQuestion
} from 'lucide-react';
import { DataStatus, EvidenceLevel } from '../../types/schemas';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export const SeverityBadge: React.FC<{ severity: SeverityLevel; className?: string }> = ({ severity, className = '' }) => {
  switch (severity) {
    case 'Critical':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 ${className}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>CRITICAL</span>
        </span>
      );
    case 'High':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>HIGH</span>
        </span>
      );
    case 'Medium':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
          <span>MEDIUM</span>
        </span>
      );
    case 'Low':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 ${className}`}>
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>LOW</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 ${className}`}>
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>INFO</span>
        </span>
      );
  }
};

export const DataStatusBadge: React.FC<{ status: DataStatus; className?: string }> = ({ status, className = '' }) => {
  switch (status) {
    case 'Confirmed':
      return (
        <span title="Officially confirmed by government CERT or affected victim statement" className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${className}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Confirmed</span>
        </span>
      );
    case 'Reported':
      return (
        <span title="Reported in independent technology or security journalism" className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 ${className}`}>
          <FileText className="w-3 h-3 text-cyan-400" />
          <span>Reported</span>
        </span>
      );
    case 'Claimed':
      return (
        <span title="Attacker extortion leak-site claim (unverified victim)" className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 ${className}`}>
          <Radio className="w-3 h-3 text-purple-400" />
          <span>Claimed</span>
        </span>
      );
    case 'Inferred':
      return (
        <span title="Derived by automated dashboard rules and gazetteer heuristics" className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 ${className}`}>
          <HelpCircle className="w-3 h-3 text-amber-400" />
          <span>Inferred</span>
        </span>
      );
    case 'Simulated':
      return (
        <span title="Synthetic demo dataset for test visualization" className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30 ${className}`}>
          <FileQuestion className="w-3 h-3 text-slate-400" />
          <span>Simulated</span>
        </span>
      );
  }
};

export const EvidenceLevelBadge: React.FC<{ level: EvidenceLevel; className?: string }> = ({ level, className = '' }) => {
  switch (level) {
    case 'Confirmed':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${className}`}>
          <span>Official Advisory</span>
        </span>
      );
    case 'Vendor-assessed':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 ${className}`}>
          <span>Vendor-Assessed</span>
        </span>
      );
    case 'Claimed':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 ${className}`}>
          <span>Extortion Claim</span>
        </span>
      );
    case 'Keyword-mention':
      return (
        <span title="Group name appeared in text as background context, NOT attributed." className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30 ${className}`}>
          <span>Mentioned in text</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ${className}`}>
          <span>Reported</span>
        </span>
      );
  }
};
