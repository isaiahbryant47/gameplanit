# Project Gap Analysis

This document identifies the highest-impact project gaps based on the current codebase.

## 1) Developer onboarding + production documentation is incomplete
- The README is still the default Lovable scaffold and includes placeholder project URLs (`REPLACE_WITH_PROJECT_ID`) instead of environment-specific setup and deployment guidance.
- There is no documented runbook for local Supabase setup, seed data strategy, environment variables, or release checks.

**Risk:** New contributors and operators will struggle to reliably stand up, test, and deploy the app.

## 2) Authentication model is inconsistent and insecure in parts
- Legacy local-storage auth still seeds plaintext credentials in client storage.
- The app also uses Supabase auth and role lookup in `useAuth`, creating a split auth model and unclear source of truth.

**Risk:** Security and maintainability issues (plaintext passwords, role drift, hard-to-debug user state).

## 3) Type safety is weak in critical data paths
- Multiple services/components rely on `any` while mapping Supabase rows and handling errors (`pathwayService`, `unlockService`, `readinessEngine`, `ResourceDiscovery`, etc.).
- This bypasses compile-time checks and increases runtime breakage risk when schema fields change.

**Risk:** Silent runtime bugs and fragile integrations.

## 4) Readiness / progression logic is partially placeholder
- `computeReadinessScore` is explicitly marked as a placeholder for a later phase and uses a fixed weighted heuristic.
- Unlock + readiness logic lacks visible calibration validation and appears disconnected from measurable outcome backtesting.

**Risk:** Student progression scores may not be reliable enough for interventions or partner reporting.

## 5) Testing strategy is underpowered and currently blocked in this environment
- Test suite includes a placeholder test (`example.test.ts`) rather than meaningful behavior coverage.
- Existing tests focus mostly on utility logic; there is little/no integration coverage for auth flows, Supabase functions, or edge cases in async data paths.
- In this environment, dependency installation and test execution are blocked by a registry access error for `@testing-library/dom`.

**Risk:** Regressions in high-value flows can ship undetected.

## 6) Observability and error-handling standards are not consistent
- Some services simply log and return empty arrays on backend failure, which can hide incidents from users and operators.
- Edge functions include retry/logging behavior but no documented monitoring/SLO posture.

**Risk:** Failures degrade user outcomes quietly and are hard to triage.

## Recommended priority order
1. **Unify auth + remove local plaintext credential storage**.
2. **Strengthen typing (`any` removal) and schema-safe data mappers**.
3. **Fix test infra and add integration coverage for auth/plan/resource flows**.
4. **Complete operational docs (env, deploy, rollback, runbooks)**.
5. **Instrument observability and alerting for Supabase functions**.
6. **Calibrate readiness/unlock scoring against outcome data**.
