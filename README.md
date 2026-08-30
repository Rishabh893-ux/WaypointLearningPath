# Waypoint — AI-Powered Personalized Learning Path Recommender

> **Suggested Repository Name:** `waypoint-learning-path` or `waypoint-ai-recommender`

A conversational assistant that turns a learner's goals, interests, and
experience level into a structured, prerequisite-ordered learning
roadmap — with plain-language explanations for every recommendation and
a dashboard that adapts as the learner completes or skips courses.

Recently overhauled with a premium "Mahogany & Sunset" UI theme, featuring glassmorphism, animated progress rings, and a rewarding achievements system.

## What it does

- **Chat intake** (`/`) — describe your goal in plain English; the app
  extracts your profile (goal, experience level, interests) and shows it
  live in the "field notes" panel. Includes quick-start suggestion chips
  for a fresh session. Features a premium glassmorphism chat interface.
- **Roadmap** (`/roadmap`) — a personalized, ordered learning path
  rendered as a winding trail with milestones. Every course expands into
  its own **detailed syllabus** (modules, topics, learning outcomes), a
  suggested hands-on **practice project**, and a **graded assessment**
  you take inline. Passing an assessment (≥70%) automatically marks the
  course complete — completion is verified, not an honor-system
  checkbox. Includes a dedicated **"Ask about your roadmap"** assistant
  for follow-up questions (why this order, can I skip ahead, etc.).
- **Dashboard** (`/dashboard`) — A premium command center showing completion stats, hours studied, a
  skill-coverage radar by domain, and a per-milestone progress tracker with animated progress rings.
- **Skills** (`/skills`) — Track your proficiency across domains (Mastered, Developing, Weak, Missing) with gradient progress bars and a live search filter.
- **Achievements** (`/achievements`) — A gamified progress tracker showing your current Level, XP, study streak, and unlocked badges (with flip-card animations and glowing progress bars).

## How course assessments work

Each course ships with a 3-module syllabus and 3 learning outcomes
(`data/courses.json`). When a learner clicks "Take assessment":

1. Gemini generates 5 multiple-choice questions grounded in that
   course's syllabus and outcomes (not generic trivia).
2. Correct answers are kept server-side only — the client never
   receives them until after grading.
3. Submitting grades against the stored attempt and requires **70%** to
   pass. A pass auto-updates `completedCourseIds`, which feeds back into
   the recommendation engine's `prerequisiteReadiness` term — so
   completing a course by assessment, not just by button-click, is what
   unlocks the courses that depend on it.
4. **No Gemini key?** A deterministic fallback builds questions directly
   from the syllabus topics (e.g. "which topic belongs to module X?"
   with distractors from other modules), so assessments work fully
   offline too.

## How the recommendation engine works

The scoring is deterministic and fully explainable (no black-box
embedding step to defend in a viva):

```
relevance = 0.7 x goalTagOverlap + 0.3 x interestTagOverlap   (Jaccard similarity)
score     = relevance x (0.5 + 0.5 x prerequisiteReadiness)
```

- `goalTagOverlap` / `interestTagOverlap`: overlap between the course's
  tags and tags extracted from the learner's stated goal / interests.
- `prerequisiteReadiness`: 1.0 if every prerequisite is already
  completed, scaled down for each missing one.
- Relevance **gates** the score — an unrelated course scores 0
  regardless of how prerequisite-ready it is, so only on-topic courses
  are ever recommended.

The top-scoring courses are then **topologically sorted** so
prerequisites always appear before the courses that need them, and
grouped into milestones of two courses each.

Gemini is used for the parts that genuinely need natural language:
extracting structured profile fields from free text, writing the "why
this course" explanations, and the conversational replies. Everything
else (scoring, ordering, dashboard math) is plain deterministic code —
intentionally, so the AI/ML component is real but the system doesn't
depend on an LLM to be reliable or explainable.

## Tech stack

- **Next.js 14** (App Router, TypeScript) — frontend + API routes in one app
- **JSON file store** (`data/store.json`) — zero-config, zero native dependencies, works on any OS with no build tools required
- **Gemini API** (`gemini-2.5-flash`, free tier) — conversation, extraction, explanations
- **Recharts** — dashboard visualizations
- **Tailwind CSS v4** — styling, custom design tokens (no external font fetches, so it builds anywhere)

## Setup

Requires Node.js 18+.

```bash
npm install
cp .env.example .env
```

Open `.env` and add a free Gemini API key (optional — see below):

```
GEMINI_API_KEY=your-key-here
```

Get a free key at https://aistudio.google.com/apikey — no credit card
required. Free tier: `gemini-2.5-flash` gives ~1,500 requests/day, more
than enough for a demo.

**No API key? The app still fully works.** Without `GEMINI_API_KEY` set,
profile extraction falls back to keyword matching against the course
tag vocabulary, and explanations are replaced with a short notice
instead of AI-generated text. Every other feature — profiling,
scoring, path generation, the dashboard — is unaffected. This was a
deliberate design choice so the app is demoable offline / without
quota risk.

## Run it

```bash
npm run dev
```

Visit http://localhost:3000. Talk to the chat about what you want to
learn (e.g. "I know basic Python and want to learn machine learning"),
then go to **Roadmap** to see your generated path, and **Dashboard** to
track progress.

To reset your data (start over as a fresh learner), delete
`data/app.db` and refresh — a new anonymous session cookie will be
issued automatically.

## Production build

```bash
npm run build
npm run start
```

## Deploying

The easiest free option is **Vercel**:

1. Push this repo to GitHub.
2. Import it at https://vercel.com/new.
3. Add the `GEMINI_API_KEY` environment variable in the Vercel project
   settings (optional, per above).
4. Deploy.

Note: the data layer writes to a local JSON file (`data/store.json`),
which works on Vercel but resets on every redeploy since the
filesystem isn't persistent across deploys. That's fine for a
demo/judging environment; for a persistent production deployment,
swap `src/lib/db.ts` for a hosted database (e.g. Turso, Postgres) —
the rest of the app is unaffected since all data access goes through
that one file.

## Project structure

```
src/
  app/
    page.tsx               chat intake
    roadmap/page.tsx        roadmap trail view
    dashboard/page.tsx      progress dashboard
    api/
      chat/route.ts          conversational intake + profile extraction
      profile/route.ts       read/update learner profile
      roadmap/route.ts       generate/fetch the learning path
      roadmap-qa/route.ts    AI assistant Q&A scoped to the current roadmap
      assessment/route.ts    generate a course assessment (correct answers withheld)
      assessment/submit/route.ts  grade a submitted assessment, auto-complete on pass
      feedback/route.ts      mark course complete/in-progress/skipped
      dashboard/route.ts     aggregate stats for the dashboard
  lib/
    db.ts                   JSON store schema + learner/assessment helpers
    courses.ts              scoring engine + path generation
    gemini.ts               Gemini service wrapper (chat, extraction, explanations, assessments)
    session.ts              anonymous cookie-based learner session
data/
  courses.json              seed dataset: 28 courses across 6 domains
```

## Known limitations / honest notes for the solution doc

- Single-learner-per-browser via an anonymous cookie — no auth, by
  design, to keep the demo frictionless.
- The course catalog is a curated seed dataset (28 courses, 6 domains),
  not a live integration with a real course platform — swapping in a
  real catalog would be a drop-in replacement of `data/courses.json`.
- Tag extraction from free text uses substring matching as a fallback
  and Gemini-based extraction as the primary path; a production system
  would likely add a proper NER/classification step for more robust
  parsing.
