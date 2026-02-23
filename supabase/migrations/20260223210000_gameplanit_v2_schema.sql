-- =============================================================================
-- GamePlanIT V2 Schema Migration
-- =============================================================================
-- Implements the full Completion Standards schema:
--   Student-owned portability, Journey→Milestone→Task→Evidence→Review,
--   Dashboard feed, Opportunity matching, Partner reporting.
--
-- Conflicting legacy tables (plans, plan_weeks, opportunities) are renamed
-- to *_legacy so existing data is preserved but the new schema takes over.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Rename conflicting legacy tables
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS plans           RENAME TO plans_legacy;
ALTER TABLE IF EXISTS plan_weeks      RENAME TO plan_weeks_legacy;
ALTER TABLE IF EXISTS opportunities   RENAME TO opportunities_legacy;

-- Rename FK constraints on tables that reference the renamed tables
-- (plan_weeks_legacy → plans_legacy)
ALTER TABLE IF EXISTS plan_weeks_legacy
  RENAME CONSTRAINT plan_weeks_plan_id_fkey TO plan_weeks_legacy_plan_id_fkey;

-- Rename related tables that reference legacy opportunities
ALTER TABLE IF EXISTS pathway_opportunities
  RENAME CONSTRAINT pathway_opportunities_opportunity_id_fkey
  TO pathway_opportunities_legacy_opportunity_id_fkey;

ALTER TABLE IF EXISTS user_unlocked_opportunities
  RENAME CONSTRAINT user_unlocked_opportunities_opportunity_id_fkey
  TO user_unlocked_opportunities_legacy_opportunity_id_fkey;

-- Rename FK on plans_legacy that points to career_paths and pathways
ALTER TABLE IF EXISTS plans_legacy
  RENAME CONSTRAINT plans_career_path_id_fkey TO plans_legacy_career_path_id_fkey;

ALTER TABLE IF EXISTS plans_legacy
  RENAME CONSTRAINT plans_pathway_id_fkey TO plans_legacy_pathway_id_fkey;


-- ===========================================================================
-- 1) Identity, Orgs, Roles, Permissions
-- ===========================================================================

-- users (public-schema mirror of auth.users with app-level fields)
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE,
  phone           text UNIQUE,
  display_name    text,
  role_primary    text NOT NULL CHECK (role_primary IN ('student','caregiver','coach','org_admin','super_admin')),
  dob             date,
  zipcode         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- organizations
CREATE TABLE organizations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  org_type        text NOT NULL CHECK (org_type IN ('school_district','school','nonprofit','program','other')),
  city            text,
  state           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- org_memberships (User ↔ Org)
CREATE TABLE org_memberships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_role        text NOT NULL CHECK (org_role IN ('student','caregiver','coach','org_admin')),
  status          text NOT NULL CHECK (status IN ('active','inactive','ended')) DEFAULT 'active',
  start_at        timestamptz NOT NULL DEFAULT now(),
  end_at          timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_memberships_org_role_status ON org_memberships (org_id, org_role, status);
CREATE INDEX idx_org_memberships_user_status     ON org_memberships (user_id, status);

-- caregiver_links (Caregiver ↔ Student)
CREATE TABLE caregiver_links (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship        text,
  permission_level    text NOT NULL CHECK (permission_level IN ('view_only','collaborate','full')) DEFAULT 'view_only',
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (caregiver_user_id, student_user_id)
);

-- consents
CREATE TABLE consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type    text NOT NULL CHECK (consent_type IN ('terms','privacy','parental')),
  consented_at    timestamptz NOT NULL DEFAULT now(),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb
);


-- ===========================================================================
-- 2) Student Profile + Constraints
-- ===========================================================================

CREATE TABLE student_profiles (
  user_id                     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  grade_level                 int CHECK (grade_level BETWEEN 7 AND 12),
  school_name                 text,
  gpa                         numeric(3,2),
  experience_level            text,
  weekly_hours_available      int CHECK (weekly_hours_available BETWEEN 0 AND 40),
  internet_access             text CHECK (internet_access IN ('reliable','spotty','none')),
  transport_mode              text CHECK (transport_mode IN ('walk','public_transit','car','rideshare','virtual_only','mixed')),
  budget_level                text CHECK (budget_level IN ('none','low','medium','high')),
  work_hours_per_week         int,
  caregiving_responsibilities boolean NOT NULL DEFAULT false,
  updated_at                  timestamptz NOT NULL DEFAULT now()
);


