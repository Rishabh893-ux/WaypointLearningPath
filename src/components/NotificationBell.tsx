"use client";

import { useEffect, useRef, useState } from "react";

type Item = { message: string; createdAt: string };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center relative hover:border-[var(--accent)] transition-colors shrink-0"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z"
            stroke="var(--text)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="var(--text)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {items.length > 0 && (
          <span
            className="absolute top-0 right-0 w-2 h-2 rounded-full"
            style={{ background: "var(--danger)" }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 card p-2 z-30"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <p className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider px-2 py-1.5">
            Recent activity
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] px-2 py-3">Nothing yet — get started on your roadmap.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((it, i) => (
                <li key={i} className="px-2 py-2 text-sm border-t border-[var(--border)] first:border-t-0">
                  {it.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
