"use client";

import { useEffect, useState } from "react";

function initials(name: string | null) {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function Avatar() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setName(p.name))
      .catch(() => {});
  }, []);

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{ background: "var(--accent)", color: "var(--panel)" }}
      title={name || "Set your name on the Profile page"}
    >
      {initials(name)}
    </div>
  );
}
