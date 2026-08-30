"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Command = { id: string; label: string; hint?: string; action: () => void };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [courseTitles, setCourseTitles] = useState<{ id: string; title: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("open-command-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("open-command-palette", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open && courseTitles.length === 0) {
      fetch("/api/courses")
        .then((r) => r.json())
        .then((d) => setCourseTitles((d.courses || []).map((c: any) => ({ id: c.id, title: c.title }))));
    }
  }, [open, courseTitles.length]);

  const navCommands: Command[] = useMemo(
    () => [
      { id: "nav-chat", label: "Go to Chat", hint: "intake", action: () => router.push("/") },
      { id: "nav-courses", label: "Go to Course Explorer", hint: "browse catalog", action: () => router.push("/courses") },
      { id: "nav-roadmap", label: "Go to Roadmap", hint: "your path", action: () => router.push("/roadmap") },
      { id: "nav-dashboard", label: "Go to Dashboard", hint: "progress", action: () => router.push("/dashboard") },
      { id: "nav-achievements", label: "Go to Achievements", hint: "XP, streaks, badges", action: () => router.push("/achievements") },
      { id: "nav-skills", label: "Go to Skills", hint: "mastery breakdown", action: () => router.push("/skills") },
      { id: "nav-certificate", label: "Go to Certificate", hint: "unlocks at 100%", action: () => router.push("/certificate") },
      { id: "nav-profile", label: "Go to Profile", hint: "edit your details", action: () => router.push("/profile") },
      {
        id: "toggle-theme",
        label: "Toggle beige / dark theme",
        action: () => {
          const next = document.documentElement.dataset.theme === "dark" ? "beige" : "dark";
          document.documentElement.dataset.theme = next;
          window.localStorage.setItem("theme", next);
        },
      },
    ],
    [router]
  );

  const courseCommands: Command[] = courseTitles.map((c) => ({
    id: `course-${c.id}`,
    label: c.title,
    hint: "course",
    action: () => router.push(`/courses?q=${encodeURIComponent(c.title)}`),
  }));

  const all = [...navCommands, ...courseCommands];
  const filtered = query.trim()
    ? all.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : navCommands;

  function run(cmd: Command) {
    cmd.action();
    setOpen(false);
    setQuery("");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-24 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="card w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filtered[0]) run(filtered[0]);
          }}
          placeholder="Jump to a page or course…"
          className="w-full bg-transparent px-4 py-3.5 text-sm outline-none border-b border-[var(--border)]"
        />
        <div className="max-h-80 overflow-y-auto py-1.5">
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-sm text-[var(--text-muted)]">No matches.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => run(c)}
              className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-[var(--accent-soft)] transition-colors"
            >
              <span>{c.label}</span>
              {c.hint && <span className="text-xs text-[var(--text-muted)] mono">{c.hint}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] mono flex justify-between">
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
