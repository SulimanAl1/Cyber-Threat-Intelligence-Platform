import { z } from 'zod';

export const DataStatusSchema = z.enum([
  'Confirmed',
  'Reported',
  'Claimed',
  'Inferred',
  'Simulated'
]);
export type DataStatus = z.infer<typeof DataStatusSchema>;

export const EvidenceLevelSchema = z.enum([
  'Confirmed',
  'Vendor-assessed',
  'Reported',
  'Claimed',
  'Keyword-mention'
]);
export type EvidenceLevel = z.infer<typeof EvidenceLevelSchema>;

export const IncidentCategorySchema = z.enum([
  'Ransomware',
  'Data Breach',
  'Exploited Vulnerability',
  'DDoS',
  'APT / Espionage',
  'Supply Chain',
  'Malware / Botnet',
  'Phishing / Credential Theft',
  'Critical Infrastructure',
  'General Cyber Incident'
]);
export type IncidentCategory = z.infer<typeof IncidentCategorySchema>;

export const LocationEntitySchema = z.object({
  country: z.string(),
  countryCode: z.string(), // ISO2 or ISO3
  region: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  evidenceText: z.string().optional()
});
export type LocationEntity = z.infer<typeof LocationEntitySchema>;

export const ExtractedIndicatorSchema = z.object({
  id: z.string(),
  type: z.enum(['ip', 'domain', 'url', 'hash', 'cve']),
  raw: z.string(),
  defanged: z.string(),
  context: z.string().optional()
});
export type ExtractedIndicator = z.infer<typeof ExtractedIndicatorSchema>;

export const ActorMentionSchema = z.object({
  name: z.string(),
  mitreId: z.string().optional(),
  attributionLevel: EvidenceLevelSchema,
  evidenceSnippet: z.string().optional()
});
export type ActorMention = z.infer<typeof ActorMentionSchema>;

export const PriorityFactorBreakdownSchema = z.object({
  cisaKevPoints: z.number(),
  ransomwarePoints: z.number(),
  epssPoints: z.number(),
  cvssPoints: z.number(),
  evidencePoints: z.number(),
  corroborationPoints: z.number(),
  recencyDecay: z.number(),
  baseSum: z.number(),
  finalScore: z.number(),
  summary: z.string()
});
export type PriorityFactorBreakdown = z.infer<typeof PriorityFactorBreakdownSchema>;

export const StatedFinancialImpactSchema = z.object({
  amountText: z.string(),
  detectedCurrency: z.string().optional(),
  statedContext: z.string()
});
export type StatedFinancialImpact = z.infer<typeof StatedFinancialImpactSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  contentSnippet: z.string().optional(),
  date: z.string(), // ISO date YYYY-MM-DD
  url: z.string(),
  sourceId: z.string(),
  sourceName: z.string(),
  dataStatus: DataStatusSchema,
  evidenceLevel: EvidenceLevelSchema,
  clusterId: z.string().optional(),
  category: IncidentCategorySchema,
  whyCategory: z.object({
    rule: z.string(),
    matchedKeywords: z.array(z.string())
  }),
  targetOrg: z.string().optional(),
  sector: z.string().optional(),
  victimLocation: LocationEntitySchema.optional(),
  affectedOrganizationLocation: LocationEntitySchema.optional(),
  reportedActivityLocation: LocationEntitySchema.optional(),
  suspectedOrigin: LocationEntitySchema.optional(),
  cves: z.array(z.string()).default([]),
  actors: z.array(ActorMentionSchema).default([]),
  indicators: z.array(ExtractedIndicatorSchema).default([]),
  costs: StatedFinancialImpactSchema.optional(),
  priorityScore: z.number().min(0).max(100),
  priorityFactors: PriorityFactorBreakdownSchema,
  fetchedAt: z.string(),
  isStale: z.boolean().optional()
});
export type Incident = z.infer<typeof IncidentSchema>;

export const SupportingReportSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  sourceName: z.string(),
  title: z.string(),
  url: z.string(),
  date: z.string()
});
export type SupportingReport = z.infer<typeof SupportingReportSchema>;

export const EventClusterSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: IncidentCategorySchema,
  primaryIncidentId: z.string(),
  incidentIds: z.array(z.string()),
  supportingReports: z.array(SupportingReportSchema),
  sourceCount: z.number(),
  sources: z.array(z.string()),
  firstSeen: z.string(),
  lastSeen: z.string(),
  cves: z.array(z.string()),
  actors: z.array(ActorMentionSchema),
  targetOrg: z.string().optional(),
  sector: z.string().optional(),
  victimCountry: z.string().optional(),
  maxPriorityScore: z.number()
});
export type EventCluster = z.infer<typeof EventClusterSchema>;

export const VulnerabilitySchema = z.object({
  cveId: z.string(),
  vendorProject: z.string(),
  product: z.string(),
  description: z.string(),
  cvssScore: z.number().optional(),
  cvssVersion: z.string().optional(),
  cvssVector: z.string().optional(),
  epssScore: z.number().optional(),
  epssPercentile: z.number().optional(),
  inKev: z.boolean(),
  kevDateAdded: z.string().optional(),
  kevDueDate: z.string().optional(),
  requiredAction: z.string().optional(),
  knownRansomwareUse: z.enum(['Known', 'Unknown']).default('Unknown'),
  notes: z.string().optional(),
  references: z.array(z.string()).default([]),
  lastModified: z.string()
});
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;

export const ThreatActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  description: z.string(),
  mitreId: z.string().optional(),
  mitreUrl: z.string().optional(),
  country: z.string().optional(),
  techniques: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
  software: z.array(z.string()).default([]),
  targetSectors: z.array(z.string()).default([]),
  targetCountries: z.array(z.string()).default([]),
  linkedIncidentIds: z.array(z.string()).default([])
});
export type ThreatActor = z.infer<typeof ThreatActorSchema>;

export const IndicatorSchema = z.object({
  id: z.string(),
  type: z.enum(['ip', 'domain', 'url', 'hash']),
  value: z.string(),
  defangedValue: z.string(),
  raw: z.string().optional(),
  defanged: z.string().optional(),
  threatType: z.string(),
  malware: z.string().optional(),
  source: z.string(),
  firstSeen: z.string()
});
export type Indicator = z.infer<typeof IndicatorSchema>;

export const SourceStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  trustTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(['healthy', 'degraded', 'error', 'not_configured']),
  lastSuccess: z.string().nullable(),
  lastAttempt: z.string().nullable(),
  latencyMs: z.number(),
  itemCount: z.number(),
  consecutiveFailures: z.number(),
  lastErrorMessage: z.string().optional(),
  license: z.string(),
  uptime7DaysPercent: z.number()
});
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

export const MetaSchema = z.object({
  schemaVersion: z.string(),
  generatedAt: z.string(),
  incidentCount: z.number(),
  clusterCount: z.number(),
  vulnerabilityCount: z.number(),
  actorCount: z.number(),
  indicatorCount: z.number(),
  dateRangeStart: z.string(),
  dateRangeEnd: z.string()
});
export type Meta = z.infer<typeof MetaSchema>;
