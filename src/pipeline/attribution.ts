import { ActorMention, EvidenceLevel, DataStatus } from '../types/schemas';

interface KnownActorPattern {
  name: string;
  mitreId?: string;
  patterns: RegExp[];
}

const KNOWN_ACTORS: KnownActorPattern[] = [
  { name: 'LockBit', mitreId: 'G0100', patterns: [/\b(lockbit(?:\s*3\.0|\s*2\.0|\s*black)?)\b/i] },
  { name: 'APT29', mitreId: 'G0016', patterns: [/\b(apt29|midnight blizzard|cozy bear|nobelium)\b/i] },
  { name: 'Lazarus Group', mitreId: 'G0032', patterns: [/\b(lazarus|hidden cobra|zinc)\b/i] },
  { name: 'Cl0p', mitreId: 'G0088', patterns: [/\b(cl0p|clop|ta505)\b/i] },
  { name: 'ALPHV / BlackCat', mitreId: 'G1004', patterns: [/\b(alphv|blackcat)\b/i] },
  { name: 'Sandworm Team', mitreId: 'G0034', patterns: [/\b(sandworm|telebots|voodoo bear|apt44)\b/i] },
  { name: 'Volt Typhoon', mitreId: 'G1017', patterns: [/\b(volt typhoon|bronze silhouette)\b/i] },
  { name: 'Scattered Spider', mitreId: 'G1015', patterns: [/\b(scattered spider|unc3944|0ktapus)\b/i] },
  { name: 'Qilin', patterns: [/\b(qilin|agenda ransomware)\b/i] },
  { name: 'Killnet', patterns: [/\b(killnet)\b/i] },
  { name: 'Anonymous Sudan', patterns: [/\b(anonymous sudan)\b/i] },
  { name: 'Rhysida', patterns: [/\b(rhysida)\b/i] },
  { name: 'Akira', patterns: [/\b(akira ransomware)\b/i] },
  { name: 'BianLian', patterns: [/\b(bianlian)\b/i] }
];

export interface AttributionEvaluation {
  actors: ActorMention[];
  overallEvidenceLevel: EvidenceLevel;
  suggestedDataStatus: DataStatus;
}

export function evaluateAttribution(params: {
  title: string;
  summary: string;
  sourceType: string;
  sourceTrustTier: 1 | 2 | 3;
}): AttributionEvaluation {
  const combined = `${params.title} ${params.summary}`;
  const lower = combined.toLowerCase();
  const foundActors: ActorMention[] = [];

  for (const actor of KNOWN_ACTORS) {
    for (const pat of actor.patterns) {
      const match = combined.match(pat);
      if (match) {
        // Evaluate context to determine if this is attribution or merely keyword mention
        const idx = match.index || 0;
        const start = Math.max(0, idx - 40);
        const end = Math.min(combined.length, idx + match[0].length + 60);
        const snippet = combined.slice(start, end).replace(/\s+/g, ' ').trim();

        let level: EvidenceLevel = 'Keyword-mention';

        if (params.sourceType === 'ransomware_live') {
          // Attacker leak site self-claim
          level = 'Claimed';
        } else if (params.sourceTrustTier === 1 && (lower.includes('attributed to') || lower.includes('conducted by') || lower.includes('cisa alert') || lower.includes('advisory'))) {
          // Official government or CERT confirmed attribution
          level = 'Confirmed';
        } else if (lower.includes('researchers attribute') || lower.includes('mandiant') || lower.includes('crowdstrike') || lower.includes('sentinelone') || lower.includes('attributed by')) {
          // Named security vendor attribution
          level = 'Vendor-assessed';
        } else {
          // If no attribution evidence language exists, strictly keyword mention!
          level = 'Keyword-mention';
        }

        foundActors.push({
          name: actor.name,
          mitreId: actor.mitreId,
          attributionLevel: level,
          evidenceSnippet: `"...${snippet}..."`
        });
        break; // Match once per actor
      }
    }
  }

  // Determine overall record dataStatus based strictly on record evidence (Rule 6)
  let suggestedDataStatus: DataStatus = 'Reported';
  let overallEvidenceLevel: EvidenceLevel = 'Reported';

  if (params.sourceType === 'ransomware_live') {
    suggestedDataStatus = 'Claimed';
    overallEvidenceLevel = 'Claimed';
  } else if (params.sourceTrustTier === 1) {
    suggestedDataStatus = 'Confirmed';
    overallEvidenceLevel = 'Confirmed';
  } else {
    // Check if the record content contains official confirmed statements or vendor research
    if (lower.includes('cisa confirmed') || lower.includes('official advisory') || lower.includes('statement by')) {
      suggestedDataStatus = 'Confirmed';
      overallEvidenceLevel = 'Confirmed';
    } else if (lower.includes('vendor-assessed') || lower.includes('threat intelligence report')) {
      suggestedDataStatus = 'Reported';
      overallEvidenceLevel = 'Vendor-assessed';
    } else {
      suggestedDataStatus = 'Reported';
      overallEvidenceLevel = 'Reported';
    }
  }

  return {
    actors: foundActors,
    overallEvidenceLevel,
    suggestedDataStatus
  };
}
