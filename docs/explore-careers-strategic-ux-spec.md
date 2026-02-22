# Explore Careers: Strategic Planning UX Spec

## 1) Objective
Evolve `/explore-careers` from a browsing page into a strategic decision + planning workspace where learners can:
1. Discover options.
2. Compare and prioritize options.
3. Simulate constraints and likely outcomes.
4. Commit to a plan with confidence.

## 2) Current State Summary
The current experience supports:
- Domain tile selection.
- Relationship map for selected domain.
- Career preview panel with pathway context and start CTA.

Current gaps that prevent strategic planning:
- No search/filter controls.
- No compare flow.
- No profile-constraint fit scoring.
- No scenario simulation before commit.
- No robust error/retry state.
- No persistent shortlist/recently viewed state.

## 3) Product Principles
- **Guided, not overwhelming**: progressive disclosure from explore → compare → plan.
- **Personalized**: reflect learner constraints and readiness.
- **Explainable**: show *why* recommendations are ranked.
- **Actionable**: every insight should map to a next step.
- **Recoverable**: graceful error and retry states.

## 4) Information Architecture
Introduce tabbed sections on Explore Careers:

1. **Explore**
   - Domain and map exploration.
   - Search/filtering and quick recommendations.

2. **Compare**
   - Side-by-side comparison (up to 3 careers).
   - Tradeoff clarity (time, cost, fit, pathway mobility).

3. **Plan**
   - Feasibility simulation with user constraints.
   - 12-week effort preview and blockers.

4. **Commit**
   - Confirm selected path.
   - Set reminders, first actions, and support handoff.

## 5) UX Flows
### Flow A: Smart Start
1. User enters page.
2. Sees “Strategic Fit” summary card with profile completeness.
3. Clicks “Smart Match” to auto-suggest top 3 paths.
4. Adds options to compare.

### Flow B: Manual Explore to Decision
1. User searches or chooses domain.
2. Inspects map relationships.
3. Opens preview and adds to shortlist.
4. Moves to Compare tab, chooses winner.
5. Runs Plan simulation.
6. Commits to path.

### Flow C: Scenario Testing
1. User picks a path in Compare/Plan.
2. Adjusts sliders (time/budget/transport).
3. Fit score and timeline update in real-time.
4. User chooses “now plan” vs “stretch plan.”

## 6) Key Screens & Components

### A. Explore Tab Components
1. **StrategicFitBanner**
   - Inputs: profile constraints, readiness metrics.
   - Outputs: fit summary, profile completeness, recommended next action.

2. **ExploreToolbar**
   - Search input.
   - Filters: tags, time commitment, cost sensitivity, growth level, local/remote.
   - Sort options: best-fit, fastest path, highest growth.

3. **DomainTiles (enhanced)**
   - Show domain counts.
   - Support keyboard navigation and clear selected state.

4. **CareerPathMap (enhanced)**
   - Toggle connection types on/off.
   - Zoom/compact modes for mobile.
   - Legend pinned near map.

5. **CareerPreviewPanel (enhanced)**
   - Add “Add to Compare”, “Save for Later”, “Preview Plan”.
   - Add fit explanation block (why recommended).

### B. Compare Tab Components
1. **CompareTray**
   - Sticky bottom/top tray with selected paths (max 3).

2. **CareerCompareMatrix**
   - Rows:
     - Fit score.
     - Expected weekly effort.
     - Estimated cost burden.
     - Education/credential load.
     - Transferability/adjacent options.
     - Time-to-first-opportunity.

3. **TradeoffCallouts**
   - Natural-language decision guidance.
   - Example: “Path A is best fit now; Path B is higher upside but needs +3 hrs/week.”

### C. Plan Tab Components
1. **ScenarioControls**
   - Sliders for time/week, budget/month, transportation reliability.

2. **FeasibilityMeter**
   - Shows confidence and risk level.

3. **TwelveWeekPreview**
   - Week clusters with milestone expectations and risk flags.

