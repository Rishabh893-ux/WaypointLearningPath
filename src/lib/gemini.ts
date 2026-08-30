import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

// Simple in-memory cache + rate-limit guard so repeated identical calls
// (e.g. re-rendering the same explanation) don't burn free-tier quota.
const cache = new Map<string, string>();
let lastCallAt = 0;
const MIN_GAP_MS = 1200;

async function callGemini(prompt: string, systemInstruction: string, cacheKey?: string) {
  if (cacheKey && cache.has(cacheKey)) return cache.get(cacheKey)!;

  const client = getClient();
  if (!client) {
    return fallbackResponse(cacheKey);
  }

  const now = Date.now();
  const wait = MIN_GAP_MS - (now - lastCallAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();

  try {
    const model = client.getGenerativeModel({ model: MODEL, systemInstruction });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    if (cacheKey) cache.set(cacheKey, text);
    return text;
  } catch (err: any) {
    console.error("Gemini call failed:", err?.message || err);
    return fallbackResponse(cacheKey);
  }
}

function fallbackResponse(cacheKey?: string) {
  return (
    "(AI assistant offline — set GEMINI_API_KEY in .env to enable conversational replies and explanations. " +
    "Everything else — profiling, recommendations, and the roadmap — still works from your inputs.)"
  );
}

/**
 * Turn a free-text learner message into structured profile fields.
 * Falls back to lightweight keyword extraction when no API key is set,
 * so the app is still usable offline.
 */
export async function extractProfileUpdate(message: string, allTags: string[]) {
  const client = getClient();
  if (!client) {
    return null; // caller falls back to keyword extraction in courses.ts
  }
  const prompt = `Learner message: """${message}"""

Known tag vocabulary: ${allTags.join(", ")}

Extract the learner's profile as strict JSON with this shape, using only tags from the vocabulary above where possible:
{
  "goal": "<one sentence summarizing their learning goal, or null>",
  "experienceLevel": "beginner" | "intermediate" | "advanced" | null,
  "interests": ["tag1", "tag2"],
  "goalTags": ["tag1", "tag2"]
}
Return only the JSON object, no markdown fences, no commentary.`;

  const raw = await callGemini(
    prompt,
    "You extract structured learner profile data as strict JSON. Never include explanations, only the JSON object.",
  );
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function chatReply(
  message: string,
  profileSummary: string,
  history: { role: string; content: string }[]
) {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role}: ${h.content}`)
    .join("\n");

  const prompt = `Learner profile so far: ${profileSummary}

Recent conversation:
${historyText}

Learner just said: """${message}"""

Reply warmly and briefly (2-4 sentences) as a learning advisor. If their goal or experience level is still unclear, ask ONE clarifying question. Otherwise acknowledge what you now understand and mention you're updating their roadmap.`;

  return callGemini(
    prompt,
    "You are a friendly, concise learning advisor helping someone find the right courses. Keep replies short."
  );
}

export async function explainRecommendation(
  learnerGoal: string,
  courseTitle: string,
  breakdown: { goalFit: number; prereqFit: number; interestFit: number }
) {
  const cacheKey = `explain:${learnerGoal}:${courseTitle}`;
  const prompt = `Learner's goal: "${learnerGoal}"
Course: "${courseTitle}"
Score breakdown: goal relevance ${(breakdown.goalFit * 100).toFixed(0)}%, prerequisite readiness ${(breakdown.prereqFit * 100).toFixed(0)}%, interest match ${(breakdown.interestFit * 100).toFixed(0)}%.

Write a 1-2 sentence explanation of why this course was recommended, referencing the scores in plain language.`;

  return callGemini(
    prompt,
    "You explain AI course recommendations in one or two plain, specific sentences.",
    cacheKey
  );
}

export async function explainPath(learnerGoal: string, courseTitles: string[]) {
  const prompt = `Learner's goal: "${learnerGoal}"
Recommended course sequence: ${courseTitles.join(" -> ")}

In 3-4 sentences, explain why this sequence makes sense and what the learner will be able to do by the end.`;

  return callGemini(
    prompt,
    "You explain personalized learning roadmaps clearly and encouragingly."
  );
}

export async function answerRoadmapQuestion(
  learnerGoal: string,
  roadmapSummary: string,
  question: string
) {
  const prompt = `Learner's goal: "${learnerGoal}"
Their current roadmap: ${roadmapSummary}

The learner asks: """${question}"""

Answer in 2-4 sentences, referencing their specific roadmap where relevant.`;

  return callGemini(
    prompt,
    "You are a learning advisor answering a learner's question about their personalized roadmap. Be specific and concise."
  );
}

export type GeneratedQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
};

