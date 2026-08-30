"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"beige" | "dark">("beige");

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const initial = stored === "dark" ? "dark" : "beige";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggle() {
    const next = theme === "dark" ? "beige" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-sm hover:border-[var(--accent)] transition-colors shrink-0"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
