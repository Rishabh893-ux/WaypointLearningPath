import { NextRequest, NextResponse } from "next/server";
import { getLearningPath, replaceLearningPath } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { getCourse } from "@/lib/courses";

export async function POST(req: NextRequest) {
  const { courseId } = await req.json();
  const learnerId = await getLearnerId();
  const rows = getLearningPath(learnerId);

  const remaining = rows.filter((r) => r.courseId !== courseId);
  const dependents = remaining.filter((r) => getCourse(r.courseId)?.prerequisites.includes(courseId));
  if (dependents.length > 0) {
    const titles = dependents.map((d) => getCourse(d.courseId)?.title).join(", ");
    return NextResponse.json(
      { error: `Can't remove — ${titles} still depend${dependents.length === 1 ? "s" : ""} on this course.` },
      { status: 400 }
    );
  }

  const items = remaining.map((r, i) => ({
    courseId: r.courseId,
    position: i,
    milestone: `Milestone ${Math.floor(i / 2) + 1}`,
    score: r.score,
    explanation: r.explanation,
    source: r.source,
    status: r.status,
  }));

  const updated = replaceLearningPath(learnerId, items);
  return NextResponse.json({ path: updated.map((r) => ({ ...r, course: getCourse(r.courseId) })) });
}
