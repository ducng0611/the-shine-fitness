# The Shine: real reported gym asset intake (Step 2 data onboarding)

Received: **2026-09-22**. Based on the owner's 20-line inventory in this conversation and the attached equipment price quotation. This is **real user-reported inventory**, not synthetic data, an onsite inspection or an AI model training job.

## Deliverables

- `data/the-shine-gym-assets.collected.csv`: authoritative editable CSV, UTF-8 with BOM, comma delimiter, one catalogue unit per row.
- `data/the-shine-gym-assets.sources.json`: original 20 statements, 21 normalized groups, counts, image fingerprint and unresolved source differences.
- `data/the-shine-gym-assets.source-review.csv`: four open source-review issues. Do not silently resolve them.
- `shared/collectedGymAssets.ts`: a source-intake DTO using the established GymEquipment field names.
- `scripts/prepare-gym-assets.ts`: deterministic offline validation and draft-JSON generation. No Firebase, Gemini, SMTP, credentials or network calls.
- `tests/gym-assets.test.ts`: source fidelity, parsing and planner-exclusion tests.

Run from repository root after installing locked dependencies:

```sh
npx --no-install tsx scripts/prepare-gym-assets.ts --check
node --import tsx --test tests/gym-assets.test.ts
npx --no-install tsx scripts/prepare-gym-assets.ts --write-draft
```

The last command creates **`data/companion/the-shine-gym-assets.draft.json`**. It is a derived review artifact, not another manually maintained source. The CI artifact includes it. The original `data/companion/gym_catalogue.json` is deliberately unchanged. No startup seeding, Firestore import, RAG indexing, feature-flag change, deployment or merge is performed.

## Counting: 25 records does NOT mean 25 machines

| Count | Meaning |
| --- | --- |
| 20 | Original inventory statements |
| 21 | Normalized types, because the combined cardio statement contains treadmills and bicycles |
| 25 | Individually addressed machine/bench/frame/set/area records |
| 17 | Records called machines in the user's source (including VKR and Roman Chair as supplied) |
| 3 | Bench records: one Incline Barbell Bench Press and two Barbell Bench Press |
| 3 | Area records: Barbell Deadlift, Dumbbell, boxing + functional |
| 1 | Dip Bars frame |
| 1 | Gymnastic Rings set |

Each of the three treadmills, two bicycles and two Barbell Bench Press benches has its own stable internal ID. Unit ordinals are not manufacturer serial numbers, physical locations or evidence of independently photographed machines.

Hip Adduction/Abduction remains **one combined asset**, not two. The Dumbbell area remains **one area**, with only a supplied weight range of **1-30 kg**. No pair count, 1 kg increment, number of dumbbells, rack inventory, bars or plates is inferred. One Gymnastic Rings set does not claim a count of individual rings/straps/anchors. The boxing/functional area does not imply specific bags, ropes, weights or a ring.

## Source conflicts are not concealed

**Q01:** the quotation screenshot's first row shows **4 treadmills**, while the current inventory states **3**. The intake contains the 3 currently reported units; the fourth quotation unit is not added. This is an explicit source-selection policy for a draft, not a resolved discrepancy or onsite count.

**Q02:** dumbbells, mini-dumbbells and racks appear as separate quotation rows. Units, ranges and exact mapping to today's inventory are not sufficiently confirmed. The user's 1-30 kg range is retained without combining quotation totals.

**Q03:** the screenshot includes further items such as racks, plates, kettlebells, steps, mats, rope, sled and ab roller. Their presence in a quotation does not establish current onsite inventory. They remain source-review items, not extra assets added to the 25 records.

**Q04:** flat/incline pressing equipment and multi-purpose benches in the quotation must not be matched to exact installed models solely by visual similarity. Barbell Bench Press, Incline Barbell Bench Press and Incline Chest Machine remain distinct user-supplied names.

No price, customer personal details, bank information or raw quotation image is committed. The source manifest stores only an attachment reference and SHA-256 fingerprint. Manufacturer logos at the top of a vendor quotation do not identify each installed asset's manufacturer.

## Field mapping and missing information

The existing application has `GymEquipment.name`, `nameEn`, `modelNumber`, `brand`, `zoneId`, `floor`, `category`, `operationalStatus`, `isFunctional`, muscle arrays, review flags and revisions. The CSV preserves these names rather than introducing an incompatible `displayName`/`stationId` rewrite.