4. **BlockerMitigationPanel**
   - Top blockers + recommended supports/resources.

### D. Commit Tab Components
1. **CommitSummaryCard**
   - Final path selected, rationale, and chosen scenario assumptions.

2. **First30DaysChecklist**
   - Auto-generated actionable steps.

3. **SupportShareModule**
   - Optional share with caregiver/mentor/partner admin.

## 7) Data & Logic Requirements
## 7.1 Existing data leveraged
- `Profile.constraints`: time, budget, transport, responsibilities.
- `CareerPath`: tags, relationships, next-level paths.

## 7.2 Suggested model additions
Add/derive fields to support strategic ranking:
- `effortHoursPerWeekRange`
- `estimatedMonthlyCostRange`
- `demandSignal`
- `entryBarrierLevel`
- `timeToFirstOpportunityWeeks`
- `localAvailabilityScore` (or inferred)
- `fitSignals` (mapped tags/interests)

## 7.3 Scoring framework (v1)
`fitScore = 0.35*interestAlignment + 0.25*constraintCompatibility + 0.2*readiness + 0.2*opportunityPotential`

Rules:
- Penalize paths exceeding budget/time constraints.
- Boost adjacent paths from user’s current path.
- Explain top 2 score drivers in UI.

## 8) States & Edge Cases
- Loading: skeletons for banner, tiles, panel.
- Empty search: friendly “no results” with clear filter reset.
- API error: explicit message + retry button.
- Missing profile data: prompt to complete profile for better fit.
- Mobile constraints: collapse map details; preserve compare actions in sticky tray.

## 9) Accessibility
- Full keyboard operation for tiles, map nodes, compare selections.
- Visible focus styles and ARIA labels on interactive nodes.
- Color + text redundancy for connection types.
- Table comparison semantics for screen readers.

## 10) Analytics / Success Metrics
Track:
- Explore → Compare conversion rate.
- Compare → Plan conversion rate.
- Plan → Commit conversion rate.
- Path switch rate within 30 days.
- Time-to-decision.
- Completion outcomes by chosen path confidence score.

## 11) Delivery Plan
### Phase 1 (High value / low-medium complexity)
- Search/filter toolbar.
- Compare tray + matrix.
- Save/shortlist.
- Error and retry states.

### Phase 2
- Strategic fit banner.
- Fit scoring + explanation copy.
- Preview plan modal.

### Phase 3
- Scenario planning controls.
- Feasibility meter and blockers.
- Commit flow and 30-day checklist.

### Phase 4
- Caregiver/mentor share flow.
- Deeper local opportunity integration.

## 12) Engineering Checklist
- [ ] Add tab layout (Explore/Compare/Plan/Commit).
- [ ] Build `ExploreToolbar` with search + filters + sort.
- [ ] Add compare state store (max 3 selections).
- [ ] Implement `CareerCompareMatrix`.
- [ ] Add shortlist persistence to local storage/profile.
- [ ] Add robust load/error/retry states.
- [ ] Build `PreviewPlan` modal and `TwelveWeekPreview`.
- [ ] Implement fit scoring utility + explainability text.
- [ ] Add scenario sliders and feasibility meter.
- [ ] Add commit summary + first 30 days checklist.
- [ ] Add events for funnel and decision analytics.
- [ ] Add accessibility pass and keyboard QA.

## 13) Design QA Acceptance Criteria
- User can discover careers via search, domain, or smart match.
- User can compare at least 2 careers side-by-side.
- User sees a transparent fit score with explanation.
- User can simulate constraints before committing.
- User can save options and return later.
- User receives clear error/retry messaging if data fails.
- Mobile users can complete end-to-end flow.

## 14) MVP Scope Recommendation
If only one sprint is available, ship:
1. Explore toolbar.
2. Compare tray + matrix.
3. Save/shortlist persistence.
4. Error/retry UX.

This creates immediate strategic value without waiting for full simulation capabilities.
