#!/bin/sh
set -eu
mkdir -p test-results/local
node --import tsx --test --test-concurrency=1 tests/local/*.test.ts > test-results/local/tests.tap
npx --no-install tsc -p tsconfig.local.json --noEmit > test-results/local/types-local.txt 2>&1
npx --no-install tsc -p tsconfig.buddy.json --noEmit > test-results/local/types-buddy.txt 2>&1
npm run lint > test-results/local/typecheck.txt 2>&1
node --import tsx --test --test-concurrency=1 tests/buddy/*.test.ts > test-results/local/buddy.tap
npm run test:training > test-results/local/training.tap
for f in tests/nutrition/*.test.ts tests/pathways/*.test.ts tests/gym-assets.test.ts; do
  node --import tsx --test "$f" > "test-results/local/$(echo "$f" | tr / _).tap"
done
for f in tests/posture-correction.test.ts tests/fatloss-metabolic.test.ts tests/height-posture.test.ts tests/weight-gain.test.ts tests/fitness-flexibility.test.ts; do
  node --import tsx --test "$f" > "test-results/local/$(basename "$f").tap"
done
npm run local:build > test-results/local/build-local.txt 2>&1
npm run build > test-results/local/build-existing.txt 2>&1
