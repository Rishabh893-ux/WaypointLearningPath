import fs from "fs";
import path from "path";

export type Learner = {
  id: string;
  name: string | null;
  goal: string | null;
  experienceLevel: string;
  interests: string[];
  completedCourseIds: string[];
  studyHoursPerWeek: number | null;
  createdAt: string;
  updatedAt: string;
};

export type MessageRow = { role: "user" | "assistant"; content: string; createdAt: string };

export type PathRow = {
  id: number;
  courseId: string;
  position: number;
  milestone: string;
  score: number;
  status: "planned" | "in_progress" | "completed" | "skipped";
  explanation: string;
  source: "recommended" | "manual";
  createdAt: string;
};

export type FeedbackRow = { courseId: string; action: string; rating: number | null; createdAt: string };

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
};

export type AssessmentAttempt = {
  courseId: string;
  questions: AssessmentQuestion[];
  score: number | null;
  passed: boolean | null;
  takenAt: string | null;
  generatedAt: string;
};

type DBShape = {
  learners: Record<string, Learner>;
  messages: Record<string, MessageRow[]>;
  paths: Record<string, PathRow[]>;
  feedback: Record<string, FeedbackRow[]>;
  assessments: Record<string, Record<string, AssessmentAttempt>>;
};

const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
const dataDir = isVercel ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "store.json");

function emptyDB(): DBShape {
  return { learners: {}, messages: {}, paths: {}, feedback: {}, assessments: {} };
}

function readDB(): DBShape {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) return emptyDB();
  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    if (!raw.trim()) return emptyDB();
    return JSON.parse(raw);
  } catch {
    return emptyDB();
  }
}

function writeDB(data: DBShape) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
}

export function getOrCreateLearner(id: string): Learner {
  const db = readDB();
  if (db.learners[id]) return db.learners[id];
  const now = new Date().toISOString();
  const learner: Learner = {
    id,
    name: null,
    goal: null,
    experienceLevel: "beginner",
    interests: [],
    completedCourseIds: [],
    studyHoursPerWeek: null,
    createdAt: now,
    updatedAt: now,
  };
  db.learners[id] = learner;
  writeDB(db);
  return learner;
}

export function updateLearner(id: string, fields: Partial<Learner>) {
  const db = readDB();
  const existing = db.learners[id] ?? getOrCreateLearner(id);
  db.learners[id] = { ...existing, ...fields, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.learners[id];
}

export function addMessage(learnerId: string, role: "user" | "assistant", content: string) {
  const db = readDB();
  db.messages[learnerId] ??= [];
  db.messages[learnerId].push({ role, content, createdAt: new Date().toISOString() });
  writeDB(db);
}

export function getMessages(learnerId: string): MessageRow[] {
  const db = readDB();
  return db.messages[learnerId] ?? [];
}

export function replaceLearningPath(
  learnerId: string,
  items: {
    courseId: string;
    position: number;
    milestone: string;
    score: number;
    explanation: string;
    source?: "recommended" | "manual";
    status?: PathRow["status"];
  }[]
) {
  const db = readDB();
  const now = new Date().toISOString();
  db.paths[learnerId] = items.map((item, i) => ({
    id: i + 1,
    courseId: item.courseId,
    position: item.position,
    milestone: item.milestone,
    score: item.score,
    status: item.status ?? "planned",
    explanation: item.explanation,
    source: item.source ?? "recommended",
    createdAt: now,
  }));
  writeDB(db);
  return db.paths[learnerId];
}

export function getLearningPath(learnerId: string): PathRow[] {
  const db = readDB();
  return (db.paths[learnerId] ?? []).slice().sort((a, b) => a.position - b.position);
}

export function setPathStatus(learnerId: string, courseId: string, status: PathRow["status"]) {
  const db = readDB();
  const rows = db.paths[learnerId] ?? [];
  for (const r of rows) if (r.courseId === courseId) r.status = status;
  writeDB(db);
}

export function addFeedback(learnerId: string, courseId: string, action: string, rating: number | null) {
  const db = readDB();
  db.feedback[learnerId] ??= [];
  db.feedback[learnerId].push({ courseId, action, rating, createdAt: new Date().toISOString() });
  writeDB(db);
}

export function getFeedback(learnerId: string): FeedbackRow[] {
  const db = readDB();
  return db.feedback[learnerId] ?? [];
}

export function getAllAssessmentAttempts(learnerId: string): AssessmentAttempt[] {
  const db = readDB();
  return Object.values(db.assessments[learnerId] ?? {});
}

export function saveAssessmentAttempt(
  learnerId: string,
  courseId: string,
  questions: AssessmentQuestion[]
) {
  const db = readDB();
  db.assessments[learnerId] ??= {};
  db.assessments[learnerId][courseId] = {
    courseId,
    questions,
    score: null,
    passed: null,
    takenAt: null,
    generatedAt: new Date().toISOString(),
  };
  writeDB(db);
  return db.assessments[learnerId][courseId];
}

export function getAssessmentAttempt(learnerId: string, courseId: string): AssessmentAttempt | null {
  const db = readDB();
  return db.assessments[learnerId]?.[courseId] ?? null;
}

export function recordAssessmentResult(
  learnerId: string,
  courseId: string,
  score: number,
  passed: boolean
) {
  const db = readDB();
  const attempt = db.assessments[learnerId]?.[courseId];
  if (!attempt) return null;
  attempt.score = score;
  attempt.passed = passed;
  attempt.takenAt = new Date().toISOString();
  writeDB(db);
  return attempt;
}
