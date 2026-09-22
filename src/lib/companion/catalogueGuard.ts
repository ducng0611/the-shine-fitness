import { 
  GymZone, 
  GymEquipment, 
  ExerciseCatalogueEntry, 
  CatalogueCompletenessStatus,
  GymCatalogue
} from '../../types/companion';

/**
 * Checks if a single catalogue entity is strictly verified for production use.
 * Any item with SAMPLE_DATA_ONLY: true, draft, needs_review, or rejected is rejected.
 */
export function isItemVerified<T extends { verified: boolean; reviewStatus: string; SAMPLE_DATA_ONLY?: boolean }>(
  item: T | null | undefined
): boolean {
  if (!item) return false;
  if (item.SAMPLE_DATA_ONLY === true) return false;
  if (item.reviewStatus !== 'verified') return false;
  return item.verified === true;
}

/**
 * Filters and returns strictly verified gym zones.
 */
export function filterVerifiedZones(zones: GymZone[] = []): GymZone[] {
  return zones.filter(isItemVerified);
}

/**
 * Filters and returns strictly verified, operational equipment.
 * An equipment piece is only viable if:
 * 1. It is verified and not sample data.
 * 2. It is functional (isFunctional === true).
 * 3. Its operationalStatus === 'operational'.
 */
export function filterVerifiedEquipment(equipment: GymEquipment[] = []): GymEquipment[] {
  return equipment.filter(item => {
    if (!isItemVerified(item)) return false;
    if (!item.isFunctional) return false;
    if (item.operationalStatus !== 'operational') return false;
    return true;
  });
}

/**
 * Filters and returns strictly verified exercises.
 * An exercise is viable ONLY IF:
 * 1. It is verified and not sample data.
 * 2. ALL of its required equipment IDs exist in the verified equipment list and are operational.
 */
