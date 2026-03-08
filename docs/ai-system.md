# AI Engineering Notes

## AI execution pattern

1. Input normalization in service layer.
2. Deterministic rules/scoring pre-checks.
3. Structured LLM call with prompt versioning.
4. Schema validation using Zod.
5. Persist run metadata to `ai_runs` and recommendation entities.
6. Render explainability blocks in UI.

## Planned extension modules

- `careerReconstructionService`
- `exposureInferenceService`
- `symptomClassificationService`
- `conditionDetectionService`
- `secondaryConditionService`
- `benefitsInsightService`

Current scaffolding includes primary operational modules and can be expanded with the same schema-driven pattern.
