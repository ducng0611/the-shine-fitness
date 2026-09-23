import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateProfile, validateCatalogue, planWorkout, GROUPS, LEVELS } from '../server/src/companion/core.mjs';

// The bundled default catalogue served by /api/companion/member until an admin saves one.
const source = JSON.parse(readFileSync('data/companion/the-shine-catalogue.json', 'utf8'));
const inventory = JSON.parse(readFileSync('data/companion/the-shine-gym-assets.draft.json', 'utf8'));
const catalogue = validateCatalogue(source);
const now = new Date('2026-09-23T03:00:00Z');
const profile = (experience = 'beginner', goal = 'general_fitness') => validateProfile({ nickname: 'Test', age: 30, heightCm: 170,
  weightKg: 70, preferredMinutes: 45, goal, experience, style: 'gentle', diet: 'omnivore', allergies: [],
  timezone: 'Asia/Ho_Chi_Minh', consent: true, adultConfirmed: true, photoConsent: false, needsProfessionalReview: false });
const readiness = (extra = {}) => ({ durationMinutes: 45, focus: 'auto', energy: 3, pain: false, soreGroups: [], unavailableStationIds: [], confirmed: true, ...extra });

test('bundled catalogue is valid, verified and has no revision (first admin save must pass)', () => {
  assert.equal(catalogue.verified, true);
  assert.equal('revision' in catalogue, false);
  assert(catalogue.exercises.every(e => e.verified && e.cues.length > 0));
});

test('stations are exactly the gym inventory list', () => {
  assert.deepEqual(catalogue.equipment.map(e => e.id).sort(), inventory.equipment.map(e => e.id).sort());
});

for (const experience of LEVELS) for (const focus of ['auto', 'full_body', ...GROUPS]) {
  test(`plans a ${focus} workout for a ${experience} member`, () => {
    const plan = planWorkout(profile(experience), readiness({ focus }), catalogue, [], now);
    assert(plan.exercises.length > 0);
    for (const e of plan.exercises) {
      const ex = catalogue.exercises.find(x => x.id === e.exerciseId);
      assert(LEVELS.indexOf(ex.minLevel) <= LEVELS.indexOf(experience), `${ex.id} is above ${experience}`);
      if (GROUPS.includes(focus)) assert(e.groups.includes(focus));
    }
  });
}

test('a full-body session covers legs, push, pull and core', () => {
  for (const experience of LEVELS) {
    const plan = planWorkout(profile(experience), readiness({ focus: 'full_body' }), catalogue, [], now);
    assert.deepEqual([...new Set(plan.exercises.flatMap(e => e.groups))].sort(), [...GROUPS].sort(), experience);
  }
});

for (const [focus, busyStation, pattern] of [
  ['pull', 'shine_seated_machine_row_01', 'horizontal_pull'],
  ['push', 'shine_pec_deck_fly_01', 'chest_fly'],
]) {
  test(`busy ${busyStation} is replaced by a similar ${pattern} exercise`, () => {
    const plan = planWorkout(profile(), readiness({ focus, unavailableStationIds: [busyStation] }), catalogue, [], now);
    assert(plan.exercises.every(e => e.stationId !== busyStation));
    assert(plan.exercises.some(e => catalogue.exercises.find(x => x.id === e.exerciseId).pattern === pattern));
  });
}
