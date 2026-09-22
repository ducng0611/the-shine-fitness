/** Offline source-data preparation only. No model, credentials or database writes. */
import { parse } from 'csv-parse/sync';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import type { AssetKind, CollectedAssetsBundle, CollectedGymAssetDraft } from '../shared/collectedGymAssets';

export const ASSET_HEADERS = [
  'id','name','nameEn','modelNumber','brand','zoneId','zoneName','floor','category',
  'operationalStatus','isFunctional','primaryMuscleGroups','secondaryMuscleGroups',
  'contraindications','safetyNotes','photoUrl','reviewStatus','verified','verifiedBy',
  'verifiedAt','revision','SAMPLE_DATA_ONLY','createdAt','updatedAt','assetKind',
  'inventoryGroupId','unitIndex','reportedGroupQuantity','quantityUnit',
  'weightRangeMinKg','weightRangeMaxKg','sourceId','sourceLine','sourceReceivedOn',
  'sourceText','reviewNotes'
] as const;
const KINDS: AssetKind[] = ['machine','bench','training_area','frame','equipment_set'];
const CATEGORIES = ['cardio','selectorized_machine','plate_loaded_machine','free_weight',
  'cable_station','bodyweight_functional','recovery_mobility','boxing','studio_groupx'];
function requireValue(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
const optional = (v: string): string | null => v === '' ? null : v;
function integer(v: string, field: string, max = 5000): number {
  requireValue(/^[1-9]\d*$/.test(v), `${field}: positive integer required.`);
  const n = Number(v); requireValue(Number.isSafeInteger(n) && n <= max, `${field}: out of range.`); return n;
}
function identifier(v: string, field: string): string {
  requireValue(/^[a-z0-9][a-z0-9_-]{0,99}$/.test(v), `${field}: invalid identifier.`); return v;
}
function timestamp(v: string, field: string): string {
  requireValue(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v) && Number.isFinite(Date.parse(v)), `${field}: UTC timestamp required.`);
  requireValue(new Date(v).toISOString().replace('.000Z','Z') === v.replace('.000Z','Z'), `${field}: invalid calendar date.`);
  return v;
}
function stringArray(v: string, field: string): string[] {
  let a: unknown; try { a = JSON.parse(v); } catch { throw new Error(`${field}: JSON array required.`); }
  requireValue(Array.isArray(a) && a.length <= 50 && a.every(x => typeof x === 'string' && x.trim().length > 0), `${field}: string array required.`);
  requireValue(new Set(a).size === a.length, `${field}: duplicate entries.`); return a as string[];
}
function weightRange(min: string, max: string): { min: number; max: number } | null {
  if (min === '' && max === '') return null;
  requireValue(/^\d+(?:\.\d+)?$/.test(min) && /^\d+(?:\.\d+)?$/.test(max), 'Both weight range endpoints must be supplied.');
  const a = Number(min), b = Number(max);
  requireValue(a > 0 && b >= a && b <= 1000, 'Invalid reported weight range.'); return { min: a, max: b };
}
export function parseCollectedAssets(input: string | Buffer): CollectedAssetsBundle {
  requireValue(Buffer.byteLength(input) <= 2_000_000, 'CSV exceeds 2 MB intake limit.');
  const rows = parse(input, {
    bom: true, skip_empty_lines: true, relax_column_count: false, max_record_size: 20_000,
    columns: (headers: string[]) => {
      requireValue(headers.length === ASSET_HEADERS.length && headers.every((h, i) => h === ASSET_HEADERS[i]), 'Unexpected, missing, reordered or duplicate CSV headers.');
      return headers;
    }
  }) as Record<string,string>[];
  requireValue(rows.length > 0 && rows.length <= 5000, 'Intake requires 1-5000 records.');
  const ids = new Set<string>();
  const equipment: CollectedGymAssetDraft[] = rows.map((r, index) => {
    const label = `Row ${index + 2}`;
    for (const [key,value] of Object.entries(r)) {
      requireValue(typeof value === 'string' && value.length <= 5000 && !value.includes('\0'), `${label}: invalid ${key}.`);
      requireValue(!/^[\s]*[=+@]/.test(value), `${label}: spreadsheet formula-like value in ${key}.`);
    }
    identifier(r.id, `${label} id`); requireValue(!ids.has(r.id), `${label}: duplicate asset ID.`); ids.add(r.id);
    requireValue(!!r.name.trim() && !!r.sourceText.trim(), `${label}: name and source text required.`);
    requireValue(r.reviewStatus === 'draft' && r.verified === 'false' && r.SAMPLE_DATA_ONLY === 'false', `${label}: intake must be real-reported draft, never verified or synthetic.`);
    requireValue(r.verifiedBy === '' && r.verifiedAt === '', `${label}: source intake cannot assert a reviewer.`);
    requireValue(r.operationalStatus === 'unverified' && r.isFunctional === 'null', `${label}: condition has not been checked; do not coerce unknown to true or false.`);
    requireValue(KINDS.includes(r.assetKind as AssetKind), `${label}: invalid asset kind.`);
    requireValue(r.category === '' || CATEGORIES.includes(r.category), `${label}: unsupported category.`);
    requireValue(/^\d{4}-\d\d-\d\d$/.test(r.sourceReceivedOn) && new Date(r.sourceReceivedOn).toISOString().slice(0,10) === r.sourceReceivedOn, `${label}: invalid received date.`);
    requireValue(!!r.quantityUnit.trim(), `${label}: source unit required.`);
    const n = integer(r.unitIndex, 'unitIndex'), quantity = integer(r.reportedGroupQuantity, 'reportedGroupQuantity');
    requireValue(n <= quantity, `${label}: unitIndex exceeds reported quantity.`);
    return {
      id: r.id, name: r.name, nameEn: optional(r.nameEn), modelNumber: optional(r.modelNumber),
      brand: optional(r.brand), zoneId: optional(r.zoneId), zoneName: optional(r.zoneName),
      floor: optional(r.floor), category: optional(r.category) as CollectedGymAssetDraft['category'],
      operationalStatus: 'unverified', isFunctional: null,
      primaryMuscleGroups: stringArray(r.primaryMuscleGroups, 'primaryMuscleGroups'),
      secondaryMuscleGroups: stringArray(r.secondaryMuscleGroups, 'secondaryMuscleGroups'),
      contraindications: stringArray(r.contraindications, 'contraindications'),
      safetyNotes: optional(r.safetyNotes), photoUrl: optional(r.photoUrl), reviewStatus: 'draft',
      verified: false, verifiedBy: null, verifiedAt: null, revision: integer(r.revision, 'revision'),
      SAMPLE_DATA_ONLY: false, createdAt: timestamp(r.createdAt,'createdAt'), updatedAt: timestamp(r.updatedAt,'updatedAt'),
      assetKind: r.assetKind as AssetKind,
      inventory: { groupId: identifier(r.inventoryGroupId,'inventoryGroupId'), unitIndex: n,
        reportedGroupQuantity: quantity, quantityUnit: r.quantityUnit,
        weightRangeKg: weightRange(r.weightRangeMinKg,r.weightRangeMaxKg), reviewNotes: r.reviewNotes },
      source: { id: identifier(r.sourceId,'sourceId'), type: 'user_provided_inventory',
        line: integer(r.sourceLine,'sourceLine'), receivedOn: r.sourceReceivedOn, text: r.sourceText }
    };
  });
  const sourceIds = new Set(equipment.map(e => e.source.id));
  requireValue(sourceIds.size === 1, 'Use one source inventory per intake file.');
  const groupMap = new Map<string,CollectedGymAssetDraft[]>();
  const sourceLines = new Map<number,string>();
  for (const e of equipment) {
    const old = sourceLines.get(e.source.line);
    requireValue(old === undefined || old === e.source.text, 'Same source line has inconsistent text.');
    sourceLines.set(e.source.line, e.source.text);
    groupMap.set(e.inventory.groupId, [...(groupMap.get(e.inventory.groupId) ?? []), e]);
  }
  for (const [key,group] of groupMap) {
    const first = group[0];
    requireValue(group.length === first.inventory.reportedGroupQuantity, `${key}: record count does not equal the reported group quantity.`);
    requireValue(group.every(e => e.name === first.name && e.assetKind === first.assetKind &&
      e.inventory.reportedGroupQuantity === first.inventory.reportedGroupQuantity &&
      e.inventory.quantityUnit === first.inventory.quantityUnit && e.source.line === first.source.line &&
      e.source.receivedOn === first.source.receivedOn && isDeepStrictEqual(e.inventory.weightRangeKg, first.inventory.weightRangeKg)), `${key}: inconsistent source group.`);
    requireValue(new Set(group.map(e=>e.inventory.unitIndex)).size === group.length, `${key}: duplicate unit ordinal.`);
  }
  const byKind: CollectedAssetsBundle['counts']['byKind'] = {};
  for (const e of equipment) byKind[e.assetKind] = (byKind[e.assetKind] ?? 0) + 1;
  return { schemaVersion: 1, kind: 'collected_gym_assets_draft', sourceId: equipment[0].source.id,
    preparedAt: equipment.map(e=>e.createdAt).sort().at(-1)!, zones: [], equipment, exercises: [],
    counts: { sourceLines: sourceLines.size, normalizedTypes: groupMap.size, assetRecords: equipment.length, byKind },
    readyForPlanner: false, requiresHumanReview: true };
}
export function verifySourceManifest(bundle: CollectedAssetsBundle, manifest: any): void {
  requireValue(manifest?.sourceId === bundle.sourceId && manifest?.schemaVersion === 1, 'Source manifest does not match intake.');
  requireValue(Array.isArray(manifest.originalList) && Array.isArray(manifest.normalizedGroups), 'Invalid source manifest.');
  requireValue(isDeepStrictEqual(bundle.counts,manifest.counts), 'Manifest counts do not match the actual CSV.');
  requireValue(manifest.originalList.length === bundle.counts.sourceLines && manifest.normalizedGroups.length === bundle.counts.normalizedTypes, 'Manifest list sizes do not match.');
  for (const e of bundle.equipment) {
    const line = manifest.originalList.filter((l: any)=>l.line === e.source.line);
    const group = manifest.normalizedGroups.filter((g: any)=>g.id === e.inventory.groupId);
    requireValue(line.length === 1 && line[0].text === e.source.text, `${e.id}: original user statement changed.`);
    requireValue(group.length === 1 && group[0].name === e.name && group[0].sourceLine === e.source.line && group[0].quantity === e.inventory.reportedGroupQuantity && group[0].assetKind === e.assetKind && group[0].quantityUnit === e.inventory.quantityUnit, `${e.id}: normalized group no longer matches source manifest.`);
  }
}
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  requireValue(args.length <= 1 && (!args.length || ['--check','--write-draft'].includes(args[0])), 'Usage: npx tsx scripts/prepare-gym-assets.ts [--check|--write-draft]');
  const csvPath = resolve('data/the-shine-gym-assets.collected.csv');
  const jsonPath = resolve('data/companion/the-shine-gym-assets.draft.json');
  const manifest = JSON.parse(await readFile(resolve('data/the-shine-gym-assets.sources.json'),'utf8'));
  const bundle = parseCollectedAssets(await readFile(csvPath)); verifySourceManifest(bundle,manifest);
  if (args[0] === '--write-draft') await writeFile(jsonPath, JSON.stringify(bundle,null,2)+'\n','utf8');
  // --check only validates the authoritative CSV and source manifest. Derived
  // JSON is generated explicitly; it is not a second hand-edited source of truth.
  console.log(JSON.stringify({ ...bundle.counts, verifiedAssets: 0, readyForPlanner: false,
    sourceId: bundle.sourceId, databaseWrites: 0, mode: args[0] ?? 'preview' },null,2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error instanceof Error ? error.message : 'Asset intake failed.'); process.exitCode = 1; });
}
