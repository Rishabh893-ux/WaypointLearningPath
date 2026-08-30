import { NextRequest, NextResponse } from "next/server";
import { getAssessmentAttempt, saveAssessmentAttempt } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { getCourse } from "@/lib/courses";
import { generateAssessment } from "@/lib/gemini";

function publicQuestions(attempt: { questions: any[] }) {
  return attempt.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options }));
}

export async function POST(req: NextRequest) {
  const { courseId, regenerate } = await req.json();
  const course = getCourse(courseId);
  if (!course) return NextResponse.json({ error: "unknown course" }, { status: 404 });

  const learnerId = await getLearnerId();

  const existing = getAssessmentAttempt(learnerId, courseId);
  if (existing && existing.score === null && !regenerate) {
    return NextResponse.json({ questions: publicQuestions(existing) });
  }

  const questions = await generateAssessment(course);
  const attempt = saveAssessmentAttempt(learnerId, courseId, questions);
  return NextResponse.json({ questions: publicQuestions(attempt) });
}
