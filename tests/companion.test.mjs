import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile, validateCatalogue, validateReadiness, planWorkout, completeWorkout, calculateMeal,
  mealSummary, dayBounds, localDate, nutritionAdvice, personality, safetyIssue, id, GROUPS } from '../server/src/companion/core.mjs';

// Synthetic fixtures ONLY. These station names and zones are not claims about The Shine.
const now = new Date('2026-09-22T03:00:00Z');
const rawProfile = { nickname: 'Test Member', age: 25, heightCm: 170, weightKg: 70, preferredMinutes: 35,
  goal: 'general_fitness', experience: 'beginner', style: 'gentle', diet: 'omnivore', allergies: [],
  timezone: 'Asia/Ho_Chi_Minh', consent: true, adultConfirmed: true, photoConsent: false, needsProfessionalReview: false };
const profile = () => ({ ...validateProfile(rawProfile), revision: 'test-profile-revision' });
const readiness = (extra = {}) => ({ durationMinutes: 35, focus: 'auto', energy: 3, pain: false, soreGroups: [], unavailableStationIds: [], confirmed: true, ...extra });
function catalogue() {
  const groups = ['legs', 'legs', 'legs', 'push', 'pull', 'core'];
  return { ...validateCatalogue({ verified: true,
    equipment: groups.map((_, i) => ({ id: `test-station-${i}`, name: `SYNTHETIC TEST STATION ${i}`, zone: 'TEST ZONE', directions: 'Test-only directions, not an actual gym location.', verified: true, status: 'operational' })),
    exercises: groups.map((group, i) => ({ id: `test-exercise-${i}`, name: `SYNTHETIC TEST EXERCISE ${i}`, stationId: `test-station-${i}`, groups: [group], cues: ['Synthetic instruction for a unit test only.'], pattern: `test-pattern-${i}`, minLevel: 'beginner', verified: true, sets: 3, repsMin: 8, repsMax: 12, workSeconds: 40, restSeconds: 60, transitionSeconds: 45 })),
    nutritionTemplates: ['pre_soon', 'pre_later', 'post'].map(timing => ({ id: timing, title: `TEST ${timing}`, body: 'Synthetic reviewed-template fixture, not a dietary prescription.', diets: ['omnivore'], goals: ['general_fitness'], timing, verified: true, reviewedBy: 'test-only', source: 'unit-test fixture' })) }), revision: 'test-catalogue-revision' };
}
const plan = (q = {}, history = [], p = profile(), c = catalogue()) => planWorkout(p, readiness(q), c, history, now);
const errorCode = code => e => e?.code === code;
const food = (extra = {}) => ({ name: 'Test food', grams: 150, gramsMin: 120, gramsMax: 180, kcalPer100g: 200, source: 'Synthetic label fixture', sourceType: 'member_label', ...extra });

