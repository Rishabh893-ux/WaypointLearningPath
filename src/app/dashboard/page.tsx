"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type DashboardData = {
  totalCourses: number;
  completedCourses: number;
  totalHrs: number;
  completedHrs: number;
  skillRadar: { domain: string; coverage: number }[];
  nextActions: { courseId: string; title: string; milestone: string }[];
  milestones: { milestone: string; total: number; completed: number; done: boolean }[];
};

type Profile = { name: string | null; goal: string | null; studyHoursPerWeek: number | null };
type SkillCounts = { mastered: number; developing: number; weak: number; missing: number };

/* ── Animated counter hook ───────────────────────────── */
function useCountUp(target: number, duration = 900) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    startRef.current = null;
    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return display;
}

/* ── Circular progress ring ─────────────────────────── */
function ProgressRing({ pct, size = 80, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="white" strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

/* ── Activity heatmap (last 30 days) ────────────────── */
function ActivityHeatmap({ completedHrs }: { completedHrs: number }) {
  // Generate last 30 days — we simulate based on completedHrs as seed
  // In a real app you'd get per-day data from the API
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    // Pseudo-random activity level based on completedHrs and index
    const seed = (completedHrs * 7 + i * 13) % 17;
    const level = seed < 5 ? 0 : seed < 9 ? 1 : seed < 13 ? 2 : 3;
    return {
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      level,
    };
  });

  const colors = [
    "var(--panel-alt)",
    "rgba(192,57,43,0.25)",
    "rgba(192,57,43,0.55)",
    "var(--accent)",
  ];

  return (
    <div>
      <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Activity (last 30 days)
      </p>
      <div className="flex gap-1 flex-wrap">
        {days.map((d, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-sm cursor-default transition-transform hover:scale-125"
            style={{ background: colors[d.level] }}
            title={`${d.date}: ${["No activity", "Light", "Moderate", "Active"][d.level]}`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-[var(--text-muted)]">Less</span>
        {colors.map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-[var(--text-muted)]">More</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skillCounts, setSkillCounts] = useState<SkillCounts | null>(null);
  const [hoursPerWeek, setHoursPerWeek] = useState<number | "">("");
  const [savingPace, setSavingPace] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        if (typeof p.studyHoursPerWeek === "number") setHoursPerWeek(p.studyHoursPerWeek);
      });
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => setSkillCounts(d.counts));
  }, []);

  async function savePace(value: number) {
    setSavingPace(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyHoursPerWeek: value }),
    });
    setSavingPace(false);
  }

  // Animated counters
  const pct = data && data.totalCourses > 0 ? Math.round((data.completedCourses / data.totalCourses) * 100) : 0;
  const animatedPct = useCountUp(pct);
  const animatedCompleted = useCountUp(data?.completedCourses ?? 0);
  const animatedTotal = useCountUp(data?.totalCourses ?? 0);
  const animatedDoneHrs = useCountUp(data?.completedHrs ?? 0);
  const animatedTotalHrs = useCountUp(data?.totalHrs ?? 0);

  if (!data || !profile || !skillCounts)
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="card h-32 animate-pulse" />
        <div className="card h-20 animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );

  const remainingHrs = Math.max(data.totalHrs - data.completedHrs, 0);
  const weeksLeft = hoursPerWeek && hoursPerWeek > 0 ? Math.ceil(remainingHrs / hoursPerWeek) : null;
  const projectedDate =
    weeksLeft !== null
      ? new Date(Date.now() + weeksLeft * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

  const nextStep = data.nextActions[0];

  // Bar chart data from radar data
  const barData = data.skillRadar.slice(0, 6).map((d) => ({
    domain: d.domain.length > 10 ? d.domain.slice(0, 10) + "…" : d.domain,
    coverage: d.coverage,
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6 stagger-in">

      {/* ── Gradient hero banner ─────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: "var(--gradient-sunset)" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 90% 10%, rgba(255,255,255,0.12), transparent 50%), radial-gradient(circle at 10% 90%, rgba(0,0,0,0.15), transparent 55%)"
        }} />
        <div className="relative flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="text-white/70 text-xs font-mono uppercase tracking-widest mb-1">Your Learning Hub</p>
            <h1 className="font-display text-2xl sm:text-3xl text-white">
              Welcome back{profile.name ? `, ${profile.name}` : ""}! 👋
            </h1>
            <p className="text-white/80 text-sm mt-1.5">
              Goal: <span className="font-semibold text-white">{profile.goal || "Not set yet"}</span>
              {hoursPerWeek !== "" && <span className="text-white/60"> · {hoursPerWeek} hrs/week</span>}
            </p>
            <div className="flex gap-3 mt-4">
              <Link
                href="/roadmap"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.18)", color: "white", backdropFilter: "blur(8px)" }}
              >
                Full Roadmap →
              </Link>
              <Link
                href="/skills"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                style={{ background: "rgba(0,0,0,0.2)", color: "white" }}
              >
                Skills Overview
              </Link>
            </div>
          </div>
          {/* Progress ring */}
          <div className="shrink-0 flex flex-col items-center gap-1">
            <div className="relative">
              <ProgressRing pct={animatedPct} size={88} stroke={8} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-xl text-white">{animatedPct}%</span>
              </div>
            </div>
            <span className="text-white/70 text-[11px] font-mono uppercase tracking-wider">Overall</span>
          </div>
        </div>
      </div>

      {/* Next recommended step */}
      {nextStep && (
        <div
          className="relative rounded-xl overflow-hidden p-5 border flex items-center justify-between gap-4 flex-wrap"
          style={{ borderColor: "var(--accent)", background: "var(--panel)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 80% at 0% 50%, rgba(192,57,43,0.07), transparent)" }}
          />
          <div className="relative">
            <p className="text-xs mono text-[var(--accent)] uppercase tracking-wider mb-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              Next recommended step
            </p>
            <p className="font-display text-lg">{nextStep.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{nextStep.milestone}</p>
          </div>
          <Link
            href="/roadmap"
            className="relative px-5 py-2.5 rounded-lg text-sm font-semibold shrink-0 transition-all hover:scale-105"
            style={{ background: "var(--gradient-accent)", color: "white", boxShadow: "0 4px 14px rgba(192,57,43,0.3)" }}
          >
            Continue →
          </Link>
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon="📚" label="Courses done"
          value={`${animatedCompleted}/${animatedTotal}`}
          gradient="linear-gradient(135deg,#8b1a12,#c0392b)"
        />
        <StatCard
          icon="⏱" label="Hours studied"
          value={`${animatedDoneHrs}h`}
          sub={`of ${animatedTotalHrs}h`}
          gradient="linear-gradient(135deg,#a0520c,#d4862a)"
        />
        <StatCard
          icon="🎯" label="Overall progress"
          value={`${animatedPct}%`}
          gradient="linear-gradient(135deg,#6b0f1a,#c0392b)"
        />
        <StatCard
          icon="🔥" label="Domains mastered"
          value={`${skillCounts.mastered}`}
          sub="mastered domains"
          gradient="linear-gradient(135deg,#c2410c,#f97316)"
        />
      </div>

      {/* Overall progress + skill proficiency */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-2">Overall track progress</p>
          <p className="font-display text-lg mb-3">{profile.goal || "Personalized Learning Goal"}</p>
          <div className="flex items-end justify-between mb-2">
            <span className="font-display text-4xl count-up" style={{ color: "var(--accent)" }}>
              {animatedPct}%
            </span>
            <span className="text-xs text-[var(--text-muted)]">Target: 100% Mastery</span>
          </div>
          <div className="h-3 rounded-full bg-[var(--panel-alt)] overflow-hidden">
            <div
              className="h-full progress-bar-gradient transition-all duration-700 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4">
            <ActivityHeatmap completedHrs={data.completedHrs} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider">Skill proficiency overview</p>
            <span className="tag-pill">{skillCounts.mastered + skillCounts.developing + skillCounts.weak + skillCounts.missing} total</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <SkillTile label="Mastered" count={skillCounts.mastered} gradient="linear-gradient(135deg,#a0520c,#d4862a)" href="/skills?cat=mastered" />
            <SkillTile label="Developing" count={skillCounts.developing} gradient="linear-gradient(135deg,#8b1a12,#c0392b)" href="/skills?cat=developing" />
            <SkillTile label="Weak" count={skillCounts.weak} gradient="linear-gradient(135deg,#92400e,#d97706)" href="/skills?cat=weak" />
            <SkillTile label="Missing" count={skillCounts.missing} gradient="linear-gradient(135deg,#7f1d1d,#dc2626)" href="/skills?cat=missing" />
          </div>
        </div>
      </div>

      {/* Study pace planner */}
      <div className="card p-5">
        <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Study pace planner</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--text-muted)]">Hours/week you can study:</label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={hoursPerWeek}
            onChange={(e) => {
              const v = e.target.value === "" ? "" : Number(e.target.value);
              setHoursPerWeek(v);
              if (typeof v === "number" && v >= 0) savePace(v);
            }}
            className="w-24 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          {savingPace && <span className="text-xs text-[var(--text-muted)] mono">saving…</span>}
        </div>
        {projectedDate ? (
          <p className="text-sm mt-3">
            At that pace, you'll finish your remaining <span className="text-[var(--accent)]">{remainingHrs}h</span>{" "}
            around <span className="font-display text-[var(--accent)]">{projectedDate}</span> ({weeksLeft} week
            {weeksLeft === 1 ? "" : "s"}).
          </p>
        ) : (
          <p className="text-sm text-[var(--text-muted)] mt-3">
            Enter your available hours per week to see a projected finish date.
          </p>
        )}
      </div>

      {/* Radar + milestones + bar chart */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-4">Skill coverage by domain</p>
          {data.skillRadar.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Build a roadmap first to see coverage.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.skillRadar} outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 9 }} />
                  <Radar dataKey="coverage" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
          {barData.length > 0 && (
            <div className="mt-4 h-36">
              <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-2">Coverage by domain (bar)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={12}>
                  <XAxis dataKey="domain" tick={{ fill: "var(--text-muted)", fontSize: 9 }} />
                  <YAxis tick={{ fill: "var(--text-muted)", fontSize: 9 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: "var(--accent-soft)" }}
                  />
                  <Bar dataKey="coverage" fill="var(--accent-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-4">Milestones</p>
          {data.milestones.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Build a roadmap first to see milestones.</p>
          ) : (
            <ul className="space-y-4">
              {data.milestones.map((m, idx) => {
                const milestonePct = m.total ? Math.round((m.completed / m.total) * 100) : 0;
                return (
                  <li key={m.milestone}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: m.done ? "var(--gradient-accent)" : "var(--panel-alt)", color: m.done ? "white" : "var(--text-muted)" }}
                        >
                          {m.done ? "✓" : idx + 1}
                        </span>
                        {m.milestone}
                      </span>
                      <span className="text-xs mono text-[var(--text-muted)]">
                        {m.completed}/{m.total} · {milestonePct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden ml-8" style={{ background: "var(--panel-alt)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${milestonePct}%`, background: "var(--gradient-accent)" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({
  icon, label, value, sub, gradient,
}: {
  icon: string; label: string; value: React.ReactNode; sub?: React.ReactNode; gradient: string;
}) {
  return (
    <div className="card p-4 card-interactive">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg mb-3"
        style={{ background: gradient }}
      >
        {icon}
      </div>
      <p className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className="font-display text-2xl">{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Skill Tile ───────────────────────────────────────── */
function SkillTile({
  label, count, gradient, href,
}: {
  label: string; count: number; gradient: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-3 group"
      style={{ background: "var(--panel-alt)", border: "1px solid var(--border)" }}
    >
      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold text-white" style={{ background: gradient }}>
        {count}
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)] mono uppercase tracking-wider">{label}</p>
        <p className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">View list →</p>
      </div>
    </Link>
  );
}
