import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrCreateLearner } from "@/lib/db";
import { getLearnerId } from "@/lib/session";

const COOKIE_NAME = "learnerId";

export async function GET() {
  const id = await getLearnerId();
  return NextResponse.json({ learnerId: id });
}

export async function POST(req: NextRequest) {
  try {
    const { action, learnerId } = await req.json();
    const cookieStore = await cookies();

    if (action === "login") {
      if (!learnerId || typeof learnerId !== "string" || learnerId.trim().length < 10) {
        return NextResponse.json({ error: "Invalid Learner Key" }, { status: 400 });
      }
      
      const cleanId = learnerId.trim();
      // Ensure the learner profile is initialized in the DB if it's new
      getOrCreateLearner(cleanId);

      // Set the session cookie
      cookieStore.set(COOKIE_NAME, cleanId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });

      return NextResponse.json({ success: true, learnerId: cleanId });
    }

    if (action === "logout") {
      // Clear the cookie by setting maxAge to 0
      cookieStore.delete(COOKIE_NAME);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
