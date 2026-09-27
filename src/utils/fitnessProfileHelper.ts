import { safeStorage } from './storage';
import { MemberUser } from '../components/AuthModal';
import { MemberProgressEntry } from '../types';

export interface MemberFitnessProfilePayload {
  heightCm?: number | string;
  weightKg?: number | string;
  bmi?: number | string;
  bodyFatPct?: number | string;
  muscleMassKg?: number | string;
  fitnessGoal?: string;
  workoutHistorySummary?: string;
  recentWorkouts?: Array<{ date: string; category: string; exerciseName: string; notes?: string }>;
  nutritionGoal?: string;
}

/**
 * Extracts and consolidates full fitness profile from member data, progress logs,
 * workout history ONLY for authenticated / logged-in members.
 * Visitors / non-logged-in users will receive null (standard smart consultant mode).
 */
export function getConsolidatedFitnessProfile(user?: MemberUser | null): MemberFitnessProfilePayload | null {
  // STRICT RULE: Personalization is strictly reserved for authenticated / registered members
  if (!user) {
    return null;
  }

  const profile: MemberFitnessProfilePayload = {};
  let hasData = false;

  const memberIdentifier = user.memberCode || user.membershipCode || user.id || user.uid || '';
  if (memberIdentifier) {
    hasData = true;
  }

  // 1. Look up member progress cache (from MemberProgressTracker)
  try {
    const cacheKey = `theshine_progress_${user.id || user.memberCode || 'default'}`;
    const progressRaw = safeStorage.getItem(cacheKey);
    if (progressRaw) {
      const entries: MemberProgressEntry[] = JSON.parse(progressRaw);
      if (Array.isArray(entries) && entries.length > 0) {
        const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latest = sorted[0];
        if (latest.weightKg) profile.weightKg = latest.weightKg;
        if (latest.bodyFatPct) profile.bodyFatPct = latest.bodyFatPct;
        if (latest.muscleMassKg) profile.muscleMassKg = latest.muscleMassKg;
        if (latest.notes && !profile.fitnessGoal) profile.fitnessGoal = latest.notes;

        hasData = true;
      }
    }
  } catch (e) {}

  // 2. Look up workout history cache (from MemberWorkoutLog)
  try {
    const workoutKey1 = `theshine_workouts_${memberIdentifier || 'default'}`;
    const workoutKey2 = `theshine_workout_logs_${user.memberCode || user.id || 'default'}`;
    const workoutRaw = safeStorage.getItem(workoutKey1) || safeStorage.getItem(workoutKey2);
    if (workoutRaw) {
      const workouts = JSON.parse(workoutRaw);
      if (Array.isArray(workouts) && workouts.length > 0) {
        const recent = workouts.slice(0, 5).map((w: any) => ({
          date: w.date || w.createdAt?.split('T')[0] || 'Gần đây',
          category: w.category || 'Thể lực',
          exerciseName: w.exerciseName || w.title || 'Bài tập',
          notes: w.notes || (w.sets ? `${w.sets.length} sets` : undefined)
        }));
        profile.recentWorkouts = recent;
        const categories = Array.from(new Set(recent.map((r: any) => r.category)));
        profile.workoutHistorySummary = `Hội viên đã hoàn thành ${workouts.length} buổi tập gần đây với các nhóm cơ: ${categories.join(', ')}.`;
        hasData = true;
      }
    }
  } catch (e) {}

  // 3. Fallback to health assessment if user completed one
  try {
    const healthDataRaw = safeStorage.getItem('shine_health_data');
    if (healthDataRaw) {
      const healthData = JSON.parse(healthDataRaw);
      if (healthData?.metrics) {
        if (!profile.heightCm && healthData.metrics.heightCm) profile.heightCm = healthData.metrics.heightCm;
        if (!profile.weightKg && healthData.metrics.weightKg) profile.weightKg = healthData.metrics.weightKg;
        if (!profile.fitnessGoal && healthData.metrics.goal) {
          const goalMap: Record<string, string> = {
            fat_loss: 'Giảm mỡ & Siết cơ (Fat Loss)',
            maintenance: 'Duy trì vóc dáng & Sức bền (Maintenance)',
            muscle_gain: 'Tăng cơ & Tăng cân nạc (Muscle Gain)'
          };
          profile.fitnessGoal = goalMap[healthData.metrics.goal] || healthData.metrics.goal;
        }
      }
      if (healthData?.results) {
        if (!profile.bmi && healthData.results.bmi) profile.bmi = healthData.results.bmi;
        if (!profile.bodyFatPct && healthData.results.bodyFatPct) profile.bodyFatPct = healthData.results.bodyFatPct;
        if (!profile.nutritionGoal && healthData.results.targetCalories) {
          profile.nutritionGoal = `Mục tiêu năng lượng: ${healthData.results.targetCalories} kcal/ngày (Protein: ${healthData.results.macros?.proteinGrams || 0}g, Carbs: ${healthData.results.macros?.carbsGrams || 0}g, Fat: ${healthData.results.macros?.fatGrams || 0}g)`;
        }
      }
    }
  } catch (e) {}

  // Calculate BMI if height & weight available but BMI not yet set
  if (profile.heightCm && profile.weightKg && !profile.bmi) {
    const hM = Number(profile.heightCm) / 100;
    profile.bmi = Math.round((Number(profile.weightKg) / (hM * hM)) * 10) / 10;
  }

  return hasData ? profile : null;
}
