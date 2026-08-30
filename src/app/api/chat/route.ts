import { NextRequest, NextResponse } from "next/server";
import { getOrCreateLearner, updateLearner, addMessage, getMessages } from "@/lib/db";
import { getLearnerId } from "@/lib/session";
import { allTags, extractTagsFromText } from "@/lib/courses";
import { chatReply, extractProfileUpdate } from "@/lib/gemini";

export async function GET() {
  const learnerId = await getLearnerId();
  const messages = getMessages(learnerId);
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const learnerId = await getLearnerId();
  const learner = getOrCreateLearner(learnerId);

  addMessage(learnerId, "user", message);

  const tagVocab = allTags();

  // Try Gemini extraction first; fall back to keyword matching so the
  // app still works fully offline without an API key.
  const extracted = await extractProfileUpdate(message, tagVocab);
  const updates: Record<string, any> = {};

  if (extracted) {
    if (extracted.goal) updates.goal = extracted.goal;
    if (extracted.experienceLevel) updates.experienceLevel = extracted.experienceLevel;
    if (Array.isArray(extracted.interests)) {
      updates.interests = Array.from(new Set([...learner.interests, ...extracted.interests]));
    }
  } else {
    const found = extractTagsFromText(message, tagVocab);
    if (found.length > 0) {
      updates.interests = Array.from(new Set([...learner.interests, ...found]));
    }
    if (!learner.goal) updates.goal = message.slice(0, 200);
  }

  if (Object.keys(updates).length > 0) {
    updateLearner(learnerId, updates);
  }

  const updatedLearner = getOrCreateLearner(learnerId);
  const profileSummary = `goal: ${updatedLearner.goal || "unset"}, level: ${updatedLearner.experienceLevel}, interests: ${updatedLearner.interests.join(", ")}`;

  const history = getMessages(learnerId).slice(-8);

  const reply = await chatReply(message, profileSummary, history);

  addMessage(learnerId, "assistant", reply);

  return NextResponse.json({ reply, profile: updatedLearner });
}
