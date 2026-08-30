import { NextRequest, NextResponse } from "next/server";
import { getOrCreateLearner, updateLearner } from "@/lib/db";
import { getLearnerId } from "@/lib/session";

export async function GET() {
  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);
  return NextResponse.json(learner);
}

export async function PATCH(req: NextRequest) {
  const learnerId = await getLearnerId();
  const body = await req.json();
  const updates: Record<string, any> = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.goal === "string") updates.goal = body.goal;
  if (typeof body.experienceLevel === "string") updates.experienceLevel = body.experienceLevel;
  if (Array.isArray(body.interests)) updates.interests = body.interests;
  if (typeof body.studyHoursPerWeek === "number" && body.studyHoursPerWeek >= 0) {
    updates.studyHoursPerWeek = body.studyHoursPerWeek;
  }

  const learner = updateLearner(learnerId, updates);
  return NextResponse.json(learner);
}