test('profile requires explicit storage consent', () => assert.throws(() => validateProfile({ ...rawProfile, consent: false }), errorCode('CONSENT_REQUIRED')));
test('pilot rejects under-18 profile', () => assert.throws(() => validateProfile({ ...rawProfile, age: 17 })));
test('adult acknowledgement is not inferred from age', () => assert.throws(() => validateProfile({ ...rawProfile, adultConfirmed: false }), errorCode('ADULT_ONLY')));
test('screening cannot be omitted', () => assert.throws(() => validateProfile({ ...rawProfile, needsProfessionalReview: undefined }), errorCode('SCREENING_REQUIRED')));
test('profile rejects numeric strings and non-finite measurements', () => { assert.throws(() => validateProfile({ ...rawProfile, weightKg: '70' })); assert.throws(() => validateProfile({ ...rawProfile, heightCm: Infinity })); });
test('unknown timezone rejected', () => assert.throws(() => validateProfile({ ...rawProfile, timezone: 'NOT_A_TIMEZONE' }), errorCode('TIMEZONE')));
test('photo consent is separate and defaults off', () => assert.equal(profile().photoConsent, false));
test('identifier cannot contain path traversal', () => assert.throws(() => id('../another-member')));
test('catalogue rejects duplicate station IDs', () => { const c = catalogue(); c.equipment.push(c.equipment[0]); assert.throws(() => validateCatalogue(c), errorCode('CATALOGUE')); });
test('catalogue rejects an exercise with an unknown station', () => { const c = catalogue(); c.exercises[0].stationId = 'missing'; assert.throws(() => validateCatalogue(c), errorCode('CATALOGUE')); });
test('catalogue requires instruction cues', () => { const c = catalogue(); c.exercises[0].cues = []; assert.throws(() => validateCatalogue(c), errorCode('CATALOGUE')); });
test('readiness must be explicitly confirmed', () => assert.throws(() => validateReadiness(readiness({ confirmed: false }), profile()), errorCode('READINESS_REQUIRED')));
test('unverified inventory cannot yield a workout', () => assert.throws(() => plan({}, [], profile(), { ...catalogue(), verified: false }), errorCode('INVENTORY_REQUIRED')));
test('current pain stops automatic prescription', () => assert.throws(() => plan({ pain: true }), errorCode('PROFESSIONAL_REVIEW')));
test('profile needing professional review stops planner', () => assert.throws(() => plan({}, [], { ...profile(), needsProfessionalReview: true }), errorCode('PROFESSIONAL_REVIEW')));
test('very low reported energy is not overridden', () => assert.throws(() => plan({ energy: 1 }), errorCode('LOW_READINESS')));
test('35-minute leg session only uses verified leg exercises and fits budget', () => {
  const p = plan({ focus: 'legs' }); assert.ok(p.exercises.length > 0); assert.ok(p.estimatedMinutes <= 35);
  assert.ok(p.exercises.every(e => e.groups.includes('legs')));
  assert.equal(p.warmupMinutes + p.cooldownMinutes, 8);
  assert.ok(p.exercises.reduce((s, e) => s + e.estimatedSeconds, 480) <= 35 * 60);
});
test('maintenance and occupied stations excluded', () => { const c = catalogue(); c.equipment[0].status = 'maintenance'; const p = plan({ unavailableStationIds: ['test-station-1'] }, [], profile(), c); assert.ok(p.exercises.every(e => !['test-station-0', 'test-station-1'].includes(e.stationId))); });
test('unverified exercise and station excluded', () => { const c = catalogue(); c.exercises[0].verified = false; c.equipment[1].verified = false; const p = plan({}, [], profile(), c); assert.ok(p.exercises.every(e => !['test-exercise-0', 'test-exercise-1'].includes(e.exerciseId))); });
test('advanced-only exercise not assigned to beginner', () => { const c = catalogue(); c.exercises[0].minLevel = 'advanced'; assert.ok(plan({}, [], profile(), c).exercises.every(e => e.exerciseId !== 'test-exercise-0')); });
test('recent trained groups excluded by conservative pilot heuristic', () => { const h = [{ occurredAt: new Date(now.getTime() - 24 * 3600000).toISOString(), groups: ['legs'] }]; assert.ok(plan({}, h).exercises.every(e => !e.groups.includes('legs'))); assert.throws(() => plan({ focus: 'legs' }, h), errorCode('NO_SUITABLE_WORKOUT')); });
test('older history does not permanently exclude a group', () => { const h = [{ occurredAt: new Date(now.getTime() - 72 * 3600000).toISOString(), groups: ['legs'] }]; assert.ok(plan({ focus: 'legs' }, h).exercises.length > 0); });
test('future-dated history does not imply recovery or recent training', () => { const h = [{ occurredAt: '2030-01-01T00:00:00Z', groups: GROUPS }]; assert.ok(plan({}, h).exercises.length > 0); });
test('reported soreness excludes selected groups', () => assert.ok(plan({ soreGroups: ['push'] }).exercises.every(e => !e.groups.includes('push'))));
test('all unsuitable groups result in a safe empty-plan error', () => assert.throws(() => plan({ soreGroups: GROUPS }), errorCode('NO_SUITABLE_WORKOUT')));
test('short session respects duration including transition and rest', () => { const p = plan({ durationMinutes: 15 }); assert.ok(p.estimatedMinutes <= 15); assert.ok(p.exercises.length > 0); });
test('last performance is shown without prescribing a new load', () => { const h = [{ occurredAt: '2026-09-18T03:00:00Z', groups: ['legs'], sets: [{ exerciseId: 'test-exercise-0', reps: 10, loadKg: 25, effort: 6 }] }]; const e = plan({ focus: 'legs' }, h).exercises.find(e => e.exerciseId === 'test-exercise-0'); assert.equal(e.lastPerformance.sets[0].loadKg, 25); assert.equal(e.loadKg, undefined); });
test('completion only records entered actual sets and marks partial', () => { const p = plan(), done = completeWorkout(p, { confirmed: true, durationMinutes: 20, sets: [{ exerciseId: p.exercises[0].exerciseId, reps: 10, loadKg: 20 }] }, now); assert.equal(done.sets.length, 1); assert.equal(done.status, 'partial'); assert.equal(done.externalLoadVolumeKg, 200); });
test('completion cannot be inferred without confirmation', () => assert.throws(() => completeWorkout(plan(), { confirmed: false, sets: [] }), errorCode('CONFIRMATION_REQUIRED')));
test('completion rejects an exercise outside the saved plan', () => assert.throws(() => completeWorkout(plan(), { confirmed: true, durationMinutes: 20, sets: [{ exerciseId: 'not-in-plan', reps: 10, loadKg: 20 }] }), errorCode('EXERCISE')));
test('completion rejects more sets than proposed', () => { const p = plan(), e = p.exercises[0]; assert.throws(() => completeWorkout(p, { confirmed: true, durationMinutes: 20, sets: Array.from({ length: e.sets + 1 }, () => ({ exerciseId: e.exerciseId, reps: 10, loadKg: 20 })) }), errorCode('SETS')); });
test('fractional reps rejected and zero external load accepted', () => { const p = plan(), e = p.exercises[0]; assert.throws(() => completeWorkout(p, { confirmed: true, durationMinutes: 10, sets: [{ exerciseId: e.exerciseId, reps: 2.5, loadKg: 0 }] })); assert.equal(completeWorkout(p, { confirmed: true, durationMinutes: 10, sets: [{ exerciseId: e.exerciseId, reps: 10, loadKg: 0 }] }).externalLoadVolumeKg, 0); });
test('meal calories calculated deterministically from grams and source energy', () => { const m = calculateMeal([food()]); assert.equal(m.kcal, 300); assert.equal(m.kcalMin, 240); assert.equal(m.kcalMax, 360); assert.equal(m.estimate, true); });
test('unknown nutrient is not converted to zero', () => assert.throws(() => calculateMeal([food({ kcalPer100g: undefined })])));
test('invalid portion uncertainty rejected', () => assert.throws(() => calculateMeal([food({ gramsMin: 200 })])));
test('meal source attribution required', () => assert.throws(() => calculateMeal([food({ source: '' })])));
test('incomplete diary does not report a misleading total', () => assert.equal(mealSummary([calculateMeal([food()])], true).kcal, null));
test('daily sum only aggregates records passed to it', () => { const m = calculateMeal([food()]); assert.equal(mealSummary([m, m]).kcal, 600); assert.equal(mealSummary([]).recordedMeals, 0); });
test('Ho Chi Minh day begins at 17:00 UTC on the previous date', () => { const b = dayBounds(new Date('2026-09-21T18:15:00Z'), 'Asia/Ho_Chi_Minh'); assert.equal(b.date, '2026-09-22'); assert.equal(b.start, '2026-09-21T17:00:00.000Z'); assert.equal(b.end, '2026-09-22T17:00:00.000Z'); });
test('spring DST day can be 23 hours', () => { const b = dayBounds(new Date('2026-03-08T16:00:00Z'), 'America/New_York'); assert.equal((Date.parse(b.end) - Date.parse(b.start)) / 3600000, 23); });
test('autumn DST day can be 25 hours', () => { const b = dayBounds(new Date('2026-11-01T16:00:00Z'), 'America/New_York'); assert.equal((Date.parse(b.end) - Date.parse(b.start)) / 3600000, 25); });
test('local-date formatting handles half-hour timezone', () => assert.equal(localDate(new Date('2026-09-21T19:00:00Z'), 'Asia/Kolkata'), '2026-09-22'));
test('nutrition uses reviewed timing and profile matches', () => { const a = nutritionAdvice(profile(), catalogue(), 30); assert.deepEqual(a.templates.map(t => t.id), ['pre_soon', 'post']); assert.equal(a.calorieTarget, null); });
test('unreviewed nutrition content excluded', () => { const c = catalogue(); c.nutritionTemplates.forEach(t => t.verified = false); assert.equal(nutritionAdvice(profile(), c).templates.length, 0); });
test('allergy flag prevents inferred safe meal recommendation', () => assert.equal(nutritionAdvice({ ...profile(), allergies: ['peanut'] }, catalogue()).templates.length, 0));
test('medical nutrition needs require a professional', () => assert.throws(() => nutritionAdvice({ ...profile(), needsProfessionalReview: true }, catalogue()), errorCode('PROFESSIONAL_REVIEW')));
test('post-workout request selects post templates only', () => assert.deepEqual(nutritionAdvice(profile(), catalogue(), 0, 'post').templates.map(t => t.id), ['post']));
test('safety lexicon recognizes Vietnamese accents', () => { assert.equal(safetyIssue('Tôi đang đau ngực'), 'urgent'); assert.equal(safetyIssue('Tôi bị chấn thương đầu gối'), 'professional'); });
test('three personality styles stay distinct without changing the rules', () => { const responses = ['gentle', 'energetic', 'direct'].map(style => personality({ ...profile(), style })); assert.equal(new Set(responses).size, 3); assert.ok(responses.every(t => t.includes('Test Member'))); });
