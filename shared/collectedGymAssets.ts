import type { GymEquipment, EquipmentCategory } from '../src/types/companion';

/** Source intake, NOT a verified GymEquipment. Null means not supplied, not false.
 * Keeping a distinct DTO prevents an incomplete source snapshot from silently
 * becoming a planner-ready catalogue or bypassing the normal human review.
 */
type NullableField = 'nameEn' | 'modelNumber' | 'brand' | 'zoneId' | 'zoneName' |
  'floor' | 'category' | 'isFunctional' | 'safetyNotes' | 'photoUrl' |
  'verifiedBy' | 'verifiedAt' | 'verified' | 'reviewStatus';
export type AssetKind = 'machine' | 'bench' | 'training_area' | 'frame' | 'equipment_set';
export type CollectedGymAssetDraft = Omit<GymEquipment, NullableField> & {
  nameEn: string | null;
  modelNumber: string | null;
  brand: string | null;
  zoneId: string | null;
  zoneName: string | null;
  floor: string | null;
  category: EquipmentCategory | null;
  operationalStatus: 'unverified';
  isFunctional: null;
  safetyNotes: string | null;
  photoUrl: string | null;
  reviewStatus: 'draft';
  verified: false;
  verifiedBy: null;
  verifiedAt: null;
  SAMPLE_DATA_ONLY: false;
  assetKind: AssetKind;
  inventory: {
    groupId: string;
    unitIndex: number;
    reportedGroupQuantity: number;
    quantityUnit: string;
    weightRangeKg: { min: number; max: number } | null;
    reviewNotes: string;
  };
  source: {
    id: string;
    type: 'user_provided_inventory';
    line: number;
    receivedOn: string;
    text: string;
  };
};
export interface AssetCounts {
  sourceLines: number;
  normalizedTypes: number;
  assetRecords: number;
  byKind: Partial<Record<AssetKind, number>>;
}
export interface CollectedAssetsBundle {
  schemaVersion: 1;
  kind: 'collected_gym_assets_draft';
  sourceId: string;
  preparedAt: string;
  zones: [];
  equipment: CollectedGymAssetDraft[];
  exercises: [];
  counts: AssetCounts;
  readyForPlanner: false;
  requiresHumanReview: true;
}
