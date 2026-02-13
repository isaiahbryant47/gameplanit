

# Onboarding Language Refresh

## New Section Titles and Microcopy

| Step | Current Title | New Title | Subtext |
|------|--------------|-----------|---------|
| 1 | Account | **Get Started** | "Set up your login so we can save your plan and keep it just for you." |
| 2 | About You | **Your World** | "Tell us a little about where you are right now — it helps us find the right opportunities near you." |
| 3 | Goals | **Where You're Headed** | "What do you want to explore or accomplish? Even a rough idea helps us build something real." |
| 4 | Constraints | **Your Real Life** | "We all juggle different things. Sharing what your schedule and resources look like helps us make a plan that actually fits." |

## Heading Text Updates

Each step currently shows a heading (e.g., "Create your account"). Updated:

- Step 1: **"Let's get you set up"**
- Step 2: **"Tell us about your world"**
- Step 3: **"What are you working toward?"**
- Step 4: **"What does your week look like?"**

## Why This Matters

Students from underserved communities are more likely to abandon forms that feel like institutional intake surveys. Words like "constraints" signal deficit framing -- they tell students "we see your limitations." Reframing to "Your Real Life" says "we see your reality and we're building around it." Forward-looking, strength-based language increases trust, reduces form abandonment, and signals that the platform is built *with* students, not *about* them.

## Technical Changes

**Single file:** `src/pages/Onboarding.tsx`

1. Update the `stepTitles` array from `['Account', 'About You', 'Goals', 'Constraints']` to `['Get Started', 'Your World', 'Where You\'re Headed', 'Your Real Life']`.

2. Add subtext below each step title heading using a `<p>` tag with muted styling.

3. Update the four `h1` heading strings to the new conversational versions listed above.

No structural, routing, or database changes needed.

