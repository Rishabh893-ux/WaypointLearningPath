import { NextRequest, NextResponse } from "next/server";
import { getOrCreateLearner, getLearningPath } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { getCourse } from "@/lib/courses";
import { answerRoadmapQuestion } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);
  const path = getLearningPath(learnerId);

  const roadmapSummary = path
    .map((r) => `${r.milestone}: ${getCourse(r.courseId)?.title ?? r.courseId} (${r.status})`)
    .join("; ");

  const answer = await answerRoadmapQuestion(
    learner.goal || learner.interests.join(", "),
    roadmapSummary || "no roadmap generated yet",
    question
  );

  return NextResponse.json({ answer });
}
