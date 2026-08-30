import { NextResponse } from "next/server";
import { getLearningPath, getAllAssessmentAttempts } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { loadCourses, getCourse } from "@/lib/courses";

export async function GET() {
  const learnerId = await getLearnerId();
  const path = getLearningPath(learnerId);
  const attempts = getAllAssessmentAttempts(learnerId);

  const allDomains = Array.from(new Set(loadCourses().map((c) => c.domain)));

  const failedCourseIds = new Set(attempts.filter((a) => a.passed === false).map((a) => a.courseId));

  const skills = allDomains.map((domain) => {
    const items = path.filter((r) => getCourse(r.courseId)?.domain === domain);
    const total = items.length;
    const completed = items.filter((r) => r.status === "completed").length;
    const hasFailedAssessment = items.some((r) => failedCourseIds.has(r.courseId));

    let category: "mastered" | "developing" | "weak" | "missing";
    if (total === 0) category = "missing";
    else if (completed === total) category = "mastered";
    else if (hasFailedAssessment) category = "weak";
    else category = "developing";

    return {
      domain,
      total,
      completed,
      category,
      courses: items.map((r) => ({
        title: getCourse(r.courseId)?.title ?? r.courseId,
        status: r.status,
      })),
    };
  });

  const counts = {
    mastered: skills.filter((s) => s.category === "mastered").length,
    developing: skills.filter((s) => s.category === "developing").length,
    weak: skills.filter((s) => s.category === "weak").length,
    missing: skills.filter((s) => s.category === "missing").length,
  };

  return NextResponse.json({ skills, counts, totalDomains: allDomains.length });
}