| Field | Intake behavior |
| --- | --- |
| `id` | Stable internal inventory ID, e.g. `shine_treadmill_01` |
| `name` | Supplied equipment name; no exact model inferred |
| `nameEn`, `brand`, `modelNumber` | Blank unless separately supplied; JSON null |
| `zoneId`, `zoneName`, `floor` | Blank / null; no floor-plan inference from quotation section headings |
| `category` | Blank / null. The mechanism (selectorized, plate loaded, etc.) has not been supplied |
| `operationalStatus` | `unverified`, matching the existing enum for unchecked condition |
| `isFunctional` | Literal `null`, never string-to-Boolean coercion or a default true/false |
| muscle arrays / contraindications | JSON `[]` means no reviewed content supplied, not no risks or no target muscles |
| `reviewStatus`, `verified` | `draft`, false |
| `verifiedBy`, `verifiedAt` | Blank / null, never an invented staff sign-off |
| `SAMPLE_DATA_ONLY` | false: this is real reported source data, not test fixture data |
| `createdAt`, `updatedAt`, `revision` | Intake preparation metadata, not capture time or installed database revision |
| `assetKind`, `quantityUnit` | Preserve whether the user said machine, bench, area, frame or set |
| `inventoryGroupId`, `unitIndex`, `reportedGroupQuantity` | Prevent quantity loss or double-counting during expansion |
| weight range fields | Only the Dumbbell area's reported 1-30 kg range |
| `sourceId`, `sourceLine`, `sourceText` | Trace each row to the exact original statement |
| `reviewNotes` | Explicit unresolved counting/grouping questions, not new gym facts |

Arrays in CSV are JSON arrays. Boolean literals are `true`/`false`; unknown functionality is **`null`**. Never use `Boolean('false')` or `Boolean('null')`.

### Why the draft DTO is separate

The current trusted GymEquipment type requires a concrete category, zone and Boolean functionality. Those facts have not been supplied. `CollectedGymAssetDraft` retains the field names but allows unknown values and enforces `verified: false`. It is intentionally **not assignable as a verified catalogue entry**. Filling missing values solely to satisfy a TypeScript type would invent business facts.

The root JSON carries `kind: collected_gym_assets_draft`, no zones or exercises, `readyForPlanner: false`, and `requiresHumanReview: true`. Do not strip these qualifiers or cast this payload into trusted runtime data.

## Next human-reviewed import, not performed here

1. Confirm source quantities and the Q01-Q04 discrepancies. Assign labels to distinguish repeated units onsite.
2. Provide real zone IDs, location/landmark/directions and condition checks. Area records are not automatically created as verified floor-plan zones.
3. Inspect manufacturer/model labels only where needed; leaving an exact model unknown is better than inventing it.
4. Have authorized staff map the draft to the catalogue, preserving source metadata and setting creation/reviewer timestamps server-side. Use create-only or explicit revision-checked operations; do not overwrite existing records silently.
5. Trainer review remains separate: exercise IDs, required equipment, primary/secondary muscles, cues and approved trainingPrescription. Asset existence alone does not approve an exercise.
6. Only verified, operational equipment with reviewed exercise/location/prescription data may enter the existing gym-grounded planner. The Step 3 general structure remains the expected fallback for this source-only intake.

### Existing UI/import caveat found during inspection

At the baseline, `AdminGymModals.tsx` contains legacy defaults including `The Shine Standard`, `floor1`, a first/default zone and `isFunctional ?? true`. The JSON bulk-import handler in `AdminGymKnowledgeTab.tsx` also counts POST attempts without checking every `res.ok`. **Do not pass this incomplete draft directly through that legacy import/edit path and call it verified.** This data-only change does not claim those existing flows have been rewritten or tested. The next application change should remove fabricated defaults, add an honest unknown state, preview all changes, check responses and apply authorization/revision controls.

## Scope of verification

The source parser and data are tested with no production writes. CI separately runs existing Step 3 tests, type checks and build. A successful build is not source verification, physical inspection, Firebase staging acceptance or a guarantee that all legacy UI flows work. Counts in this document describe **the checked-in source snapshot**, not the current Firestore database, which was not queried in this change.

Technical reference for UTF-8 CSV decoding: https://csv.js.org/parse/options/bom/
