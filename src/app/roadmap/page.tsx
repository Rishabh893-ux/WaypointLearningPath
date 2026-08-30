"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { fireConfetti } from "@/lib/confetti";
import RoadmapGraph from "@/components/RoadmapGraph";

type SyllabusModule = { title: string; topics: string[] };

type Course = {
  title: string;
  domain: string;
  difficulty: number;
  durationHrs: number;
  tags: string[];
  description: string;
  project: string;
  prerequisites: string[];
  syllabus: SyllabusModule[];
  learningOutcomes: string[];
};

type PathItem = {
  id: number;
  courseId: string;
  position: number;
  milestone: string;
  score: number;
  status: "planned" | "in_progress" | "completed" | "skipped";
  explanation: string;
  source: "recommended" | "manual";
  course: Course;
  assessment: { score: number | null; passed: boolean | null; taken: boolean } | null;
};

type Question = { id: string; prompt: string; options: { id: string; text: string }[] };
type QuestionResult = { questionId: string; correct: boolean; correctOptionId: string; explanation: string };
type SubmitResult = { score: number; passed: boolean; correctCount: number; total: number; results: QuestionResult[] };

type QuizState = {
  questions: Question[] | null;
  answers: Record<string, string>;
  loading: boolean;
  submitting: boolean;
  result: SubmitResult | null;
};

const ITEM_H_COLLAPSED = 172;
const TRAIL_W = 72;

// Deterministic domain → color
const DOMAIN_COLORS: Record<string, string> = {
  "Machine Learning": "#e3a857",
  "Deep Learning": "#c084fc",
  "Data Science": "#4fd1c5",
  "Web Development": "#60a5fa",
  "Programming": "#34d399",
  "UX Design": "#fb923c",
  "DevOps": "#a78bfa",
  "Cloud Computing": "#38bdf8",
  "Cybersecurity": "#f87171",
  "Data Engineering": "#facc15",
};