/**
 * Generate a 5-question multiple-choice assessment for a course based on
 * its syllabus and learning outcomes. Falls back to a deterministic
 * syllabus-based generator (no API key required) so assessments still
 * work offline.
 */
export async function generateAssessment(course: {
  title: string;
  description: string;
  syllabus: { title: string; topics: string[] }[];
  learningOutcomes: string[];
}): Promise<GeneratedQuestion[]> {
  const client = getClient();
  if (!client) return fallbackAssessment(course);

  const syllabusText = course.syllabus
    .map((m) => `${m.title}: ${m.topics.join(", ")}`)
    .join("\n");

  const prompt = `Course: "${course.title}"
Description: ${course.description}
Syllabus:
${syllabusText}
Learning outcomes: ${course.learningOutcomes.join("; ")}

Write exactly 5 multiple-choice assessment questions testing understanding of this course's core concepts (not trivia). Each question has 4 options, exactly one correct. Return strict JSON, no markdown fences:
[
  {
    "prompt": "...",
    "options": ["...", "...", "...", "..."],
    "correctIndex": 0,
    "explanation": "one sentence on why this is correct"
  }
]`;

  const raw = await callGemini(
    prompt,
    "You write clear, non-trivial multiple-choice assessment questions as strict JSON only."
  );

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
    return parsed.map((q: any, i: number) => {
      const optionIds = ["a", "b", "c", "d"];
      return {
        id: `q${i + 1}`,
        prompt: q.prompt,
        options: q.options.map((text: string, j: number) => ({ id: optionIds[j], text })),
        correctOptionId: optionIds[q.correctIndex] ?? "a",
        explanation: q.explanation ?? "",
      };
    });
  } catch {
    return fallbackAssessment(course);
  }
}

/**
 * Deterministic fallback: builds questions directly from syllabus module
 * topics so the assessment stays meaningful even with no Gemini key.
 * "Which topic belongs to module X?" with distractors drawn from other
 * modules in the same course.
 */
function fallbackAssessment(course: {
  title: string;
  syllabus: { title: string; topics: string[] }[];
}): GeneratedQuestion[] {
  const allTopics = course.syllabus.flatMap((m) => m.topics.map((t) => ({ topic: t, module: m.title })));
  const questions: GeneratedQuestion[] = [];
  const optionIds = ["a", "b", "c", "d"];

  course.syllabus.slice(0, 5).forEach((module, i) => {
    const correctTopic = module.topics[i % module.topics.length];
    const distractors = allTopics
      .filter((t) => t.module !== module.title)
      .map((t) => t.topic)
      .filter((t, idx, arr) => arr.indexOf(t) === idx)
      .slice(0, 3);
    while (distractors.length < 3) distractors.push(`Advanced ${module.title} technique`);

    const options = shuffle([correctTopic, ...distractors]).slice(0, 4);
    const correctIndex = options.indexOf(correctTopic);

    questions.push({
      id: `q${i + 1}`,
      prompt: `In "${course.title}", which topic is covered under the "${module.title}" module?`,
      options: options.map((text, j) => ({ id: optionIds[j], text })),
      correctOptionId: optionIds[correctIndex],
      explanation: `"${correctTopic}" is covered in the ${module.title} module.`,
    });
  });

  return questions;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
