import { NextResponse } from "next/server";
import { getFeedback } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { getCourse } from "@/lib/courses";

const ACTION_LABEL: Record<string, string> = {
  completed: "You completed",
  in_progress: "You started",
  skipped: "You skipped",
};

export async function GET() {
  const learnerId = await getLearnerId();
  const feedback = getFeedback(learnerId);

  const items = feedback
    .slice(-8)
    .reverse()
    .map((f) => {
      const course = getCourse(f.courseId);
      return {
        message: `${ACTION_LABEL[f.action] ?? "Update on"} "${course?.title ?? f.courseId}"`,
        createdAt: f.createdAt,
      };
    });

  return NextResponse.json({ items, count: items.length });
}
