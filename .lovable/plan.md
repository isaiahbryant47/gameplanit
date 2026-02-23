# GameplanIT — Architecture Implementation Plan

> Phased roadmap to evolve from the current client-heavy prototype to the event-driven, snapshot-backed architecture.

---

## Phase 0 — Foundation Cleanup ✅

**Goal:** Remove localStorage dependency for core data; all reads/writes go through Supabase.

- [x] Create a unified **services layer** (`src/lib/services/`) with modules:
  - `profileService.ts` — CRUD against `profiles` table
  - `planService.ts` — CRUD against `plans` + `plan_weeks`
  - `progressService.ts` — Read/write action completion to `user_progress` table
  - `readinessService.ts` — Thin wrapper around `user_readiness` + `user_pillar_progress`
  - `evidenceService.ts` — Upload/list/delete student artifacts
- [x] **Migration:** Create `user_progress` table (user_id, plan_id, completed_actions, etc.) with RLS
- [x] Update all page components to call services instead of `storage.*`
- [x] Verify all existing tests still pass

**Ship criteria:** ✅ App works identically but all data lives in Supabase. No localStorage for core data.

---

## Phase 1 — Event Log & Activity Tracking ✅

**Goal:** Introduce an append-only event table so downstream workers can react to student actions.

- [x] **Migration:** Create `student_events` table with RLS (users INSERT own; partner_admins SELECT all)
- [x] Create `activityService.ts` — emits events on every meaningful user action
- [x] Wire activity service into existing UI flows (checkbox toggles, opportunity accepts, etc.)
- [x] Event types: `action_completed`, `action_uncompleted`, `goal_completed`, `resource_engaged`, `opportunity_accepted`, `cycle_started`, `reflection_submitted`, `profile_updated`, `plan_adapted`

**Ship criteria:** ✅ Every user action writes an event row. Events are recorded and available for downstream processing.

---

## Phase 2 — Server-Side Workers (Edge Functions) ✅

**Goal:** Move readiness recomputation, unlock evaluation, and snapshot generation to edge functions triggered by events.

- [x] **Edge function: `recompute-readiness`** — Reads progress + events → writes to `user_readiness` + `user_pillar_progress`, also evaluates unlock rules in a single round-trip
- [x] **Edge function: `evaluate-unlocks`** — Standalone function to check `career_unlock_rules` → inserts into `user_career_unlocks`
- [x] Created `readinessService.ts` wrapper for typed `supabase.functions.invoke` calls
- [x] Remove client-side readiness computation from Dashboard; replaced with server-side call
- [x] Updated `supabase/config.toml` with function registrations

**Ship criteria:** ✅ Readiness scores and unlocks are computed server-side. Dashboard calls edge functions instead of computing on the fly.

---

## Phase 3 — File Storage & Evidence ✅

**Goal:** Let students upload artifacts (resumes, certificates, reflections) as proof of progress.

- [x] **Create storage bucket:** `student-artifacts` (private, user-scoped)
- [x] **Migration:** Create `student_evidence` table with RLS
- [x] Build `evidenceService.ts` for upload/list/delete with signed URLs
- [x] Update Certs & Proof page to use real uploads (10MB limit, file type validation)
- [x] Exported evidence service from `services/index.ts`

**Ship criteria:** ✅ Students can upload files and see them on their Certs & Proof page. Files are stored securely per-user.

---

## Phase 4 — Computed Snapshots & Partner Analytics ✅

**Goal:** Materialized snapshot tables power partner analytics dashboards.

- [x] **Migration:** Create `partner_analytics_snapshot` table with RLS (partner_admin only)
- [x] **Edge function: `build-analytics-snapshot`** — Aggregates plans, predictions, pathways, readiness into a single snapshot with k-anonymity suppression
- [x] Enabled `pg_cron` + `pg_net` extensions; scheduled 15-minute cron job for snapshot rebuilds
- [x] Updated `analyticsService.ts` to read from pre-computed snapshot
- [x] Updated `PartnerAnalytics.tsx` to display readiness tier distribution from snapshot data

**Ship criteria:** ✅ Partner dashboard loads in <1s from pre-aggregated data.

---

## Phase 5 — Notifications & Engagement (Next)

**Goal:** Proactive nudges based on event patterns.

### 5a — In-App Notification Center
- [ ] **Migration:** Create `notifications` table (id, user_id, type, title, message, metadata, read, created_at) with RLS
- [ ] Create `notificationService.ts` — CRUD for notifications, mark-as-read, unread count
- [ ] Build notification bell/dropdown UI component in dashboard header
- [ ] Real-time subscription for new notifications via Supabase Realtime

### 5b — Inactivity Detection
- [ ] **Edge function: `detect-inactivity`** — Scans `student_events` for users with no activity in X days
- [ ] Inserts nudge notifications into `notifications` table
- [ ] Schedule via `pg_cron` (daily check)

### 5c — Unlock & Milestone Alerts
- [ ] Modify `recompute-readiness` or `evaluate-unlocks` to insert a notification when a new unlock is granted
- [ ] Notification types: `unlock_granted`, `milestone_reached`, `inactivity_nudge`, `weekly_summary`

### 5d — Email Notifications (Optional, requires email domain)
- [ ] Weekly digest edge function summarizing progress, upcoming actions, new unlocks
- [ ] Email via Lovable auth email templates or Resend integration
- [ ] User preference toggle for email notifications

**Ship criteria:** Students receive timely in-app nudges. Partners see engagement metrics. Email digests are opt-in.

---

## Guiding Principles

1. **Each phase ships independently** — no phase depends on a future phase being complete.
2. **No breaking changes** — each phase maintains backward compatibility.
3. **RLS everywhere** — every new table gets user-scoped policies from day one.
4. **Services over direct queries** — UI components never import `supabase` directly; they go through service modules.
5. **Events are the source of truth** — computed tables are derived from the event log.