-- ===========================================================================
-- 3) Goals
-- ===========================================================================

CREATE TABLE goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type       text NOT NULL CHECK (goal_type IN ('grades','career_exposure','college_prep','skills','certification','internship','other')),
  title           text NOT NULL,
  description     text,
  target_metric   text,
  target_date     date,
  constraints_notes text,
  clarity_score   int NOT NULL DEFAULT 0 CHECK (clarity_score BETWEEN 0 AND 100),
  status          text NOT NULL CHECK (status IN ('draft','active','paused','completed','archived')) DEFAULT 'draft',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_goals_user_status ON goals (user_id, status);

CREATE TABLE goal_tags (
  goal_id   uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  tag       text NOT NULL,
  PRIMARY KEY (goal_id, tag)
);


-- ===========================================================================
-- 4) Templates (Completion Standards library)
-- ===========================================================================

CREATE TABLE journey_templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  description       text,
  grade_band        text,
  duration_weeks    int NOT NULL DEFAULT 12,
  created_by_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  visibility        text NOT NULL CHECK (visibility IN ('public','org_only','private')) DEFAULT 'public',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE milestone_templates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_template_id   uuid NOT NULL REFERENCES journey_templates(id) ON DELETE CASCADE,
  title                 text NOT NULL,
  description           text,
  order_index           int NOT NULL,
  success_criteria      text
);

CREATE TABLE task_templates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_template_id   uuid NOT NULL REFERENCES milestone_templates(id) ON DELETE CASCADE,
  title                   text NOT NULL,
  description             text,
  task_type               text NOT NULL CHECK (task_type IN ('reflection','quiz','resource','event','mentor_outreach','upload','application','custom')),
  estimated_minutes       int,
  requires_evidence       boolean NOT NULL DEFAULT false,
  requires_review         boolean NOT NULL DEFAULT false,
  default_priority        int NOT NULL DEFAULT 50 CHECK (default_priority BETWEEN 0 AND 100),
  content_ref             jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index             int NOT NULL
);

CREATE TABLE task_template_tags (
  task_template_id uuid NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  tag              text NOT NULL,
  PRIMARY KEY (task_template_id, tag)
);


-- ===========================================================================
-- 5) Plans (instantiated journeys per student)
-- ===========================================================================

CREATE TABLE plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id               uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  journey_template_id   uuid NOT NULL REFERENCES journey_templates(id) ON DELETE RESTRICT,
  org_id                uuid REFERENCES organizations(id) ON DELETE SET NULL,
  start_date            date NOT NULL DEFAULT current_date,
  end_date              date,
  status                text NOT NULL CHECK (status IN ('active','paused','completed','archived')) DEFAULT 'active',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plan_weeks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  week_number     int NOT NULL,
  week_start_date date NOT NULL,
  focus_theme     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, week_number)
);

CREATE TABLE plan_milestones (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                 uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  milestone_template_id   uuid NOT NULL REFERENCES milestone_templates(id) ON DELETE RESTRICT,
  status                  text NOT NULL CHECK (status IN ('not_started','in_progress','completed')) DEFAULT 'not_started',
  completed_at            timestamptz
);

-- tasks (instantiated tasks = student "To-Do List")
CREATE TABLE tasks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_template_id    uuid REFERENCES task_templates(id) ON DELETE SET NULL,
  title               text NOT NULL,
  description         text,
  task_type           text NOT NULL,
  priority            int NOT NULL DEFAULT 50,
  due_at              timestamptz,
  status              text NOT NULL CHECK (status IN (
                        'not_started','in_progress','submitted','in_review',
                        'approved','needs_revision','rejected','exempt','completed'
                      )) DEFAULT 'not_started',
  completed_at        timestamptz,
  exempt_reason       text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_user_status ON tasks (user_id, status);
