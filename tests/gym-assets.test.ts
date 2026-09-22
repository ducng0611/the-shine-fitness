import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { parseCollectedAssets, verifySourceManifest, ASSET_HEADERS } from '../scripts/prepare-gym-assets';
import { makePlan } from '../server/src/companion/training/planner';
import { context, readiness, NOW } from './training/helpers';
import type { RecordObject } from '../shared/training';
const csv = readFileSync('data/the-shine-gym-assets.collected.csv','utf8');
const bundle = parseCollectedAssets(csv);
const manifest = JSON.parse(readFileSync('data/the-shine-gym-assets.sources.json','utf8'));
function altered(change: (rows: string[][])=>void): string {
  const rows = parse(csv,{bom:true}) as string[][]; change(rows);
  return rows.map(r=>r.map(c=>'"'+c.replace(/"/g,'""')+'"').join(',')).join('\n')+'\n';
}
function cell(rows: string[][], key: string, value: string) { rows[1][ASSET_HEADERS.indexOf(key as any)] = value; }
test('intake: CSV and source manifest preserve 20 original lines, 21 types and 25 records',()=>{
  verifySourceManifest(bundle,manifest);
  assert.deepEqual(bundle.counts,{sourceLines:20,normalizedTypes:21,assetRecords:25,byKind:{machine:17,bench:3,training_area:3,frame:1,equipment_set:1}});
});
test('intake: preserves separate barbell benches and incline chest machine names',()=>{
  assert.equal(bundle.equipment.filter(e=>e.name==='Incline Barbell Bench Press').length,1);
  assert.equal(bundle.equipment.filter(e=>e.name==='Incline Chest Machine').length,1);
  assert.equal(bundle.equipment.filter(e=>e.name==='Barbell Bench Press').length,2);
});
test('intake: BOM and non-BOM CSV have identical results',()=>assert.deepEqual(parseCollectedAssets(csv.replace(/^\uFEFF/,'')),bundle));
test('intake: all physical/unit records have unique stable internal IDs',()=>assert.equal(new Set(bundle.equipment.map(e=>e.id)).size,25));
test('intake: treadmill quantity is 3 from current list, quote discrepancy retained separately',()=>{
  assert.equal(bundle.equipment.filter(e=>e.inventory.groupId==='treadmill').length,3);
  const issue=manifest.unresolvedIssues.find((i:any)=>i.id==='Q01');assert.equal(issue.userStatement,3);assert.equal(issue.quotationObservation,4);assert.equal(issue.status,'unresolved');
});
test('intake: bikes and repeated benches are separate records',()=>{
  assert.equal(bundle.equipment.filter(e=>e.inventory.groupId==='exercise_bike').length,2);
  assert.equal(bundle.equipment.filter(e=>e.inventory.groupId==='barbell_bench_press').length,2);
});
test('intake: hip adduction/abduction remains one asset',()=>assert.equal(bundle.equipment.filter(e=>e.inventory.groupId==='hip_adduction_abduction').length,1));
test('intake: dumbbell area stores range but does not invent pairs, increments or individual counts',()=>{
  const e=bundle.equipment.find(e=>e.inventory.groupId==='dumbbell_area')!;
  assert.equal(e.assetKind,'training_area');assert.equal(e.inventory.reportedGroupQuantity,1);
  assert.deepEqual(e.inventory.weightRangeKg,{min:1,max:30});assert(!('pairs' in e.inventory));
});
test('intake: area and set records are not converted into floor-plan zones or individual ring counts',()=>{
  assert.deepEqual(bundle.zones,[]);assert.equal(bundle.equipment.filter(e=>e.assetKind==='training_area').length,3);
  assert.equal(bundle.equipment.find(e=>e.inventory.groupId==='gymnastic_rings')!.assetKind,'equipment_set');
});
test('intake: real reported data is not synthetic or planner-verified',()=>{
  assert(bundle.equipment.every(e=>!e.SAMPLE_DATA_ONLY&&!e.verified&&e.reviewStatus==='draft'));
  assert.equal(bundle.readyForPlanner,false);assert.deepEqual(bundle.exercises,[]);
});
test('intake: unknown function stays null, not healthy or broken',()=>assert(bundle.equipment.every(e=>e.isFunctional===null&&e.operationalStatus==='unverified')));
test('intake: no unsupported brand/model/location/category/muscle/cue is added',()=>{
  for(const e of bundle.equipment){
    assert.equal(e.brand,null);assert.equal(e.modelNumber,null);assert.equal(e.zoneId,null);assert.equal(e.floor,null);assert.equal(e.category,null);
    assert.deepEqual(e.primaryMuscleGroups,[]);assert.deepEqual(e.contraindications,[]);assert.equal(e.verifiedBy,null);assert(!('trainerCues'in e));
  }
});
test('intake: original Vietnamese source text is preserved, including combined cardio line',()=>{
  for(const e of bundle.equipment) assert.equal(e.source.text,manifest.originalList[e.source.line-1].text);
  assert.equal(bundle.equipment.filter(e=>e.source.line===13).length,5);
});
test('intake: attempted verification in CSV is rejected',()=>assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'verified','true')))));
test('intake: reviewer spoofing is rejected',()=>assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'verifiedBy','untrusted')))));
test('intake: operational status cannot be set by preparation',()=>assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'operationalStatus','operational')))));
test('intake: functionality coercion cannot occur',()=>{
  for(const value of ['true','false','0','1',''])assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'isFunctional',value))));
});
test('intake: malformed JSON arrays and duplicate muscle labels rejected',()=>{
  for(const value of ['chest','{}','["chest","chest"]'])assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'primaryMuscleGroups',value))));
});
test('intake: duplicate IDs rejected',()=>assert.throws(()=>parseCollectedAssets(altered(r=>{r[2][0]=r[1][0];}))));
test('intake: missing unit in a quantity group rejected', () => {
  const missingUnit = altered(rows => {
    rows.splice(rows.findIndex(row => row[0] === 'shine_treadmill_03'), 1);
  });
  assert.throws(() => parseCollectedAssets(missingUnit));
});
test('intake: duplicate unit ordinals rejected',()=>assert.throws(()=>parseCollectedAssets(altered(r=>{const idx=r.findIndex(row=>row[0]==='shine_treadmill_02');r[idx][ASSET_HEADERS.indexOf('unitIndex')]='1';}))));
test('intake: extra/missing/duplicate headers rejected',()=>{
  assert.throws(()=>parseCollectedAssets(altered(r=>{r[0][1]=r[0][0];})));
  assert.throws(()=>parseCollectedAssets(altered(r=>{r.forEach(row=>row.pop());})));
});
test('intake: empty input and path-like asset IDs rejected',()=>{
  assert.throws(()=>parseCollectedAssets(''));
  assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'id','../member-a'))));
});
test('intake: formula-like CSV content rejected',()=>assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'name','=HYPERLINK("bad")')))));
test('intake: edited source text detected by manifest',()=>{
  const changed=structuredClone(bundle);changed.equipment[0].source.text='different source';assert.throws(()=>verifySourceManifest(changed,manifest));
});
test('intake: unknown date or invalid numeric quantity rejected',()=>{
  assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'sourceReceivedOn','2026-02-30'))));
  assert.throws(()=>parseCollectedAssets(altered(r=>cell(r,'reportedGroupQuantity','1.5'))));
});
test('intake: collected assets do not make a gym-grounded workout',()=>{
  const result=makePlan(context(),readiness(),{zones:[],equipment:bundle.equipment as unknown as RecordObject[],exercises:[],revision:'intake-test',fetchedAt:new Date(NOW).toISOString(),availability:'available'},NOW,'intake-plan','intake-hash');
  assert.equal(result.status,'ready');if(result.status==='ready'){assert.equal(result.plan.mode,'personalized_general');assert.equal(result.plan.kind,'structure_only');assert.deepEqual(result.plan.exercises,[]);}
});
