# 🧭 Waypoint: AI-Powered Personalized Learning Path Recommender

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Gemini%20API-Flash%202.5-orange?style=flat-square&logo=google-gemini)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A conversational AI assistant that transforms a learner's raw goals, background, and specific interests into a structured, topologically-sorted educational roadmap. Designed with a premium **"Mahogany & Sunset"** theme, featuring glassmorphism, responsive visual graphs, and gamified progress tracking.

---

## 🌟 Key Features

| Feature | Description | Screen/Route |
| :--- | :--- | :--- |
| **Intelligent Chat Intake** | Describe goals in natural language. Auto-extracts tags, background, and goals to build a live persona profile. | `/` |
| **Interactive Roadmaps** | Ordered winding milestones displaying real courses, syllabi, recommended practice projects, and inline tests. | `/roadmap` |
| **Dynamic Dashboard** | Premium command center showcasing completion rates, hours spent, progress milestones, and interactive graphs. | `/dashboard` |
| **Skill Registry** | Filter and search through your skills categorized dynamically as Mastered, Developing, Weak, or Missing. | `/skills` |
| **Gamified Achievements** | Level up, gain XP, track active daily streaks, and flip cards to reveal customized progress badges. | `/achievements` |

---

## ⚙️ How it Works

### 1. Hybrid Recommendation & Sorting Engine
Unlike black-box LLM systems, Waypoint uses a hybrid approach: **deterministic calculations** for scoring and ranking, and **Gemini API** for semantic natural language tasks. This ensures reliability, speed, and absolute explainability.

```
Relevance Score = (0.7 × Goal Tag Overlap) + (0.3 × Interest Tag Overlap)
Final Score     = Relevance Score × (0.5 + 0.5 × Prerequisite Readiness)
```

- **Relevance Gating:** If a course matches no goals/interests, its score drops to zero, filtering out irrelevant catalog items immediately.
- **Topological Sorting:** Top-scoring courses are sorted so prerequisites are guaranteed to appear before the courses that require them.

```mermaid
graph TD
    A[Stated Goal / Interests] --> B[Gemini NLP Profile Extraction]
    B --> C[Keyword Vocabulary Matching]
    C --> D[Deterministic Course Scoring]
    D --> E[Topological Sorting Algorithm]
    E --> F[Milestone Path Generation]
    F --> G[Dynamic Interactive Roadmap]
end
```

### 2. Adaptive Course Assessments
Rather than relying on honor-system checks:
- **Assessment Generation:** Generates 5 structured, contextual multiple-choice questions grounded in each course's unique syllabus.
- **Secure Verification:** Correct answers are withheld server-side. Pass grades ($\ge 70\%$) update the student database, immediately recalculating your prerequisite readiness score to unlock advanced courses on the roadmap.
- **Robust Fallbacks:** Works completely offline! If no Gemini API key is found, the system dynamically queries syllabus modules to auto-generate valid assessment choices locally.

---

## 🛠️ Project Structure

```
src/
├── app/
│   ├── page.tsx               # Chat intake & profile extraction interface
│   ├── roadmap/page.tsx       # Roadmap trail visualization & interactive path
│   ├── dashboard/page.tsx     # Progress telemetry and recharts visualization
│   ├── skills/page.tsx        # Searchable skill progress tracking
│   ├── achievements/page.tsx  # Gamified milestones, streak data, & badges
│   └── api/                   # Serverless route handlers (Chat, Profiles, Roadmap Q&A, Tests)
├── components/                # Shared layout & reusable UI elements (AppShell, RoadmapGraph, etc.)
└── lib/                       # Core engines (Gemini integrations, topological sorters, local DB wrappers)
```

---

## 🚀 Setup & Installation

Ensure you have **Node.js 18+** installed.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Rishabh893-ux/Waypoint-Learning-Path.git
cd Waypoint-Learning-Path
npm install
```

### 2. Configure Environment Variables
Copy the template file:
```bash
cp .env.example .env
```

Open `.env` and add your **Gemini API Key**:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> 💡 *Note: You can get a free key with no credit card required at [Google AI Studio](https://aistudio.google.com/).*

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 Deployment

The application is fully compatible with **Vercel** serverless deploys:

1. Import your cloned GitHub repository into Vercel.
2. In the project build settings, add `GEMINI_API_KEY` as an environment variable.
3. Deploy!

*(Note: Data is saved to `data/store.json`. Since Vercel uses ephemeral filesystems, user profiles reset upon redeploy. For persistent production use, you can easily adapt `src/lib/db.ts` to interface with a hosted DB like Postgres or SQLite/Turso.)*

---

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
