# GameplanIT — Architecture Implementation Plan

> Phased roadmap to evolve from the current client-heavy prototype to the event-driven, snapshot-backed architecture.

---

## Phase 0 — Foundation Cleanup (Current → Stable Baseline)

**Goal:** Remove localStorage dependency for core data; all reads/writes go through Supabase.

- [ ] Create a unified **services layer** (`src/lib/services/`) with modules:
  - `profileService.ts` — CRUD against `profiles` table (replace `storage.allProfiles()`)
  - `planService.ts` — CRUD against `plans` + `plan_weeks` (replace `storage.allPlans()`)
  - `progressService.ts` — Read/write action completion to a new `user_action_progress` table (replace localStorage `gp_progress`)
  - `readinessService.ts` — Thin wrapper around `user_readiness` + `user_pillar_progress`
  - `opportunityService.ts` — Combines `career_opportunities`, `career_unlock_rules`, `user_career_unlocks`
- [ ] **Migration:** Create `user_action_progress` table (user_id, plan_id, week_id, action_index, completed_at) with RLS
- [ ] Update all page components to call services instead of `storage.*`
- [ ] Remove `src/lib/storage.ts` once fully migrated
- [ ] Verify all existing tests still pass

**Ship criteria:** App works identically but all data lives in Supabase. No localStorage for core data.

---

## Phase 1 — Event Log & Activity Tracking

**Goal:** Introduce an append-only event table so downstream workers can react to student actions.

- [ ] **Migration:** Create `student_events` table:
  ```
  id, user_id, event_type, payload (jsonb), created_at
  ```
  - RLS: users INSERT own events; partner_admins SELECT all
  - Event types: `action_completed`, `action_uncompleted`, `goal_completed`, `resource_engaged`, `opportunity_accepted`, `cycle_started`, `reflection_submitted`
- [ ] Create `activityService.ts` — emits events on every meaningful user action
- [ ] Wire activity service into existing UI flows (checkbox toggles, opportunity accepts, etc.)
- [ ] Enable realtime on `student_events` for future dashboard use

**Ship criteria:** Every user action writes an event row. No behavior changes yet — events are recorded but not consumed.

---

## Phase 2 — Server-Side Workers (Edge Functions)

**Goal:** Move readiness recomputation, unlock evaluation, and snapshot generation to edge functions triggered by events.

- [ ] **Edge function: `recompute-readiness`**
  - Triggered via DB webhook or cron
  - Reads `student_events` + `user_action_progress` → writes to `user_readiness` + `user_pillar_progress`
- [ ] **Edge function: `evaluate-unlocks`**
  - After readiness update, checks `career_unlock_rules` → inserts into `user_career_unlocks`
- [ ] **Edge function: `build-dashboard-snapshot`**
  - Aggregates profile, plan, readiness, unlocks → writes to new `student_dashboard_snapshot` table
- [ ] **Migration:** Create `student_dashboard_snapshot` table (user_id, snapshot_json, computed_at) with RLS
- [ ] Remove client-side readiness computation from UI components
- [ ] Dashboard reads from snapshot table instead of computing on the fly

**Ship criteria:** Readiness scores and unlocks are computed server-side. Dashboard loads from pre-computed snapshots.

---

## Phase 3 — File Storage & Evidence

**Goal:** Let students upload artifacts (resumes, certificates, reflections) as proof of progress.

- [ ] **Create storage bucket:** `student-artifacts` (private, user-scoped)
- [ ] **Migration:** Create `student_evidence` table:
  ```
  id, user_id, pillar_id, title, description, file_path, evidence_type, created_at
  ```
- [ ] Build `evidenceService.ts` for upload/list/delete
- [ ] Update Certs & Proof page to use real uploads instead of placeholder UI
- [ ] Emit `evidence_uploaded` event to `student_events`

**Ship criteria:** Students can upload files and see them on their Certs & Proof page. Files are stored securely per-user.

---

## Phase 4 — Computed Snapshots & Partner Analytics

**Goal:** Materialized views / snapshot tables power both student dashboards and partner analytics.

- [ ] **Migration:** Create `student_profile_snapshot` and `student_readiness_snapshot` tables
- [ ] Edge function cron job rebuilds snapshots periodically (e.g., every 15 min or on event)
- [ ] Partner analytics page reads from snapshot tables (fast, no joins)
- [ ] Add aggregate views for partner dashboard (cohort completion rates, readiness distribution)

**Ship criteria:** Partner dashboard loads in <1s from pre-aggregated data. Student dashboard is instant.

---

## Phase 5 — Notifications & Engagement (Optional)

**Goal:** Proactive nudges based on event patterns.

- [ ] Edge function checks for inactivity (no events in X days) → queues notification
- [ ] Email notifications via edge function (weekly digest, unlock alerts)
- [ ] In-app notification center (unread unlocks, reminders)

**Ship criteria:** Students receive timely nudges. Partners see engagement metrics.

---

## Guiding Principles

1. **Each phase ships independently** — no phase depends on a future phase being complete.
2. **No breaking changes** — each phase maintains backward compatibility.
3. **RLS everywhere** — every new table gets user-scoped policies from day one.
4. **Services over direct queries** — UI components never import `supabase` directly; they go through service modules.
5. **Events are the source of truth** — computed tables are derived from the event log.
