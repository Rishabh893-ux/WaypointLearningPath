import { NextResponse } from "next/server";
import { getOrCreateLearner, replaceLearningPath, getLearningPath, getAssessmentAttempt } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { buildLearningPath, extractTagsFromText, allTags, getCourse } from "@/lib/courses";
import { explainRecommendation } from "@/lib/gemini";

export async function GET() {
  const learnerId = await getLearnerId();
  let rows = getLearningPath(learnerId);
  if (rows.length === 0) {
    rows = await regenerate(learnerId);
  }
  const enriched = rows.map((r) => ({
    ...r,
    course: getCourse(r.courseId),
    assessment: assessmentSummary(learnerId, r.courseId),
  }));
  return NextResponse.json({ path: enriched });
}

export async function POST() {
  const learnerId = await getLearnerId();
  const rows = await regenerate(learnerId);
  const enriched = rows.map((r) => ({
    ...r,
    course: getCourse(r.courseId),
    assessment: assessmentSummary(learnerId, r.courseId),
  }));
  return NextResponse.json({ path: enriched });
}

function assessmentSummary(learnerId: string, courseId: string) {
  const attempt = getAssessmentAttempt(learnerId, courseId);
  if (!attempt) return null;
  return { score: attempt.score, passed: attempt.passed, taken: attempt.score !== null };
}

async function regenerate(learnerId: string) {
  const learner = getOrCreateLearner(learnerId);
  const interests = learner.interests;
  const completedIds = learner.completedCourseIds;
  const goalTags = learner.goal ? extractTagsFromText(learner.goal, allTags()) : [];
  const effectiveGoalTags = goalTags.length > 0 ? goalTags : interests;

  const plan = buildLearningPath(effectiveGoalTags, interests, completedIds, 8);

  const items = [];
  for (const item of plan) {
    let explanation = "";
    if (item.breakdown) {
      explanation = await explainRecommendation(
        learner.goal || interests.join(", "),
        item.course.title,
        item.breakdown
      );
    }
    items.push({
      courseId: item.course.id,
      position: item.position,
      milestone: item.milestone,
      score: item.score,
      explanation,
    });
  }

  return replaceLearningPath(learnerId, items);
}
