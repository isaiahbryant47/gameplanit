# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Recharts (data visualization)
- Supabase (resources DB + anonymized analytics)

## Predictive Analytics (v1)

### Overview
A rules-based, explainable adherence predictor that scores next-week plan adherence probability (0–100%) for each student. The system:

1. **Predicts** adherence using completion rate, streak, plan complexity, and time availability
2. **Flags** at-risk students (probability < 55% or last-week completion < 35%)
3. **Auto-adapts** plans with micro-actions when risk is high
4. **Reports** aggregated, anonymized metrics to partner admins

### Architecture
- **Predictor**: `src/lib/predict/adherence.ts` — deterministic scoring, swappable for ML
- **Analytics Service**: `src/lib/predict/analyticsService.ts` — hashes user IDs (SHA-256), syncs to Supabase
- **DB Tables**: `weekly_checkins` + `prediction_snapshots` (anonymized, no PII)
- **Dashboard**: `AdherencePrediction` component shows probability gauge + drivers
- **Partner View**: `PartnerAnalytics` tab with aggregated charts by grade, hours, transportation

### Seeded Logins
| Role | Email | Password |
|------|-------|----------|
| Partner Admin | partner@gameplanit.org | admin1234 |
| Student | student@gameplanit.org | student1234 |

### Where to See Predictions
- **Student Dashboard** (`/dashboard`): "Predictive Insights" card at top
- **Partner Dashboard** (`/partner`): "Predictive Analytics" tab

### Running Tests
```sh
npx vitest run src/test/adherence.test.ts
```

### Swapping to ML
Replace the `predictAdherence()` function body in `src/lib/predict/adherence.ts` with model inference. The interface (`AdherenceInput → AdherenceResult`) stays the same. The analytics pipeline (checkins → predictions → partner view) is already wired.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