CREATE INDEX idx_tasks_plan        ON tasks (plan_id);
CREATE INDEX idx_tasks_due_at      ON tasks (due_at);

-- task_dependencies (optional; for sequencing)
CREATE TABLE task_dependencies (
  task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id  uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id),
  CHECK (task_id <> depends_on_task_id)
);


-- ===========================================================================
-- 6) Evidence + Review (portfolio + approvals)
-- ===========================================================================

-- artifacts (portfolio items; can be linked to tasks or standalone)
CREATE TABLE artifacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artifact_type   text NOT NULL CHECK (artifact_type IN ('reflection','file','link','resume','certificate','project','note')),
  title           text NOT NULL,
  content_text    text,
  content_url     text,
  storage_path    text,
  visibility      text NOT NULL CHECK (visibility IN ('private','shared_with_org','shared_with_coach','public_link')) DEFAULT 'private',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  artifact_id     uuid NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

-- reviews (coach/admin approval queue)
CREATE TABLE reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id              uuid REFERENCES organizations(id) ON DELETE SET NULL,
  status              text NOT NULL CHECK (status IN ('pending','approved','rejected','needs_revision')) DEFAULT 'pending',
  feedback            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  resolved_at         timestamptz
);
CREATE INDEX idx_reviews_status_org ON reviews (status, org_id);


-- ===========================================================================
-- 7) Opportunities (local resources + matching)
-- ===========================================================================

CREATE TABLE opportunities (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   text NOT NULL,
  description             text NOT NULL,
  provider_name           text,
  url                     text,
  mode                    text NOT NULL CHECK (mode IN ('in_person','virtual','hybrid')),
  cost_type               text NOT NULL CHECK (cost_type IN ('free','paid','scholarship_available')),
  min_grade               int,
  max_grade               int,
  time_commitment_hours   numeric(5,2),
  start_date              date,
  end_date                date,
  deadline_date           date,
  location_name           text,
  zipcode                 text,
  latitude                numeric(9,6),
  longitude               numeric(9,6),
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE opportunity_tags (
  opportunity_id  uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  tag             text NOT NULL,
  PRIMARY KEY (opportunity_id, tag)
);

CREATE TABLE opportunity_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id         uuid REFERENCES goals(id) ON DELETE SET NULL,
  opportunity_id  uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  score           int NOT NULL CHECK (score BETWEEN 0 AND 100),
  reasons         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_opportunity_matches_user_score ON opportunity_matches (user_id, score DESC);

CREATE TABLE task_opportunities (
  task_id         uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  opportunity_id  uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, opportunity_id)
);


-- ===========================================================================
-- 8) Feed + Analytics (dashboard "next actions")
-- ===========================================================================

CREATE TABLE feed_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type       text NOT NULL CHECK (item_type IN ('task','opportunity','insight','nudge','milestone')),
  ref_id          uuid,
  title           text NOT NULL,
  subtitle        text,
  why_this        text,
  rank_score      int NOT NULL DEFAULT 50,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_feed_items_user_rank ON feed_items (user_id, rank_score DESC);

-- events (event tracking for behavior + outcomes)
CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id          uuid REFERENCES organizations(id) ON DELETE SET NULL,
  event_type      text NOT NULL,
  entity_type     text,
  entity_id       uuid,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_type_created   ON events (event_type, created_at);
CREATE INDEX idx_events_user_created   ON events (user_id, created_at);


-- ===========================================================================
-- 9) Outcomes ("doors opened" layer)
-- ===========================================================================

CREATE TABLE outcomes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id                 uuid REFERENCES goals(id) ON DELETE SET NULL,
  outcome_type            text NOT NULL CHECK (outcome_type IN (
                            'mentor_conversation','event_attended','application_submitted',
                            'interview_scheduled','certification_earned','job_shadow',
                            'portfolio_completed','other'
                          )),
  title                   text NOT NULL,
  description             text,
  occurred_on             date NOT NULL,
  verification_status     text NOT NULL CHECK (verification_status IN ('self_reported','pending','verified')) DEFAULT 'self_reported',
  verified_by_user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  evidence_artifact_id    uuid REFERENCES artifacts(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_outcomes_user_date ON outcomes (user_id, occurred_on DESC);


-- ===========================================================================
-- 10) Partner Reporting (privacy-first)
-- ===========================================================================

