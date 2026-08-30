"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

type Profile = {
  name: string | null;
  goal: string | null;
  experienceLevel: string;
  interests: string[];
  studyHoursPerWeek: number | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setName(p.name || "");
        setGoal(p.goal || "");
        setLevel(p.experienceLevel || "beginner");
        setInterests(p.interests || []);
        setHoursPerWeek(typeof p.studyHoursPerWeek === "number" ? p.studyHoursPerWeek : "");
      });
  }, []);

  function addInterest() {
    const val = newInterest.trim().toLowerCase();
    if (val && !interests.includes(val)) setInterests((i) => [...i, val]);
    setNewInterest("");
  }

  function removeInterest(tag: string) {
    setInterests((i) => i.filter((t) => t !== tag));
  }

  async function save() {
    setSaving(true);
    const body: Record<string, any> = {
      name,
      goal,
      experienceLevel: level,
      interests,
    };
    if (typeof hoursPerWeek === "number") body.studyHoursPerWeek = hoursPerWeek;

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      showToast("Profile saved.", "success");
    } else {
      showToast("Couldn't save your profile.", "error");
    }
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="h-7 w-40 bg-[var(--panel-alt)] rounded animate-pulse mb-6" />
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-display text-2xl mb-1">Profile</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        This shapes your recommendations, your explanations, and your certificate.
      </p>

      <div className="card p-6 space-y-6">
        <div>
          <label className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
            Learning goal
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            placeholder="What are you trying to learn?"
            className="w-full bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
          />
        </div>

        <div>
          <label className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
            Experience level
          </label>
          <div className="flex gap-2">
            {["beginner", "intermediate", "advanced"].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-md border text-sm capitalize transition-colors ${
                  level === l
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
            Interests
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {interests.map((t) => (
              <span key={t} className="tag-pill flex items-center gap-1">
                {t}
                <button onClick={() => removeInterest(t)} className="hover:text-[var(--danger)]">
                  ×
                </button>
              </span>
            ))}
            {interests.length === 0 && <span className="text-sm text-[var(--text-muted)]">None yet</span>}
          </div>
          <div className="flex gap-2">
            <input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addInterest()}
              placeholder="Add an interest and press Enter"
              className="flex-1 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={addInterest}
              className="px-3 py-2 rounded-md border border-[var(--border)] text-sm hover:border-[var(--accent)]"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs mono text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
            Study hours per week
          </label>
          <input
            type="number"
            min={0}
            step={0.5}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-32 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full px-4 py-2.5 rounded-md text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--panel)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
