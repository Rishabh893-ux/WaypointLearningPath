import fs from "fs";
import path from "path";

export type SyllabusModule = { title: string; topics: string[] };

export type Course = {
  id: string;
  title: string;
  domain: string;
  tags: string[];
  difficulty: number; // 1-4
  durationHrs: number;
  prerequisites: string[];
  description: string;
  project: string;
  syllabus: SyllabusModule[];
  learningOutcomes: string[];
};

let cache: Course[] | null = null;

export function loadCourses(): Course[] {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "courses.json");
  cache = JSON.parse(fs.readFileSync(file, "utf-8"));
  return cache!;
}

export function getCourse(id: string): Course | undefined {
  return loadCourses().find((c) => c.id === id);
}

/**
 * Content-based relevance score between a learner and a course.
 * Deterministic and explainable (no black-box embedding step) so every
 * number can be walked through in a viva:
 *
 *   relevance = 0.7 * goalTagOverlap + 0.3 * interestOverlap
 *   score     = relevance * (0.5 + 0.5 * prerequisiteFit)
 *
 * - goalTagOverlap / interestOverlap: Jaccard overlap between the
 *   course's tags and tags extracted from the learner's stated goal /
 *   interests, respectively.
 * - prerequisiteFit: 1 if all prerequisites are already completed,
 *   scaled down the more are still missing (a course with 0
 *   prerequisites is always prereq-ready, i.e. prereqFit = 1).
 *
 * Relevance gates the score: a course with zero tag overlap scores 0
 * regardless of how prerequisite-ready it is, so having no
 * prerequisites can no longer smuggle an unrelated course into the
 * recommendations. Prerequisite readiness then acts as a 0.5x-1x
 * multiplier that nudges relevant-but-not-yet-ready courses down.
 */
export function scoreCourse(
  course: Course,
  goalTags: string[],
  interests: string[],
  completedIds: string[]
): { score: number; breakdown: { goalFit: number; prereqFit: number; interestFit: number } } {
  const goalFit = jaccard(goalTags, course.tags);
  const interestFit = jaccard(interests, course.tags);
  const relevance = 0.7 * goalFit + 0.3 * interestFit;

  const missingPrereqs = course.prerequisites.filter(
    (p) => !completedIds.includes(p)
  );
  const prereqFit =
    course.prerequisites.length === 0
      ? 1
      : 1 - missingPrereqs.length / course.prerequisites.length;

  const score = relevance * (0.5 + 0.5 * prereqFit);
  return { score, breakdown: { goalFit, prereqFit, interestFit } };
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map((x) => x.toLowerCase()));
  const setB = new Set(b.map((x) => x.toLowerCase()));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const x of setA) if (setB.has(x)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Rank all not-yet-completed courses for a learner by relevance.
 */
export function rankCourses(
  goalTags: string[],
  interests: string[],
  completedIds: string[]
) {
  return loadCourses()
    .filter((c) => !completedIds.includes(c.id))
    .map((c) => ({ course: c, ...scoreCourse(c, goalTags, interests, completedIds) }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Build an ordered learning path: take the top-scoring courses, then
 * topologically order them so prerequisites always come first, and
 * group them into milestones of ~2 courses each.
 */
export function buildLearningPath(
  goalTags: string[],
  interests: string[],
  completedIds: string[],
  limit = 8
) {
  const ranked = rankCourses(goalTags, interests, completedIds);
  const relevant = ranked.filter((r) => r.score > 0);
  const top = (relevant.length > 0 ? relevant : ranked).slice(0, limit).map((r) => r.course);

  const withPrereqs = expandWithPrerequisites(top, completedIds);
  const ordered = topologicalSort(withPrereqs, completedIds);

  const milestoneSize = 2;
  return ordered.map((course, i) => {
    const scored = ranked.find((r) => r.course.id === course.id);
    return {
      course,
      position: i,
      milestone: `Milestone ${Math.floor(i / milestoneSize) + 1}`,
      score: scored?.score ?? 0,
      breakdown: scored?.breakdown ?? null,
    };
  });
}

/**
 * Insert a learner-chosen course into an already-generated path: pulls in
 * any missing prerequisites, re-sorts topologically, and re-groups into
 * milestones. Used by the Course Explorer's "Add to roadmap" action.
 */
export function insertManualCourse(
  existingCourseIds: string[],
  newCourseId: string,
  completedIds: string[]
) {
  const existingCourses = existingCourseIds.map(getCourse).filter((c): c is Course => !!c);
  const newCourse = getCourse(newCourseId);
  if (!newCourse) return existingCourses;

  const combined = expandWithPrerequisites([...existingCourses, newCourse], completedIds);
  return topologicalSort(combined, completedIds);
}

function expandWithPrerequisites(seed: Course[], completedIds: string[]): Course[] {
  const selectedIds = new Set(seed.map((c) => c.id));
  const withPrereqs = [...seed];
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of [...withPrereqs]) {
      for (const p of c.prerequisites) {
        if (!selectedIds.has(p) && !completedIds.includes(p)) {
          const prereqCourse = getCourse(p);
          if (prereqCourse) {
            withPrereqs.push(prereqCourse);
            selectedIds.add(p);
            changed = true;
          }
        }
      }
    }
  }
  return withPrereqs;
}

function topologicalSort(courses: Course[], completedIds: string[]): Course[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const visited = new Set<string>();
  const result: Course[] = [];

  function visit(id: string) {
    if (visited.has(id) || completedIds.includes(id)) return;
    const course = byId.get(id);
    if (!course) return;
    visited.add(id);
    for (const p of course.prerequisites) {
      if (byId.has(p)) visit(p);
    }
    result.push(course);
  }

  for (const c of courses) visit(c.id);
  return result;
}

export function extractTagsFromText(text: string, allTags: string[]): string[] {
  const lower = text.toLowerCase();
  return allTags.filter((tag) => lower.includes(tag.replace(/-/g, " ")) || lower.includes(tag));
}

export function allTags(): string[] {
  const set = new Set<string>();
  for (const c of loadCourses()) for (const t of c.tags) set.add(t);
  return [...set];
}
