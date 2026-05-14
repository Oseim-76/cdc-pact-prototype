# CDC Pipeline Runbook — Notification Producer API

## Overview

This runbook documents the Consumer-Driven Contract (CDC) testing workflow for the Notification Producer API. It governs how interface changes are proposed, validated, and released across the DfT microservice estate.

## CDC Workflow

Consumer writes Pact test → Contract generated → Provider verifies → CI gate passes → Merge allowed

## Step-by-step

1. Consumer defines expectations — writes Pact interaction tests expressing what they need from the producer.
2. Contract committed — the generated contract JSON is committed to the repository.
3. Provider verifies — the CI job runs the Producer against the contract. Any mismatch blocks the PR.
4. Gate passes — all stages must pass: lint, unit tests, consumer contracts, provider verification.

## Versioning Rules

| Change type | Breaking? | Action required |
|-------------|-----------|-----------------|
| Add optional field | No | Additive — no consumer update needed |
| Remove field | Yes | Consumer must update contract first |
| Rename field | Yes | Treat as remove plus add |
| Change field type | Yes | Consumer must update contract first |
| Add new endpoint | No | New consumer tests needed to use it |
| Change enum values | Yes | Consumer must update contract first |

## Deprecation Policy

1. Deprecated fields must be marked in the OpenAPI spec with deprecated: true
2. A minimum of two sprint cycles notice before removal
3. All consumers must confirm updated contracts before deprecated field is removed
4. Removal is evidenced by a passing provider verification after the field is gone

## Breaking Change Process

1. Create a new versioned endpoint e.g. /api/v2/notifications
2. Run both v1 and v2 contracts in parallel
3. Migrate consumers to v2 over agreed timebox
4. Deprecate v1 following the deprecation policy above

## Running the Pipeline Locally

    npm install
    npx eslint src/**/*.ts
    npx jest src/producer/app.test.ts --coverage
    npx jest src/consumer/notification.consumer.pact.test.ts --testTimeout=30000
    npx jest src/producer/provider.pact.test.ts --testTimeout=30000
    npx jest src/producer/provider.pact.breaking.test.ts --testTimeout=30000

## Interpreting Pipeline Failures

| Failure stage | Likely cause | Resolution |
|--------------|--------------|------------|
| Lint | TypeScript or ESLint violations | Fix code quality issues |
| Security | High severity npm vulnerability | Update affected dependency |
| Unit tests | Logic regression in Producer API | Fix failing test |
| Consumer contracts | Consumer test logic error | Review Pact interactions |
| Provider verification | Breaking change introduced | Revert or update consumer contracts first |

## Adoption Proposal — DfT Microservice Estate

### Phase 1 (Weeks 1-4)
Pilot with two services. Establish baseline metrics for defect escape rate and detection time.

### Phase 2 (Weeks 5-8)
Extend to all Dynamics 365 integration points. Add PactFlow for centralised contract management.

### Phase 3 (Weeks 9-12)
Mandate CDC gates on all new microservice integrations. Retire fragile E2E tests.

## Success Metrics

- Interface-related defects caught pre-merge: target >90%
- Mean time to detect breaking change: from 3 days (E2E) to under 10 minutes (CI)
- Developer confidence survey: target >80% positive response