export function filterVerifiedExercises(
  exercises: ExerciseCatalogueEntry[] = [],
  verifiedEquipment: GymEquipment[] = []
): ExerciseCatalogueEntry[] {
  const verifiedEquipmentIdSet = new Set(
    filterVerifiedEquipment(verifiedEquipment).map(e => e.id)
  );

  return exercises.filter(exercise => {
    if (!isItemVerified(exercise)) return false;

    // Check if all required equipment exists and is verified/operational
    if (exercise.requiredEquipmentIds && exercise.requiredEquipmentIds.length > 0) {
      const allRequiredEquipmentAvailable = exercise.requiredEquipmentIds.every(
        reqEqId => verifiedEquipmentIdSet.has(reqEqId)
      );
      if (!allRequiredEquipmentAvailable) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Evaluates the readiness and completeness of the verified gym knowledge base.
 * Follows the core rule: The AI Companion will NEVER recommend workouts from unverified or synthetic data.
 */
export function checkCatalogueCompleteness(
  zones: GymZone[] = [],
  equipment: GymEquipment[] = [],
  exercises: ExerciseCatalogueEntry[] = []
): CatalogueCompletenessStatus {
  const verifiedZones = filterVerifiedZones(zones);
  const verifiedEquipment = filterVerifiedEquipment(equipment);
  const verifiedExercises = filterVerifiedExercises(exercises, verifiedEquipment);

  const missingAreas: string[] = [];

  if (verifiedZones.length === 0) {
    missingAreas.push('Sơ đồ & Khu vực tập luyện (Gym Zones)');
  }
  if (verifiedEquipment.length === 0) {
    missingAreas.push('Danh mục máy tập & thiết bị thực tế (Gym Equipment)');
  }
  if (verifiedExercises.length === 0) {
    missingAreas.push('Danh mục bài tập được HLV The Shine phê duyệt (Verified Exercises)');
  }

  // Check coverage across major muscle groups
  const REQUIRED_MUSCLE_GROUPS = ['Ngực', 'Lưng', 'Chân', 'Vai', 'Tay', 'Core'];
  const coveredMuscleGroups = new Set(
    verifiedExercises.map(ex => ex.category || ex.primaryMuscle)
  );

  const missingMuscleGroups = REQUIRED_MUSCLE_GROUPS.filter(
    mg => !coveredMuscleGroups.has(mg)
  );

  if (verifiedExercises.length > 0 && missingMuscleGroups.length > 0) {
    missingAreas.push(`Nhóm cơ chưa đủ bài tập xác thực: ${missingMuscleGroups.join(', ')}`);
  }

  const hasUnverifiedSampleData = 
    zones.some(z => z.SAMPLE_DATA_ONLY || !z.verified) ||
    equipment.some(e => e.SAMPLE_DATA_ONLY || !e.verified) ||
    exercises.some(ex => ex.SAMPLE_DATA_ONLY || !ex.verified);

  // A catalogue is sufficient only if at least 1 zone, 3 equipment, and 5 verified exercises covering major groups exist
  const isSufficientForPlanning = 
    verifiedZones.length >= 1 && 
    verifiedEquipment.length >= 3 && 
    verifiedExercises.length >= 5 &&
    missingMuscleGroups.length <= 2;

  let explanation = '';
  if (!isSufficientForPlanning) {
    explanation = `Hệ thống Shine Companion hiện chưa có đủ dữ liệu cơ sở vật chất & bài tập đã qua kiểm duyệt từ Ban Quản Lý The Shine Fitness. AI sẽ tạm thời từ chối gợi ý bài tập tự động dựa trên thiết bị thực tế để đảm bảo an toàn tuyệt đối cho hội viên.`;
  } else {
    explanation = `Dữ liệu cơ sở vật chất và bài tập đã được xác thực đầy đủ (${verifiedZones.length} khu vực, ${verifiedEquipment.length} thiết bị, ${verifiedExercises.length} bài tập).`;
  }

  return {
    isSufficientForPlanning,
    verifiedCounts: {
      zones: verifiedZones.length,
      equipment: verifiedEquipment.length,
      exercises: verifiedExercises.length
    },
    totalCounts: {
      zones: zones.length,
      equipment: equipment.length,
      exercises: exercises.length
    },
    missingAreas,
    explanation,
    hasUnverifiedSampleData
  };
}

/**
 * Returns a safe, honest, and grounded message when verified data is missing.
 */
export function getSafeUnverifiedCatalogueResponse(
  status: CatalogueCompletenessStatus,
  lang: 'vi' | 'en' = 'vi'
): string {
  if (lang === 'vi') {
    const missingList = status.missingAreas.map(a => `• ${a}`).join('\n');
    return `⚠️ **THÔNG BÁO TỪ SHINE COMPANION:**\n\n` +
      `Dạ hiện tại hệ thống danh mục thiết bị và bài tập thực tế tại **The Shine Fitness & Yoga (154 Hoàng Hoa Thám)** đang trong quá trình cập nhật và kiểm duyệt bởi Huấn luyện viên trưởng (Master Trainer).\n\n` +
      `Để đảm bảo an toàn tập luyện và tính chính xác tuyệt đối, em chưa thể tạo lịch tập chi tiết gán vào máy tập cụ thể.\n\n` +
      `**Hạng mục đang chờ Ban Quản Lý xác thực:**\n${missingList || '• Danh sách máy tập và bài tập chuẩn hóa'}\n\n` +
      `💡 Anh/Chị có thể gặp trực tiếp HLV trực sàn (Floor Trainer) tại Tầng 2 hoặc hỏi em về lịch lớp Yoga/Zumba, chính sách phòng tập nhé ạ!`;
  } else {
    const missingList = status.missingAreas.map(a => `• ${a}`).join('\n');
    return `⚠️ **SHINE COMPANION NOTICE:**\n\n` +
      `The physical equipment and exercise catalogue for **The Shine Fitness & Yoga (154 Hoang Hoa Tham)** is currently undergoing official verification by our Master Trainers.\n\n` +
      `To ensure safety and accuracy, automated machine-specific workout recommendations are temporarily paused.\n\n` +
      `**Pending verification by Gym Management:**\n${missingList || '• Standardized equipment and exercise registry'}\n\n` +
      `💡 Please consult our Floor Trainers on Floor 2 or ask me about class schedules and gym amenities!`;
  }
}
