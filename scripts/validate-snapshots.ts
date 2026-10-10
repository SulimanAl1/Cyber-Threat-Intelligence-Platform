import fs from 'node:fs';
import path from 'node:path';
import {
  IncidentSchema,
  EventClusterSchema,
  VulnerabilitySchema,
  ThreatActorSchema,
  IndicatorSchema,
  SourceStatusSchema,
  MetaSchema
} from '../src/types/schemas';

const PUBLIC_DATA_DIR = path.resolve(process.cwd(), 'public/data');

function validateFile(fileName: string, validator: (item: any) => void) {
  const filePath = path.join(PUBLIC_DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot file missing: ${fileName}`);
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (Array.isArray(content)) {
    console.log(`Validating ${content.length} items in ${fileName}...`);
    for (const item of content) {
      validator(item);
    }
  } else {
    console.log(`Validating object in ${fileName}...`);
    validator(content);
  }
}

try {
  console.log('=== RUNNING SNAPSHOT SCHEMA VALIDATION GATE ===');
  validateFile('incidents.json', (item) => IncidentSchema.parse(item));
  validateFile('clusters.json', (item) => EventClusterSchema.parse(item));
  validateFile('vulnerabilities.json', (item) => VulnerabilitySchema.parse(item));
  validateFile('actors.json', (item) => ThreatActorSchema.parse(item));
  validateFile('indicators.json', (item) => IndicatorSchema.parse(item));
  validateFile('source-status.json', (item) => SourceStatusSchema.parse(item));
  validateFile('meta.json', (item) => MetaSchema.parse(item));
  console.log('ALL SNAPSHOTS PASSED SCHEMA VALIDATION!');
  process.exit(0);
} catch (err: any) {
  console.error('SCHEMA VALIDATION FAILED:', err.message);
  process.exit(1);
}
