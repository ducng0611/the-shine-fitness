# Training pathways: learning contract, NOT customer records

This directory is safe to version in the public repository. It contains only
schemas, blank templates and rules about WHAT the assistant may eventually learn.
It does not contain a customer's health history, workout dates, biometric values,
names, signatures, phone numbers, source photos or the original tracker workbook.

## Source model

`PathwaySourceBundle -> PathwaySource[] + SourceObservation[] + SourceIssue[]`

Each field has `label`, lossless `raw`, `reading` and an explicitly sourced `unit`.
Readings distinguish `clear`, `uncertain`, `blank`, `dash`, and `redacted`.
Observations retain `sourceId`, sheet/cell or image-row `locator`, printed section,
printed block/period, and optional duplicate group. Repeated content is retained,
not turned into extra attendance, progress, or new people.

`shared/pathwayIntake.ts` is the executable validation contract. An imported
bundle always has `usage=source_review_only`; `eligibleForPlanner` is ALWAYS false,
even after transcription review. A source is not a reusable training prescription.

## Private intake files

Extract outside the application directory, for example:

```sh
python scripts/extract-pathway-tracker.py /private/input.xlsx \
  --out /private/training-pathways-private/batch-001/tracker.source.json
```

Install `openpyxl==3.1.5` in an isolated Python environment. The script supports
the three named Master Tracker sheets only; it does not perform handwriting OCR,
AI inference, medical assessment, formula calculation, model tuning or a DB write.
It removes the dedicated coach/client header rows, NOT every possible identifier
from free text. Manually review all remaining text. Output remains sensitive.

Never place originals under `public/`, `data/knowledge/`, static file folders or
GitHub artifacts. `.gitignore` is not access control. The Vite development deny
list includes private-intake directories, but keeping sources outside the app is
still the default. Private database cases are not loaded by the public RAG index.

See `docs/training-pathway-intake.md` for the modal and review workflow.
