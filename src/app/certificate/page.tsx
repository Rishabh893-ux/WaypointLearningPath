"use client";

import { useEffect, useState } from "react";
import { fireConfetti } from "@/lib/confetti";

type DashboardData = {
  totalCourses: number;
  completedCourses: number;
  totalHrs: number;
  completedHrs: number;
  skillRadar: { domain: string; coverage: number }[];
};

type Profile = { name: string | null; goal: string | null };

export default function CertificatePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d);
        if (d.totalCourses > 0 && d.completedCourses === d.totalCourses) {
          fireConfetti();
        }
      });
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setNameInput(p.name || "");
      });
  }, []);

  async function saveName() {
    setSavingName(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput }),
    });
    const p = await res.json();
    setProfile(p);
    setSavingName(false);
  }

  if (!data || !profile) {
    return <div className="max-w-3xl mx-auto px-6 py-10 text-sm text-[var(--text-muted)]">Loading…</div>;
  }

  const unlocked = data.totalCourses > 0 && data.completedCourses === data.totalCourses;
  const pct = data.totalCourses === 0 ? 0 : Math.round((data.completedCourses / data.totalCourses) * 100);

  if (!unlocked) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="font-display text-2xl mb-2">Certificate</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Complete every course in your roadmap to unlock a downloadable certificate.
        </p>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span>{data.completedCourses} / {data.totalCourses} courses completed</span>
            <span className="mono text-[var(--text-muted)]">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--panel-alt)] overflow-hidden">
            <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const domains = data.skillRadar.map((d) => d.domain).join(", ");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="no-print mb-6 flex items-center gap-2">
        <input
          className="flex-1 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Your name (for the certificate)"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <button
          onClick={saveName}
          disabled={savingName}
          className="px-3 py-2 rounded-md border border-[var(--border)] text-sm hover:border-[var(--accent)]"
        >
          {savingName ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="card p-10 text-center relative" style={{ border: "2px solid var(--accent)" }}>
        <div className="absolute top-3 left-3 text-[var(--accent)] text-xl">◆</div>
        <div className="absolute top-3 right-3 text-[var(--accent)] text-xl">◆</div>
        <div className="absolute bottom-3 left-3 text-[var(--accent)] text-xl">◆</div>
        <div className="absolute bottom-3 right-3 text-[var(--accent)] text-xl">◆</div>

        <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">
          Certificate of Completion
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-1">This certifies that</p>
        <h1 className="font-display text-3xl mb-4">{profile.name || "A dedicated learner"}</h1>
        <p className="text-sm text-[var(--text-muted)] mb-1">has completed a personalized learning roadmap covering</p>
        <p className="font-display text-lg mb-4">{domains}</p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {data.completedCourses} courses · {data.completedHrs} hours · every assessment passed or manually verified
        </p>
        <p className="text-xs mono text-[var(--text-muted)]">{today} · Waypoint</p>
      </div>

      <button
        onClick={() => window.print()}
        className="no-print mt-6 w-full px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--panel)] text-sm font-medium"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
