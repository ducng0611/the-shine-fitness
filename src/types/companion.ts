/**
 * SHINE COMPANION — GYM KNOWLEDGE DOMAIN MODEL & VERIFICATION SCHEMAS
 * 
 * CORE PRINCIPLE:
 * "AI DOES NOT KNOW THE GYM BECAUSE IT KNOWS FITNESS.
 *  AI KNOWS THE GYM ONLY WHEN VERIFIED THE SHINE DATA EXISTS."
 * 
 * Unverified, draft, or synthetic data (SAMPLE_DATA_ONLY = true) must NEVER
 * reach member workout recommendations.
 */

export type ReviewStatus = 'draft' | 'needs_review' | 'verified' | 'rejected';

export type EquipmentOperationalStatus = 
  | 'operational' 
  | 'under_maintenance' 
  | 'out_of_order' 
  | 'temporarily_reserved' 
  | 'unverified';

export type EquipmentCategory = 
  | 'cardio'
  | 'selectorized_machine'
  | 'plate_loaded_machine'
  | 'free_weight'
  | 'cable_station'
  | 'bodyweight_functional'
  | 'recovery_mobility'
  | 'boxing'
  | 'studio_groupx';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type MovementPattern = 
  | 'push' 
  | 'pull' 
  | 'squat' 
  | 'hinge' 
  | 'lunge' 
  | 'carry' 
  | 'rotation' 
  | 'isolation';

// ================= 1. GYM ZONE =================
export interface GymZone {
  id: string;
  name: string;
  nameEn?: string;
  floor: 'floor1' | 'floor2' | string;
  description?: string;
  descriptionEn?: string;
  landmark?: string;
  directionsFromReception?: string;
  reviewStatus: ReviewStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  revision: number;
  SAMPLE_DATA_ONLY?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================= 2. EQUIPMENT / STATION =================
export interface GymEquipment {
  id: string;
  name: string;
  nameEn?: string;
  modelNumber?: string;
  brand?: string;
  zoneId: string;
  zoneName?: string;
  floor?: 'floor1' | 'floor2' | string;
  category: EquipmentCategory;
  operationalStatus: EquipmentOperationalStatus;
  isFunctional: boolean;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups?: string[];
  contraindications?: string[];
  safetyNotes?: string;
  photoUrl?: string;
  reviewStatus: ReviewStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  revision: number;
  SAMPLE_DATA_ONLY?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================= 3. EXERCISE ENTRY =================
export interface ExerciseCatalogueEntry {
  id: string;
  name: string;
  nameEn?: string;
  aliases?: string[];
  category: string; // 'Ngực' | 'Lưng' | 'Chân' | 'Vai' | 'Tay' | 'Core' | 'Cardio' | 'Boxing' | 'Yoga'
  targetMuscles: string[];
  primaryMuscle: string;
  secondaryMuscles?: string[];
  requiredEquipmentIds: string[]; // references GymEquipment.id
  optionalEquipmentIds?: string[];
  difficulty: ExerciseDifficulty;
  movementPattern?: MovementPattern;
  instructions?: string[];
  trainerCues?: string[];
  contraindications?: string[]; // e.g., 'lower_back_pain', 'shoulder_impingement', 'knee_pain'
  alternativeExerciseIds?: string[];
  reviewStatus: ReviewStatus;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  revision: number;
  SAMPLE_DATA_ONLY?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================= 4. REVISION & AUDIT LOG =================
export interface CatalogueRevision {
  id: string;
  version: number;
  entityType: 'zone' | 'equipment' | 'exercise' | 'bulk_import' | 'schema';
  entityId: string;
  action: 'create' | 'update' | 'verify' | 'reject' | 'delete' | 'import';
  changedBy: string;
  changeSummary: string;
  previousState?: any;
  newState?: any;
  timestamp: string;
}

// ================= 5. FULL CATALOGUE AGGREGATE =================
export interface GymCatalogue {
  version: number;
  lastUpdated: string;
  zones: GymZone[];
  equipment: GymEquipment[];
  exercises: ExerciseCatalogueEntry[];
  SAMPLE_DATA_ONLY?: boolean;
}

// ================= 6. VERIFICATION STATUS & COMPLETENESS =================
export interface CatalogueCompletenessStatus {
  isSufficientForPlanning: boolean;
  verifiedCounts: {
    zones: number;
    equipment: number;
    exercises: number;
  };
  totalCounts: {
    zones: number;
    equipment: number;
    exercises: number;
  };
  missingAreas: string[];
  explanation: string;
  hasUnverifiedSampleData: boolean;
}
