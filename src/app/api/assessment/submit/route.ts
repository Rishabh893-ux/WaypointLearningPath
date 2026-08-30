import { NextRequest, NextResponse } from "next/server";
import {
  getAssessmentAttempt,
  recordAssessmentResult,
  getOrCreateLearner,
  updateLearner,
  setPathStatus,
} from "@/lib/db";
import { getLearnerId } from "@/lib/session";

const PASS_THRESHOLD = 0.7;

export async function POST(req: NextRequest) {
  const { courseId, answers } = await req.json();
  if (!courseId || typeof answers !== "object") {
    return NextResponse.json({ error: "courseId and answers are required" }, { status: 400 });
  }

  const learnerId = await getLearnerId();
  const attempt = getAssessmentAttempt(learnerId, courseId);
  if (!attempt) {
    return NextResponse.json({ error: "no assessment in progress for this course" }, { status: 400 });
  }

  const results = attempt.questions.map((q) => {
    const submitted = answers[q.id];
    const correct = submitted === q.correctOptionId;
    return {
      questionId: q.id,
      correct,
      correctOptionId: q.correctOptionId,
      explanation: q.explanation,
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const score = attempt.questions.length === 0 ? 0 : correctCount / attempt.questions.length;
  const passed = score >= PASS_THRESHOLD;

  recordAssessmentResult(learnerId, courseId, score, passed);

  if (passed) {
    const learner = getOrCreateLearner(learnerId);
    if (!learner.completedCourseIds.includes(courseId)) {
      updateLearner(learnerId, { completedCourseIds: [...learner.completedCourseIds, courseId] });
    }
    setPathStatus(learnerId, courseId, "completed");
  }

  return NextResponse.json({
    score,
    passed,
    correctCount,
    total: attempt.questions.length,
    threshold: PASS_THRESHOLD,
    results,
  });
}