CREATE TABLE org_reporting_policies (
  org_id                      uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  allow_individual_level      boolean NOT NULL DEFAULT false,
  minimum_aggregation_n       int NOT NULL DEFAULT 10,
  created_at                  timestamptz NOT NULL DEFAULT now()
);


-- ===========================================================================
-- 11) Row-Level Security Policies
-- ===========================================================================

-- Enable RLS on all new tables
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships        ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_links        ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_template_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_weeks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_milestones        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_evidence          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_matches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_opportunities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcomes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_reporting_policies ENABLE ROW LEVEL SECURITY;

-- ---- users ----
CREATE POLICY "Users can read own row"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own row"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ---- organizations ----
-- Readable by any authenticated member of the org
CREATE POLICY "Org members can read their org"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- Org admins can update their org
CREATE POLICY "Org admins can update org"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.org_role = 'org_admin'
        AND om.status = 'active'
    )
  );

-- ---- org_memberships ----
CREATE POLICY "Users can read own memberships"
  ON org_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Org admins can read all memberships in their org"
  ON org_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.org_role = 'org_admin'
        AND om.status = 'active'
    )
  );

CREATE POLICY "Org admins can manage memberships"
  ON org_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = org_memberships.org_id
        AND om.user_id = auth.uid()
        AND om.org_role = 'org_admin'
        AND om.status = 'active'
    )
  );

-- ---- caregiver_links ----
CREATE POLICY "Caregivers can read their links"
  ON caregiver_links FOR SELECT
  USING (caregiver_user_id = auth.uid() OR student_user_id = auth.uid());

-- ---- consents ----
CREATE POLICY "Users can read own consents"
  ON consents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own consents"
  ON consents FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ---- student_profiles ----
CREATE POLICY "Students can read/update own profile"
  ON student_profiles FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can read profiles in their org"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships coach_om
      JOIN org_memberships student_om ON coach_om.org_id = student_om.org_id
      WHERE coach_om.user_id = auth.uid()
        AND coach_om.org_role IN ('coach','org_admin')
        AND coach_om.status = 'active'
        AND student_om.user_id = student_profiles.user_id
        AND student_om.status = 'active'
    )
  );

-- ---- goals ----
CREATE POLICY "Students own their goals"
  ON goals FOR ALL
  USING (user_id = auth.uid());

-- ---- goal_tags ----
CREATE POLICY "Students can manage tags on own goals"
  ON goal_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM goals g WHERE g.id = goal_tags.goal_id AND g.user_id = auth.uid())
  );

-- ---- journey_templates ----
-- Public templates readable by all authenticated users
CREATE POLICY "Anyone can read public templates"
  ON journey_templates FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Org members can read org templates"
  ON journey_templates FOR SELECT
  USING (
    visibility = 'org_only'
    AND EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = journey_templates.created_by_org_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- ---- milestone_templates ----
CREATE POLICY "Readable via journey template access"
  ON milestone_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journey_templates jt
      WHERE jt.id = milestone_templates.journey_template_id
        AND (
          jt.visibility = 'public'
          OR EXISTS (
            SELECT 1 FROM org_memberships om
            WHERE om.org_id = jt.created_by_org_id
              AND om.user_id = auth.uid()
              AND om.status = 'active'
          )
        )
    )
  );

-- ---- task_templates ----
CREATE POLICY "Readable via milestone template access"
  ON task_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM milestone_templates mt
      JOIN journey_templates jt ON jt.id = mt.journey_template_id
      WHERE mt.id = task_templates.milestone_template_id
        AND (
          jt.visibility = 'public'
          OR EXISTS (
            SELECT 1 FROM org_memberships om
            WHERE om.org_id = jt.created_by_org_id
              AND om.user_id = auth.uid()
              AND om.status = 'active'
          )
        )
    )
  );

