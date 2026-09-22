import fs from 'fs';
import path from 'path';
import { adminDb } from '../lib/firebase-admin';

export interface GymZone {
  id: string;
  name: string;
  nameEn?: string;
  floor: 'floor1' | 'floor2' | string;
  description?: string;
  descriptionEn?: string;
  landmark?: string;
  directionsFromReception?: string;
  reviewStatus: 'draft' | 'needs_review' | 'verified' | 'rejected';
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  revision: number;
  SAMPLE_DATA_ONLY?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymEquipment {
  id: string;
  name: string;
  nameEn?: string;
  modelNumber?: string;
  brand?: string;
  zoneId: string;
  zoneName?: string;
  floor?: 'floor1' | 'floor2' | string;
  category: string;
  operationalStatus: string;
  isFunctional: boolean;
  primaryMuscleGroups: string[];
  secondaryMuscleGroups?: string[];
  contraindications?: string[];
  safetyNotes?: string;
  photoUrl?: string;
  reviewStatus: 'draft' | 'needs_review' | 'verified' | 'rejected';
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  revision: number;
  SAMPLE_DATA_ONLY?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseCatalogueEntry {
  id: string;
  name: string;
  nameEn?: string;
  aliases?: string[];
  category: string;
  targetMuscles: string[];
  primaryMuscle: string;
  secondaryMuscles?: string[];
  requiredEquipmentIds: string[];
  optionalEquipmentIds?: string[];
  difficulty: string;
  movementPattern?: string;
  instructions?: string[];
  trainerCues?: string[];
  contraindications?: string[];
  alternativeExerciseIds?: string[];
  reviewStatus: 'draft' | 'needs_review' | 'verified' | 'rejected';
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  revision: number;
  SAMPLE_DATA_ONLY?: boolean;
  createdAt: string;
  updatedAt: string;
}

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

const LOCAL_CATALOGUE_PATH = path.join(process.cwd(), 'data', 'companion', 'gym_catalogue.json');

/**
 * Loads local file fallback if Firestore is unreachable or empty
 */
export function getLocalGymCatalogue(): {
  zones: GymZone[];
  equipment: GymEquipment[];
  exercises: ExerciseCatalogueEntry[];
} {
  try {
    if (fs.existsSync(LOCAL_CATALOGUE_PATH)) {
      const raw = fs.readFileSync(LOCAL_CATALOGUE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      return {
        zones: data.zones || [],
        equipment: data.equipment || [],
        exercises: data.exercises || []
      };
    }
  } catch (err) {
    console.error('Error reading local gym catalogue:', err);
  }
  return { zones: [], equipment: [], exercises: [] };
}

/**
 * Saves catalogue snapshot locally as backup
 */
export function saveLocalGymCatalogue(data: {
  zones: GymZone[];
  equipment: GymEquipment[];
  exercises: ExerciseCatalogueEntry[];
}) {
  try {
    const dir = path.dirname(LOCAL_CATALOGUE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      LOCAL_CATALOGUE_PATH,
      JSON.stringify({ ...data, version: 1, lastUpdated: new Date().toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Error writing local gym catalogue:', err);
  }
}

/**
 * Fetch all catalogue entities from Firestore, falling back to local file
 */
export async function fetchFullCatalogueFromStorage(): Promise<{
  zones: GymZone[];
  equipment: GymEquipment[];
  exercises: ExerciseCatalogueEntry[];
}> {
  try {
    const [zSnap, eSnap, exSnap] = await Promise.all([
      adminDb.collection('gym_zones').get(),
      adminDb.collection('gym_equipment').get(),
      adminDb.collection('gym_exercises').get()
    ]);

    const zones: GymZone[] = [];
    zSnap.forEach(d => zones.push({ id: d.id, ...d.data() } as GymZone));

    const equipment: GymEquipment[] = [];
    eSnap.forEach(d => equipment.push({ id: d.id, ...d.data() } as GymEquipment));

    const exercises: ExerciseCatalogueEntry[] = [];
    exSnap.forEach(d => exercises.push({ id: d.id, ...d.data() } as ExerciseCatalogueEntry));

    // If Firestore has entries, return them
    if (zones.length > 0 || equipment.length > 0 || exercises.length > 0) {
      return { zones, equipment, exercises };
    }
  } catch (err) {
    console.warn('Firestore fetch failed for gym catalogue, checking local storage:', err);
  }

  return getLocalGymCatalogue();
}

/**
 * Record a revision audit log in Firestore and local
 */
export async function recordRevision(revision: Omit<CatalogueRevision, 'id' | 'timestamp'>): Promise<CatalogueRevision> {
  const rev: CatalogueRevision = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...revision
  };

  try {
    await adminDb.collection('gym_catalogue_revisions').doc(rev.id).set(rev);
  } catch (err) {
    console.warn('Failed to save catalogue revision to Firestore:', err);
  }

  return rev;
}
