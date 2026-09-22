# Step 3 verification record

Baseline: main `d40f9d37dff128ab2fdf079276dbaac70c37e0d7`.

## Observed local results

- 91 domain/service/HTTP tests passed; 0 failed, 0 skipped.
- `npm run typecheck:training`: passed (strict checks for the new modules).
- `npm run lint`: passed (existing full-project TypeScript check).
- `npm run build`: passed (Vite frontend + esbuild backend). A large frontend chunk warning remains; it has not been suppressed.
- Tests use synthetic data only. HTTP tests exercise the actual Express router with a test verifier and transactional memory adapter. They do not by themselves prove real Firebase authentication or Firestore transaction behavior.

## Additional checks supplied

- `tests/training/emulator.integration.ts` uses real Firebase Auth/Firestore emulators in the isolated `demo-shine-training` project; production endpoints are rejected by test guards.
- `tests/training/browser_test.py` drives the actual React forms against the isolated test HTTP API. It covers onboarding, intent prefill, general planning, actual logging, a lost-success-response retry and pain gating, plus a 390px viewport check.
- Browser execution in the development container was blocked by the installed browser's enterprise navigation policy. No claim of a passed local browser test is made. The ordinary GitHub Actions browser job is the runnable verification path.
- `.github/workflows/training.yml` runs unit/HTTP/type/build, Firebase emulator and browser jobs with read-only repository permission. Consult actual run results; the existence of a workflow is not evidence it passed.

## Regression scope

Existing analytics, emails, reviews and public RAG modules were not replaced. Full compilation/build passes, but this is not an end-to-end test of real email delivery, RAG model calls, the production Firebase project, payment entitlement or physical devices. New entrypoints are feature-gated. Full Member Portal legacy-chart consolidation is not implemented.

## Production tests not represented by this report

No real API key, real member account, physical iPhone/Android, verified gym asset catalogue or expert-approved training content has been used. No production database writes, deployment or automatic main merge are part of this change.