-- ---- task_template_tags ----
CREATE POLICY "Readable via task template access"
  ON task_template_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_templates tt
      JOIN milestone_templates mt ON mt.id = tt.milestone_template_id
      JOIN journey_templates jt ON jt.id = mt.journey_template_id
      WHERE tt.id = task_template_tags.task_template_id
        AND (
          jt.visibility = 'public'
          OR EXISTS (
            SELECT 1 FROM org_memberships om
            WHERE om.org_id = jt.created_by_org_id
              AND om.user_id = auth.uid()
              AND om.status = 'active'
          )
        )
    )
  );

-- ---- plans ----
CREATE POLICY "Students own their plans"
  ON plans FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can read plans in their org"
  ON plans FOR SELECT
  USING (
    org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = plans.org_id
        AND om.user_id = auth.uid()
        AND om.org_role IN ('coach','org_admin')
        AND om.status = 'active'
    )
  );

-- ---- plan_weeks ----
CREATE POLICY "Students own their plan weeks"
  ON plan_weeks FOR ALL
  USING (
    EXISTS (SELECT 1 FROM plans p WHERE p.id = plan_weeks.plan_id AND p.user_id = auth.uid())
  );

-- ---- plan_milestones ----
CREATE POLICY "Students own their plan milestones"
  ON plan_milestones FOR ALL
  USING (
    EXISTS (SELECT 1 FROM plans p WHERE p.id = plan_milestones.plan_id AND p.user_id = auth.uid())
  );

-- ---- tasks ----
CREATE POLICY "Students own their tasks"
  ON tasks FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can read tasks in their org"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plans p
      JOIN org_memberships om ON om.org_id = p.org_id
      WHERE p.id = tasks.plan_id
        AND om.user_id = auth.uid()
        AND om.org_role IN ('coach','org_admin')
        AND om.status = 'active'
    )
  );

-- ---- task_dependencies ----
CREATE POLICY "Students can manage own task deps"
  ON task_dependencies FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_dependencies.task_id AND t.user_id = auth.uid())
  );

-- ---- artifacts ----
CREATE POLICY "Students own their artifacts"
  ON artifacts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can read shared artifacts"
  ON artifacts FOR SELECT
  USING (
    visibility IN ('shared_with_org','shared_with_coach')
    AND EXISTS (
      SELECT 1 FROM org_memberships coach_om
      JOIN org_memberships student_om ON coach_om.org_id = student_om.org_id
      WHERE coach_om.user_id = auth.uid()
        AND coach_om.org_role IN ('coach','org_admin')
        AND coach_om.status = 'active'
        AND student_om.user_id = artifacts.user_id
        AND student_om.status = 'active'
    )
  );

-- ---- task_evidence ----
CREATE POLICY "Students can manage own task evidence"
  ON task_evidence FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_evidence.task_id AND t.user_id = auth.uid())
  );

-- ---- reviews ----
CREATE POLICY "Students can read reviews on their tasks"
  ON reviews FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = reviews.task_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Reviewers can manage their reviews"
  ON reviews FOR ALL
  USING (reviewer_user_id = auth.uid());

-- ---- opportunities ----
-- Public catalog: readable by all authenticated users
CREATE POLICY "Opportunities are publicly readable"
  ON opportunities FOR SELECT
  USING (true);

-- ---- opportunity_tags ----
CREATE POLICY "Opportunity tags are publicly readable"
  ON opportunity_tags FOR SELECT
  USING (true);

-- ---- opportunity_matches ----
CREATE POLICY "Students own their matches"
  ON opportunity_matches FOR ALL
  USING (user_id = auth.uid());

-- ---- task_opportunities ----
CREATE POLICY "Students can manage task-opportunity links"
  ON task_opportunities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_opportunities.task_id AND t.user_id = auth.uid())
  );

-- ---- feed_items ----
CREATE POLICY "Students own their feed"
  ON feed_items FOR ALL
  USING (user_id = auth.uid());

-- ---- events ----
CREATE POLICY "Students can read own events"
  ON events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Students can insert own events"
  ON events FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ---- outcomes ----
