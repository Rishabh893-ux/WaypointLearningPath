"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type SkillDomain = {
  domain: string;
  total: number;
  completed: number;
  category: "mastered" | "developing" | "weak" | "missing";
  courses: { title: string; status: string }[];
};

type SkillsData = {
  skills: SkillDomain[];
  counts: { mastered: number; developing: number; weak: number; missing: number };
  totalDomains: number;
};

const CATEGORY_META = {
  mastered: { label: "Mastered", color: "var(--accent-2)", bg: "var(--accent-2-soft)", icon: "✓" },
  developing: { label: "Developing", color: "var(--accent)", bg: "var(--accent-soft)", icon: "↗" },
  weak: { label: "Weak", color: "#c99a3a", bg: "#c99a3a22", icon: "⚠" },
  missing: { label: "Missing", color: "var(--danger)", bg: "var(--danger-soft)", icon: "?" },
} as const;

export default function SkillsPage() {
  return (
    <Suspense fallback={null}>
      <SkillsPageInner />
    </Suspense>
  );
}

function SkillsPageInner() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SkillsData | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(searchParams.get("cat") ?? "mastered");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
        <div className="h-7 w-48 bg-[var(--panel-alt)] rounded animate-pulse" />
        <div className="grid sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const categories = ["mastered", "developing", "weak", "missing"] as const;

  const GRADIENTS = {
    mastered:   "linear-gradient(135deg,#a0520c,#d4862a)",
    developing: "linear-gradient(135deg,#8b1a12,#c0392b)",
    weak:       "linear-gradient(135deg,#92400e,#d97706)",
    missing:    "linear-gradient(135deg,#7f1d1d,#dc2626)",
  };

  const filteredSkills = data?.skills
    .filter((s) => s.category === openCategory)
    .filter((s) => !search || s.domain.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-2xl">Skill proficiency</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Every domain in the catalog, categorized by real progress — not self-reported confidence.
        </p>
      </div>

      {/* Gradient tab bar */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const isActive = openCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setOpenCategory(cat)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
              style={isActive ? {
                background: GRADIENTS[cat],
                color: "white",
                boxShadow: "0 3px 10px rgba(0,0,0,0.18)"
              } : {
                background: "var(--panel-alt)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)"
              }}
            >
              {meta.icon} {meta.label}
              <span className="ml-2 opacity-70 text-xs">{data?.counts[cat] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* Search input */}
      {openCategory && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search domains…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ background: "var(--panel-alt)", border: "1px solid var(--border)" }}
          />
        </div>
      )}

      {/* Domain skill cards */}
      {openCategory && (
        <div className="space-y-3">
          {filteredSkills.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              {search ? `No domains matching "${search}"` : "No domains in this category yet."}
            </p>
          )}
          {filteredSkills.map((s) => {
            const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
            return (
              <div key={s.domain} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{s.domain}</span>
                  <span className="text-xs mono text-[var(--text-muted)]">
                    {s.completed}/{s.total} courses · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--panel-alt)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: GRADIENTS[s.category] }}
                  />
                </div>
                {s.courses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.courses.map((c) => (
                      <span
                        key={c.title}
                        className="tag-pill"
                        style={c.status === "completed" ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : {}}
                      >
                        {c.status === "completed" ? "✓ " : ""}{c.title}
                      </span>
                    ))}
                  </div>
                )}
                {s.courses.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">No courses from this domain in your roadmap yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Mastered = every course in that domain completed. Developing = in progress. Weak = failed assessment. Missing = no courses yet.
      </p>
    </div>
  );
}
