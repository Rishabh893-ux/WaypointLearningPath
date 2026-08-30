import { NextRequest, NextResponse } from "next/server";
import { getLearnerId } from "@/lib/session";
import { getOrCreateLearner } from "@/lib/db";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const notesPath = path.join(dataDir, "notes.json");

function readNotes(): Record<string, Record<string, string>> {
  if (!fs.existsSync(notesPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(notesPath, "utf-8"));
  } catch {
    return {};
  }
}

function writeNotes(data: Record<string, Record<string, string>>) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(notesPath, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  const learnerId = await getLearnerId();
  getOrCreateLearner(learnerId);
  const courseId = req.nextUrl.searchParams.get("courseId");
  const allNotes = readNotes();
  const learnerNotes = allNotes[learnerId] ?? {};
  if (courseId) {
    return NextResponse.json({ note: learnerNotes[courseId] ?? "" });
  }
  return NextResponse.json({ notes: learnerNotes });
}

export async function POST(req: NextRequest) {
  const learnerId = await getLearnerId();
  getOrCreateLearner(learnerId);
  const { courseId, note } = await req.json();
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const allNotes = readNotes();
  allNotes[learnerId] ??= {};
  allNotes[learnerId][courseId] = note ?? "";
  writeNotes(allNotes);
  return NextResponse.json({ ok: true });
}