CREATE POLICY "Students own their outcomes"
  ON outcomes FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can read outcomes in their org"
  ON outcomes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships coach_om
      JOIN org_memberships student_om ON coach_om.org_id = student_om.org_id
      WHERE coach_om.user_id = auth.uid()
        AND coach_om.org_role IN ('coach','org_admin')
        AND coach_om.status = 'active'
        AND student_om.user_id = outcomes.user_id
        AND student_om.status = 'active'
    )
  );

-- ---- org_reporting_policies ----
CREATE POLICY "Org admins can manage reporting policies"
  ON org_reporting_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships om
      WHERE om.org_id = org_reporting_policies.org_id
        AND om.user_id = auth.uid()
        AND om.org_role = 'org_admin'
        AND om.status = 'active'
    )
  );


-- ===========================================================================
-- 12) Helper: updated_at trigger
-- ===========================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ===========================================================================
-- 13) Convenience views for partner reporting
-- ===========================================================================

-- Aggregated plan completion by org (respects minimum_aggregation_n)
CREATE OR REPLACE VIEW v_org_plan_completion AS
SELECT
  om.org_id,
  o.name                                          AS org_name,
  COUNT(DISTINCT p.user_id)                       AS student_count,
  COUNT(p.id)                                     AS total_plans,
  COUNT(p.id) FILTER (WHERE p.status = 'completed') AS completed_plans,
  ROUND(
    100.0 * COUNT(p.id) FILTER (WHERE p.status = 'completed') / NULLIF(COUNT(p.id), 0),
    1
  )                                               AS completion_rate_pct
FROM org_memberships om
JOIN organizations o ON o.id = om.org_id
LEFT JOIN plans p ON p.user_id = om.user_id
WHERE om.org_role = 'student'
  AND om.status = 'active'
GROUP BY om.org_id, o.name
HAVING COUNT(DISTINCT om.user_id) >= (
  SELECT COALESCE(rp.minimum_aggregation_n, 10)
  FROM org_reporting_policies rp
  WHERE rp.org_id = om.org_id
);

-- Aggregated task completion by org
CREATE OR REPLACE VIEW v_org_task_completion AS
SELECT
  om.org_id,
  o.name                                           AS org_name,
  COUNT(DISTINCT t.user_id)                        AS student_count,
  COUNT(t.id)                                      AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'approved')  AS approved_tasks,
  ROUND(
    100.0 * COUNT(t.id) FILTER (WHERE t.status IN ('completed','approved')) / NULLIF(COUNT(t.id), 0),
    1
  )                                                AS completion_rate_pct
FROM org_memberships om
JOIN organizations o ON o.id = om.org_id
LEFT JOIN tasks t ON t.user_id = om.user_id
WHERE om.org_role = 'student'
  AND om.status = 'active'
GROUP BY om.org_id, o.name
HAVING COUNT(DISTINCT om.user_id) >= (
  SELECT COALESCE(rp.minimum_aggregation_n, 10)
  FROM org_reporting_policies rp
  WHERE rp.org_id = om.org_id
);

-- Aggregated outcome counts by org
CREATE OR REPLACE VIEW v_org_outcomes AS
SELECT
  om.org_id,
  o.name                                            AS org_name,
  COUNT(DISTINCT oc.user_id)                        AS students_with_outcomes,
  COUNT(oc.id)                                      AS total_outcomes,
  COUNT(oc.id) FILTER (WHERE oc.verification_status = 'verified') AS verified_outcomes,
  oc.outcome_type,
  COUNT(oc.id)                                      AS type_count
FROM org_memberships om
JOIN organizations o ON o.id = om.org_id
LEFT JOIN outcomes oc ON oc.user_id = om.user_id
WHERE om.org_role = 'student'
  AND om.status = 'active'
GROUP BY om.org_id, o.name, oc.outcome_type
HAVING COUNT(DISTINCT om.user_id) >= (
  SELECT COALESCE(rp.minimum_aggregation_n, 10)
  FROM org_reporting_policies rp
  WHERE rp.org_id = om.org_id
);
