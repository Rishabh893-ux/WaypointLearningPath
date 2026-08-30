import { NextRequest, NextResponse } from "next/server";
import { getOrCreateLearner, updateLearner, addFeedback, setPathStatus } from "@/lib/db";
import { getLearnerId } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { courseId, action, rating } = await req.json();
  if (!courseId || !["completed", "skipped", "in_progress"].includes(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);

  addFeedback(learnerId, courseId, action, rating ?? null);
  setPathStatus(learnerId, courseId, action);

  if (action === "completed" && !learner.completedCourseIds.includes(courseId)) {
    updateLearner(learnerId, {
      completedCourseIds: [...learner.completedCourseIds, courseId],
    });
  }

  return NextResponse.json({ ok: true });
}
