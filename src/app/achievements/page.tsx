"use client";

import { useEffect, useState } from "react";

type Badge = { id: string; title: string; description: string; icon: string; unlocked: boolean };
type AchievementsData = {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streakCount: number;
  longestStreak: number;
  badges: Badge[];
  unlockedCount: number;
  totalBadges: number;
};

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
        <div className="h-7 w-56 bg-[var(--panel-alt)] rounded animate-pulse" />
        <div className="card h-28 animate-pulse" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const levelPct = Math.round((data.xpIntoLevel / data.xpForNextLevel) * 100);
  const nearLevelUp = levelPct >= 80;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8 stagger-in">
      <div>
        <h1 className="font-display text-2xl">Achievements</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          XP and badges earned from real progress — completed courses, passed assessments, and study streaks.
        </p>
      </div>

      {/* XP Level card with gradient bar + glow */}
      <div className="card p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 80% 50%, rgba(192,57,43,0.08), transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display text-2xl">Level {data.level}</span>
            <span className="text-xs mono text-[var(--text-muted)]">
              {data.xpIntoLevel} / {data.xpForNextLevel} XP
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "var(--panel-alt)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${levelPct}%`,
                background: "var(--gradient-accent)",
                boxShadow: nearLevelUp ? "0 0 12px rgba(192,57,43,0.6)" : undefined
              }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {data.xp} total XP · {levelPct}% to next level
          </p>
          {nearLevelUp && (
            <div className="mt-3 px-4 py-2.5 rounded-lg flex items-center gap-2" style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}>
              <span className="text-lg">⚡</span>
              <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
                You&apos;re almost Level {data.level + 1}! Complete one more course to level up.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streak + badge summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 10% 50%, rgba(249,115,22,0.06), transparent 60%)" }} />
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "linear-gradient(135deg,#c2410c,#f97316)" }}
          >
            🔥
          </div>
          <div>
            <p className="font-display text-xl">{data.streakCount}-day streak</p>
            <p className="text-xs text-[var(--text-muted)]">Longest: {data.longestStreak} days</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 10% 50%, rgba(192,57,43,0.06), transparent 60%)" }} />
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "var(--gradient-accent)" }}
          >
            🏆
          </div>
          <div>
            <p className="font-display text-xl">
              {data.unlockedCount} / {data.totalBadges} badges
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {data.totalBadges - data.unlockedCount} remaining to unlock
            </p>
          </div>
        </div>
      </div>

      {/* Badge grid with flip cards */}
      <div>
        <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-3">Badges</p>
        <div className="grid sm:grid-cols-3 gap-4 stagger-in">
          {data.badges.map((b) => (
            <BadgeCard key={b.id} badge={b} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge: b }: { badge: Badge }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="flip-card h-36 cursor-pointer"
      onClick={() => setFlipped((f) => !f)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setFlipped((f) => !f)}
    >
      <div className={`flip-card-inner h-full ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        style={{ transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)" }}>
        {/* Front */}
        <div
          className={`flip-card-front card p-4 flex flex-col items-center justify-center text-center h-full ${
            b.unlocked ? "card-interactive" : ""
          } ${!b.unlocked ? "badge-shimmer" : ""}`}
          style={b.unlocked ? { borderColor: "var(--accent)" } : {}}
        >
          <div
            className={`text-3xl mb-2 transition-transform ${b.unlocked ? "scale-100" : "opacity-40 grayscale scale-90"}`}
          >
            {b.icon}
          </div>
          <p className={`text-sm font-medium mb-0.5 ${!b.unlocked ? "opacity-40" : ""}`}>{b.title}</p>
          {b.unlocked ? (
            <span
              className="text-[10px] mono uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{ color: "var(--accent)", borderColor: "var(--accent)", background: "var(--accent-soft)" }}
            >
              Unlocked
            </span>
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] opacity-60">Hover to see hint</p>
          )}
        </div>

        {/* Back */}
        <div
          className="flip-card-back card p-4 flex flex-col items-center justify-center text-center h-full"
          style={{
            background: b.unlocked ? "var(--accent-soft)" : "var(--panel-alt)",
            borderColor: b.unlocked ? "var(--accent)" : "var(--border)",
          }}
        >
          <div className="text-2xl mb-2">{b.icon}</div>
          <p className="text-xs font-medium mb-1" style={{ color: b.unlocked ? "var(--accent)" : "var(--text-muted)" }}>
            {b.title}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{b.description}</p>
          {!b.unlocked && (
            <p className="text-[10px] mono text-[var(--accent)] mt-2 uppercase tracking-wider">
              Keep going to unlock
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
