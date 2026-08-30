"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

type Course = {
  id: string;
  title: string;
  domain: string;
  tags: string[];
  difficulty: number;
  durationHrs: number;
  description: string;
  inRoadmap: boolean;
  completed: boolean;
  matchPct: number;
};

export default function CoursesPage() {
  return (
    <Suspense fallback={null}>
      <CoursesPageInner />
    </Suspense>
  );
}

function CoursesPageInner() {
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [domain, setDomain] = useState("All");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/courses");
    const data = await res.json();
    setCourses(data.courses || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const domains = useMemo(() => ["All", ...Array.from(new Set(courses.map((c) => c.domain)))], [courses]);

  const filtered = courses
    .filter((c) => {
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesDomain = domain === "All" || c.domain === domain;
      const matchesDifficulty = difficulty === null || c.difficulty === difficulty;
      return matchesQuery && matchesDomain && matchesDifficulty;
    })
    .sort((a, b) => b.matchPct - a.matchPct);

  async function addToRoadmap(courseId: string) {
    setAdding(courseId);
    const res = await fetch("/api/roadmap/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    setAdding(null);
    if (!res.ok) {
      showToast(data.error || "Couldn't add that course.", "error");
      return;
    }
    setCourses((cs) => cs.map((c) => (c.id === courseId ? { ...c, inRoadmap: true } : c)));
    showToast("Added to your roadmap — prerequisites pulled in automatically.", "success");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl mb-1">Course explorer</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Browse the full catalog and add anything you want directly to your roadmap.
      </p>

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[200px] bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Search by title or tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        >
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? null : d)}
              className={`w-8 h-8 rounded-md border text-xs mono transition-colors ${
                difficulty === d
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
              }`}
              title={`Difficulty ${d}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card card-interactive p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider">{c.domain}</p>
                  {c.matchPct > 0 && <span className="match-pill">{c.matchPct}% match</span>}
                </div>
                <h3 className="font-display text-base leading-tight mb-1.5">{c.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mb-2">{c.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {c.tags.slice(0, 4).map((t) => (
                    <span key={t} className="tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {c.durationHrs}h · difficulty {c.difficulty}/4
                </p>
              </div>
              <div className="mt-3">
                {c.completed ? (
                  <span className="tag-pill text-[var(--accent)] border-[var(--accent)]">✓ Completed</span>
                ) : c.inRoadmap ? (
                  <span className="tag-pill text-[var(--accent-2)] border-[var(--accent-2)]">In your roadmap</span>
                ) : (
                  <button
                    onClick={() => addToRoadmap(c.id)}
                    disabled={adding === c.id}
                    className="text-xs px-3 py-1.5 rounded-md bg-[var(--accent)] text-[var(--panel)] font-medium disabled:opacity-50"
                  >
                    {adding === c.id ? "Adding…" : "Add to roadmap"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] col-span-2 text-center py-8">
              No courses match those filters — try clearing search or difficulty.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