function domainColor(domain: string): string {
  if (DOMAIN_COLORS[domain]) return DOMAIN_COLORS[domain];
  // Fallback: hash the domain name
  let hash = 0;
  for (let i = 0; i < domain.length; i++) hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

function trailX(i: number) {
  return 36 + Math.sin(i * 0.9) * 26;
}

export default function RoadmapPage() {
  const [path, setPath] = useState<PathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [quizzes, setQuizzes] = useState<Record<string, QuizState>>({});
  const [viewMode, setViewMode] = useState<"trail" | "graph">("trail");
  const [scrollTargetId, setScrollTargetId] = useState<string | null>(null);
  const [trailReady, setTrailReady] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [question, setQuestion] = useState("");
  const [qaHistory, setQaHistory] = useState<{ q: string; a: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    setTrailReady(false);
    const res = await fetch("/api/roadmap");
    const data = await res.json();
    setPath(data.path || []);
    setLoading(false);
    // Trigger trail draw-on animation after a short delay
    setTimeout(() => setTrailReady(true), 100);

    // Load notes
    fetch("/api/notes")
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? {}))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function regenerate() {
    setRegenerating(true);
    const res = await fetch("/api/roadmap", { method: "POST" });
    const data = await res.json();
    setPath(data.path || []);
    setExpanded(new Set());
    setQuizzes({});
    setRegenerating(false);
    setTrailReady(false);
    setTimeout(() => setTrailReady(true), 100);
  }

  async function markStatus(courseId: string, action: "completed" | "skipped" | "in_progress") {
    setPath((p) => p.map((item) => (item.courseId === courseId ? { ...item, status: action } : item)));
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, action }),
    });
  }

  async function removeFromRoadmap(courseId: string) {
    const res = await fetch("/api/roadmap/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    if (res.ok) {
      setPath(data.path);
      showToast("Removed from your roadmap.", "info");
    } else {
      showToast(data.error || "Couldn't remove that course.", "error");
    }
  }

  function jumpToCourse(courseId: string) {
    setViewMode("trail");
    setExpanded((s) => new Set(s).add(courseId));
    setScrollTargetId(courseId);
  }

  useEffect(() => {
    if (viewMode !== "trail" || !scrollTargetId) return;
    const frame = requestAnimationFrame(() => {
      cardRefs.current[scrollTargetId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      setScrollTargetId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [viewMode, scrollTargetId, expanded]);

  function toggleExpand(courseId: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  async function startAssessment(courseId: string, regen = false) {
    setQuizzes((q) => ({
      ...q,
      [courseId]: { questions: null, answers: {}, loading: true, submitting: false, result: null },
    }));
    const res = await fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, regenerate: regen }),
    });
    const data = await res.json();
    setQuizzes((q) => ({
      ...q,
      [courseId]: { questions: data.questions, answers: {}, loading: false, submitting: false, result: null },
    }));
  }

  function selectAnswer(courseId: string, questionId: string, optionId: string) {
    setQuizzes((q) => ({
      ...q,
      [courseId]: { ...q[courseId], answers: { ...q[courseId].answers, [questionId]: optionId } },
    }));
  }

  async function submitAssessment(courseId: string) {
    const quiz = quizzes[courseId];
    if (!quiz?.questions) return;
    setQuizzes((q) => ({ ...q, [courseId]: { ...q[courseId], submitting: true } }));
    const res = await fetch("/api/assessment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, answers: quiz.answers }),
    });
    const data: SubmitResult = await res.json();
    setQuizzes((q) => ({ ...q, [courseId]: { ...q[courseId], submitting: false, result: data } }));
    if (data.passed) {
      fireConfetti();
      showToast(
        data.score === 1 ? "Perfect score! Course marked complete." : "Passed — course marked complete.",
        "success"
      );
      setPath((p) =>
        p.map((item) =>
          item.courseId === courseId
            ? { ...item, status: "completed", assessment: { score: data.score, passed: true, taken: true } }
            : item
        )
      );
    } else {
      showToast(`Scored ${Math.round(data.score * 100)}% — below the 70% pass mark. Try again.`, "error");
      setPath((p) =>
        p.map((item) =>
          item.courseId === courseId
            ? { ...item, assessment: { score: data.score, passed: false, taken: true } }
            : item
        )
      );
    }
  }

  async function ask() {
    if (!question.trim() || asking) return;
    const q = question;
    setQuestion("");
    setAsking(true);
    try {
      const res = await fetch("/api/roadmap-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setQaHistory((h) => [...h, { q, a: data.answer }]);
    } finally {
      setAsking(false);
    }
  }

  async function saveNote(courseId: string, note: string) {
    setNotes((n) => ({ ...n, [courseId]: note }));
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, note }),
    });
  }

  const points = path.map((_, i) => ({ x: trailX(i), y: i * ITEM_H_COLLAPSED + ITEM_H_COLLAPSED / 2 }));
  const linePath = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `Q ${points[i - 1].x} ${(points[i - 1].y + p.y) / 2}, ${p.x} ${p.y}`))
    .join(" ");
  const height = Math.max(path.length * ITEM_H_COLLAPSED, ITEM_H_COLLAPSED);

  const completedCount = path.filter((p) => p.status === "completed").length;
  const totalHrs = path.reduce((s, p) => s + (p.course?.durationHrs ?? 0), 0);
  const doneHrs = path.filter((p) => p.status === "completed").reduce((s, p) => s + (p.course?.durationHrs ?? 0), 0);
  const overallPct = path.length ? Math.round((completedCount / path.length) * 100) : 0;

  let lastMilestone = "";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl">Your roadmap</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Prerequisite-ordered, with a syllabus and graded assessment behind every course.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-md border border-[var(--border)] overflow-hidden text-sm">
            <button
              onClick={() => setViewMode("trail")}
              className={`px-3 py-1.5 transition-colors ${
                viewMode === "trail" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              Trail
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1.5 transition-colors border-l border-[var(--border)] ${
                viewMode === "graph" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-muted)]"
              }`}
            >
              Graph
            </button>
          </div>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="px-4 py-2 rounded-md border border-[var(--border)] text-sm hover:border-[var(--accent)] transition-colors disabled:opacity-50"
          >
            {regenerating ? "Recalculating…" : "Regenerate roadmap"}
          </button>
        </div>
      </div>

      {loading ? (
        <RoadmapSkeleton />
      ) : path.length === 0 ? (
        <div className="card p-10 text-center">
          <svg className="mx-auto mb-4 opacity-60" width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21c4-4.5 7-8.2 7-11.5A7 7 0 0 0 5 9.5C5 12.8 8 16.5 12 21Z"
              stroke="var(--accent)"
              strokeWidth="1.4"
            />
            <path d="M9.5 9.5l1.5 1.5 3.5-3.5" stroke="var(--accent-2)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-[var(--text-muted)]">No roadmap yet — go tell the chat about your goals first.</p>
        </div>
      ) : (
        <>
          {/* Sticky progress summary bar */}
          <div className="card p-4 mb-8 flex flex-wrap gap-6 text-sm items-center sticky top-[57px] z-10 glass">
            <div>
              <span className="text-[var(--text-muted)] mono text-xs">COURSES</span>{" "}
              <span className="font-display text-lg ml-1">{completedCount}/{path.length}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] mono text-xs">HOURS</span>{" "}
              <span className="font-display text-lg ml-1">{doneHrs}/{totalHrs}h</span>
            </div>
            <div className="flex-1 min-w-[140px] self-center">
              <div className="h-1.5 rounded-full bg-[var(--panel-alt)] overflow-hidden">
                <div
                  className="h-full progress-bar-gradient transition-all duration-700"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
            <span className="font-display text-base" style={{ color: "var(--accent)" }}>{overallPct}%</span>
          </div>

          {viewMode === "graph" ? (
            <div className="card p-5 mb-8">
              <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider mb-4">
                Prerequisite graph — click a course to view its syllabus and assessment
              </p>
              <RoadmapGraph
                items={path.map((p) => ({
                  courseId: p.courseId,
                  title: p.course.title,
                  domain: p.course.domain,
                  status: p.status,
                  milestone: p.milestone,
                  prerequisites: p.course.prerequisites,
                }))}
                onSelect={jumpToCourse}
              />
            </div>
          ) : null}

          <div className="relative" style={{ minHeight: height, display: viewMode === "trail" ? "block" : "none" }}>
            {/* Trail SVG — draw-on animation */}
            <svg width={TRAIL_W} height={height} className="absolute left-0 top-0" style={{ overflow: "visible" }}>
              {/* Background trail */}
              <path d={linePath} stroke="var(--border)" strokeWidth={3} fill="none" />
              {/* Animated draw-on base trail */}
              {trailReady && (
                <path
                  d={linePath}
                  stroke="var(--border)"
                  strokeWidth={3}
                  fill="none"
                  className="trail-draw"
                />
              )}
              {/* Progress fill */}
              <path
                d={linePath}
                stroke="var(--accent)"
                strokeWidth={3}
                fill="none"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (1000 * completedCount) / Math.max(path.length, 1)}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
              {/* Trail dots */}
              {points.map((p, i) => {
                const isInProgress = path[i].status === "in_progress";
                const color =
                  path[i].status === "completed"
                    ? "var(--accent)"
                    : path[i].status === "skipped"
                    ? "var(--danger)"
                    : "var(--panel-alt)";
                return isInProgress ? (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={7}
                    fill="var(--accent-2)"
                    stroke="var(--accent-2)"
                    strokeWidth={2}
                    className="pulse-dot"
                  />
                ) : (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={7}
                    fill={color}
                    stroke="var(--border)"
                    strokeWidth={2}
                  />
                );
              })}
            </svg>

            <div style={{ marginLeft: TRAIL_W + 16 }}>
              {path.map((item, i) => {
                const showMilestoneHeader = item.milestone !== lastMilestone;
                lastMilestone = item.milestone;
                const isExpanded = expanded.has(item.courseId);
                const quiz = quizzes[item.courseId];
                const dColor = domainColor(item.course.domain);

                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      cardRefs.current[item.courseId] = el;
                    }}
                    style={{ minHeight: ITEM_H_COLLAPSED }}
                    className="flex flex-col justify-center pb-4"
                  >
                    {showMilestoneHeader && (
                      <div className="milestone-banner px-3 py-1.5 mb-2 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: "var(--accent)" }}
                        />
                        <p className="text-[11px] mono text-[var(--accent)] uppercase tracking-wider font-semibold">
                          {item.milestone}
                        </p>
                      </div>
                    )}
                    <div
                      className="card card-interactive p-4 w-full domain-border-left"
                      style={{ borderLeftColor: dColor }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] mono uppercase tracking-wider mb-1" style={{ color: dColor }}>
                            {item.course.domain}
                          </p>
                          <h3 className="font-display text-lg leading-tight">{item.course.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {item.course.durationHrs}h · difficulty {item.course.difficulty}/4 ·{" "}
                            {item.source === "manual" ? (
                              <span className="text-[var(--accent-2)]">added by you</span>
                            ) : (
                              <>relevance {(item.score * 100).toFixed(0)}%</>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <StatusBadge status={item.status} />
                          {item.assessment?.taken && (
                            <span
                              className={`tag-pill ${
                                item.assessment.passed
                                  ? "text-[var(--accent)] border-[var(--accent)]"
                                  : "text-[var(--danger)] border-[var(--danger)]"
                              }`}
                            >
                              {item.assessment.passed ? "✓ Verified" : `${Math.round((item.assessment.score ?? 0) * 100)}% — retry`}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.explanation && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 italic">{item.explanation}</p>
                      )}
                      {item.course.project && (
                        <p className="text-xs mt-2 border-l-2 border-[var(--accent-2)] pl-2 text-[var(--text)]">
                          <span className="text-[var(--accent-2)] mono uppercase text-[10px] tracking-wider">
                            Practice project
                          </span>
                          <br />
                          {item.course.project}
                        </p>
                      )}

                      <div className="flex gap-2 mt-3 flex-wrap items-center">
                        <button
                          onClick={() => toggleExpand(item.courseId)}
                          className="text-xs px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent-2)] hover:text-[var(--accent-2)] transition-colors"
                        >
                          {isExpanded ? "Hide syllabus" : "View syllabus & assessment"}
                        </button>
                        <button
                          onClick={() => markStatus(item.courseId, "in_progress")}
                          className="text-xs px-2.5 py-1 rounded border border-[var(--accent-2)] text-[var(--accent-2)] hover:bg-[var(--accent-2-soft)]"
                        >
                          In progress
                        </button>
                        <button
                          onClick={() => markStatus(item.courseId, "completed")}
                          className="text-xs px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          title="Mark complete without taking the assessment"
                        >
                          Mark complete manually
                        </button>
                        <button
                          onClick={() => markStatus(item.courseId, "skipped")}
                          className="text-xs px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--danger)] hover:text-[var(--danger)]"
                        >
                          Skip
                        </button>
                        {item.source === "manual" && (
                          <button
                            onClick={() => removeFromRoadmap(item.courseId)}
                            className="text-xs px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--danger)] hover:text-[var(--danger)] ml-auto"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4 animate-[fadeIn_0.2s_ease]">
                          <div>
                            <p className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
                              Learning outcomes
                            </p>
                            <ul className="space-y-1">
                              {item.course.learningOutcomes.map((o, idx) => (
                                <li key={idx} className="text-sm flex gap-2">
                                  <span style={{ color: dColor }}>✓</span> {o}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider mb-2">
                              Syllabus
                            </p>
                            <div className="space-y-2.5">
                              {item.course.syllabus.map((m, idx) => (
                                <div key={idx} className="bg-[var(--panel-alt)] rounded-md p-3 border border-[var(--border)]">
                                  <p className="text-sm font-medium mb-1.5">
                                    <span className="mono text-xs mr-1.5" style={{ color: dColor }}>
                                      {String(idx + 1).padStart(2, "0")}
                                    </span>
                                    {m.title}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {m.topics.map((t) => (
                                      <span key={t} className="tag-pill">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Study notes */}
                          <StudyNotes
                            courseId={item.courseId}
                            initialNote={notes[item.courseId] ?? ""}
                            onSave={(note) => saveNote(item.courseId, note)}
                          />

                          <AssessmentPanel
                            courseId={item.courseId}
                            quiz={quiz}
                            domainColor={dColor}
                            onStart={() => startAssessment(item.courseId)}
                            onRetake={() => startAssessment(item.courseId, true)}
                            onSelect={(qid, oid) => selectAnswer(item.courseId, qid, oid)}
                            onSubmit={() => submitAssessment(item.courseId)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-5 mt-4">
            <h2 className="font-display text-base mb-1">Ask about your roadmap</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              e.g. "Why is this course before that one?" or "Can I skip ahead to deep learning?"
            </p>
            <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
              {qaHistory.map((h, i) => (
                <div key={i} className="text-sm space-y-1">
                  <p className="text-[var(--accent-2)]">{h.q}</p>
                  <p className="text-[var(--text-muted)]">{h.a}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                placeholder="Ask a question about this roadmap…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
              />
              <button
                onClick={ask}
                disabled={asking}
                className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                style={{ background: "var(--gradient-accent-2)", color: "var(--panel)" }}
              >
                {asking ? "…" : "Ask"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Study Notes panel ───────────────────────────────────── */
function StudyNotes({
  courseId,
  initialNote,
  onSave,
}: {
  courseId: string;
  initialNote: string;
  onSave: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // sync if parent passes down new initial value
  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  function handleChange(val: string) {
    setNote(val);
    setSaved(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onSave(val);
      setSaved(true);
    }, 800);
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5 hover:text-[var(--accent)] transition-colors"
      >
        <span>{open ? "▾" : "▸"}</span> Study notes
        {note && !open && <span className="tag-pill ml-1">has notes</span>}
        {open && saved && <span className="text-[var(--accent-2)] ml-1">✓ saved</span>}
      </button>
      {open && (
        <textarea
          className="w-full bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)] resize-none leading-relaxed animate-[fadeIn_0.2s_ease]"
          rows={4}
          placeholder="Jot down notes, key concepts, or things to review later…"
          value={note}
          onChange={(e) => handleChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ── Assessment panel ────────────────────────────────────── */
function AssessmentPanel({
  courseId,
  quiz,
  domainColor: dColor,
  onStart,
  onRetake,
  onSelect,
  onSubmit,
}: {
  courseId: string;
  quiz: QuizState | undefined;
  domainColor: string;
  onStart: () => void;
  onRetake: () => void;
  onSelect: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [quiz?.questions]);

  const total = quiz?.questions?.length ?? 0;
  const answeredCount = quiz ? Object.keys(quiz.answers).length : 0;
  const currentQ = quiz?.questions?.[idx];

  return (
    <div>
      <p className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider mb-2">Assessment</p>

      {!quiz && (
        <button
          onClick={onStart}
          className="text-sm px-4 py-2 rounded-md font-medium transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--gradient-accent)", color: "var(--panel)" }}
        >
          Take assessment
        </button>
      )}

      {quiz?.loading && <p className="text-xs text-[var(--text-muted)] mono">Generating questions…</p>}

      {quiz?.questions && !quiz.result && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              Question {idx + 1} of {total} · {answeredCount} answered
            </span>
            <div className="flex gap-1.5">
              {quiz.questions.map((q, i) => {
                const isAnswered = !!quiz.answers[q.id];
                const isCurrent = i === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setIdx(i)}
                    className="w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors"
                    style={{
                      background: isCurrent ? dColor : isAnswered ? dColor + "33" : "var(--panel-alt)",
                      color: isCurrent ? "white" : isAnswered ? dColor : "var(--text-muted)",
                      border: `1px solid ${isCurrent || isAnswered ? dColor : "var(--border)"}`,
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {currentQ && (
            <div className="bg-[var(--panel-alt)] rounded-md p-4 border border-[var(--border)]">
              <p className="text-sm mb-3">{currentQ.prompt}</p>
              <div className="space-y-1.5">
                {currentQ.options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 text-sm px-2.5 py-1.5 rounded border cursor-pointer transition-colors ${
                      quiz.answers[currentQ.id] === opt.id
                        ? "border-[var(--accent-2)] bg-[var(--accent-2-soft)]"
                        : "border-[var(--border)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQ.id}
                      className="accent-[var(--accent-2)]"
                      checked={quiz.answers[currentQ.id] === opt.id}
                      onChange={() => onSelect(currentQ.id, opt.id)}
                    />
                    {opt.text}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="text-xs px-3 py-1.5 rounded border border-[var(--border)] text-[var(--text-muted)] disabled:opacity-30"
            >
              ← Previous
            </button>
            {idx < total - 1 ? (
              <button
                onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
                className="text-xs px-3 py-1.5 rounded border border-[var(--accent-2)] text-[var(--accent-2)] hover:bg-[var(--accent-2-soft)]"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={quiz.submitting || answeredCount < total}
                className="text-sm px-4 py-2 rounded-md font-medium disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
                style={{ background: "var(--gradient-accent)", color: "var(--panel)" }}
              >
                {quiz.submitting ? "Grading…" : "Submit assessment"}
              </button>
            )}
          </div>
        </div>
      )}

      {quiz?.result && (
        <div className="space-y-3">
          <div
            className={`p-3 rounded-md border text-sm ${
              quiz.result.passed
                ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                : "border-[var(--danger)] bg-[var(--danger)]/10"
            }`}
          >
            <span className="font-display text-lg">
              {quiz.result.correctCount}/{quiz.result.total}
            </span>{" "}
            correct — {quiz.result.passed ? "passed, course marked complete" : "below 70%, not marked complete yet"}
          </div>
          <div className="space-y-2">
            {quiz.result.results.map((r, i) => (
              <p key={r.questionId} className="text-xs text-[var(--text-muted)]">
                <span className={r.correct ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
                  {r.correct ? "✓" : "✗"} Q{i + 1}
                </span>{" "}
                {r.explanation}
              </p>
            ))}
          </div>
          {!quiz.result.passed && (
            <button
              onClick={onRetake}
              className="text-xs px-3 py-1.5 rounded border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
            >
              Retake with new questions
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PathItem["status"] }) {
  const styles: Record<string, string> = {
    planned: "text-[var(--text-muted)] border-[var(--border)]",
    in_progress: "text-[var(--accent-2)] border-[var(--accent-2)]",
    completed: "text-[var(--accent)] border-[var(--accent)]",
    skipped: "text-[var(--danger)] border-[var(--danger)]",
  };
  const labels: Record<string, string> = {
    planned: "Planned",
    in_progress: "In progress",
    completed: "Completed",
    skipped: "Skipped",
  };
  return <span className={`tag-pill shrink-0 ${styles[status]}`}>{labels[status]}</span>;
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="h-2.5 w-24 bg-[var(--panel-alt)] rounded mb-3" />
          <div className="h-4 w-64 bg-[var(--panel-alt)] rounded mb-2" />
          <div className="h-2.5 w-40 bg-[var(--panel-alt)] rounded" />
        </div>
      ))}
    </div>
  );
}
