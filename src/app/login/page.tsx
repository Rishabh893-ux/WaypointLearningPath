"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

function Orb({
  cx, cy, size, color, delay, duration,
}: {
  cx: string; cy: string; size: number; color: string; delay: number; duration: number;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: cx, top: cy, width: size, height: size,
        background: color,
        filter: "blur(80px)",
        opacity: 0.45,
        animation: `orbFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

const FEATURES = [
  { icon: "🧭", label: "AI-Curated Roadmaps", desc: "Personalized learning paths built for your exact goals" },
  { icon: "🎯", label: "Skill Assessment", desc: "Pinpoint gaps and strengths with interactive quizzes" },
  { icon: "🏆", label: "XP & Achievements", desc: "Stay motivated with streaks, badges, and certificates" },
  { icon: "💬", label: "AI Mentor Chat", desc: "Get instant guidance from your personal AI learning advisor" },
];

export default function LoginPage() {
  const [tab, setTab] = useState<"guest" | "login">("guest");
  const [keyInput, setKeyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentFeature, setCurrentFeature] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => setCurrentFeature((p) => (p + 1) % FEATURES.length), 3000);
    return () => clearInterval(id);
  }, []);

  async function handleGuestStart() {
    setLoading(true);
    router.push("/");
  }

  async function handleLogin() {
    const cleanKey = keyInput.trim();
    if (!cleanKey) { setError("Please paste your Learner Key."); return; }
    if (cleanKey.length < 10) { setError("Key looks too short — check and try again."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", learnerId: cleanKey }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/");
      } else {
        setError(data.error || "Login failed. Check your key.");
        setLoading(false);
      }
    } catch {
      setError("Could not connect. Please try again.");
      setLoading(false);
    }
  }

  const feat = FEATURES[currentFeature];

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1a0a05 0%,#2d1410 30%,#3d1f0e 55%,#2a1208 80%,#1a0805 100%)" }}
    >
      <style>{`
        @keyframes orbFloat {
          from { transform: translate(-50%,-50%) scale(1); }
          to   { transform: translate(-50%,-50%) scale(1.18); }
        }
        @keyframes loginFade {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmerAnim {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes featFade {
          0%   { opacity:0; transform:translateY(6px); }
          15%  { opacity:1; transform:translateY(0); }
          85%  { opacity:1; transform:translateY(0); }
          100% { opacity:0; transform:translateY(-6px); }
        }
        .login-wrap { animation: loginFade 0.55s cubic-bezier(.16,1,.3,1) both; }
        .shimmer-t {
          background: linear-gradient(90deg,#f5c88a,#e87c3e,#c0392b,#e87c3e,#f5c88a);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerAnim 4s linear infinite;
        }
        .feat-fade { animation: featFade 3s ease forwards; }
        .glass-auth {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px) saturate(1.8);
          -webkit-backdrop-filter: blur(24px) saturate(1.8);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .tab-on {
          background: linear-gradient(135deg,rgba(192,57,43,0.35),rgba(212,124,42,0.25));
          border: 1px solid rgba(192,57,43,0.45) !important;
          color: #fcd5b0 !important;
        }
        .key-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #f5ede4;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .key-input::placeholder { color: rgba(245,237,228,0.35); }
        .key-input:focus {
          outline: none;
          border-color: rgba(192,57,43,0.6);
          box-shadow: 0 0 0 3px rgba(192,57,43,0.15);
        }
        .btn-fire {
          background: linear-gradient(135deg,#8b1a12 0%,#c0392b 45%,#e8622f 100%);
          box-shadow: 0 4px 20px rgba(192,57,43,0.4);
          transition: transform .15s, box-shadow .15s;
        }
        .btn-fire:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(192,57,43,0.55);
        }
        .btn-fire:active:not(:disabled) { transform: scale(0.97); }
        .btn-fire:disabled { opacity:0.6; cursor:not-allowed; }
        .dot-grid {
          background-image: radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>

      {/* Animated orbs */}
      <Orb cx="8%"  cy="15%" size={500} color="radial-gradient(circle,rgba(139,26,18,0.8),transparent 70%)"  delay={0}   duration={7} />
      <Orb cx="88%" cy="25%" size={400} color="radial-gradient(circle,rgba(212,124,42,0.6),transparent 70%)" delay={1.5} duration={9} />
      <Orb cx="50%" cy="85%" size={600} color="radial-gradient(circle,rgba(106,15,26,0.7),transparent 70%)"  delay={0.8} duration={8} />
      <Orb cx="75%" cy="70%" size={300} color="radial-gradient(circle,rgba(232,98,47,0.5),transparent 70%)"  delay={2}   duration={6} />
      {/* Dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none dot-grid" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-10 items-center justify-center login-wrap">

        {/* ── LEFT: Branding ── */}
        <div className="flex-1 text-center lg:text-left max-w-md">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#8b1a12,#c0392b,#e8622f)", boxShadow: "0 6px 20px rgba(192,57,43,0.5)" }}
            >
              <Logo />
            </div>
            <div>
              <p className="text-white font-bold text-2xl" style={{ fontFamily: "Georgia,serif" }}>Waypoint</p>
              <p className="text-[11px] font-mono tracking-widest" style={{ color: "rgba(245,200,150,0.6)" }}>AI LEARNING PLATFORM</p>
            </div>
          </div>

          {/* Hero headline */}
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: "Georgia,serif" }}>
            <span className="text-white">Your Personalized</span><br />
            <span className="shimmer-t">Learning Journey</span><br />
            <span className="text-white">Starts Here</span>
          </h1>

          <p className="text-base mb-10 leading-relaxed" style={{ color: "rgba(245,220,190,0.65)" }}>
            An AI-powered platform that crafts a custom learning roadmap from your skills, goals, and schedule — then guides you every step of the way.
          </p>

          {/* Rotating feature card */}
          <div
            className="rounded-2xl p-5 mb-8"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", minHeight: "96px" }}
          >
            <div key={currentFeature} className="feat-fade flex gap-4 items-start">
              <span className="text-3xl shrink-0">{feat.icon}</span>
              <div>
                <p className="font-semibold text-white mb-1">{feat.label}</p>
                <p className="text-sm" style={{ color: "rgba(245,220,190,0.6)" }}>{feat.desc}</p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-4">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentFeature(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === currentFeature ? "20px" : "6px", background: i === currentFeature ? "#e8622f" : "rgba(255,255,255,0.2)" }}
                />
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
            {["✨ Free to use", "🔒 No passwords", "🚀 Instant start"].map((b) => (
              <span key={b} className="text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(245,220,190,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Auth card ── */}
        <div className="w-full max-w-sm lg:max-w-[390px] glass-auth rounded-3xl p-8">
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            {(["guest", "login"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === t ? "tab-on" : ""}`}
                style={{ color: tab === t ? "#fcd5b0" : "rgba(245,220,190,0.45)", border: "1px solid transparent" }}
              >
                {t === "guest" ? "🚀 Quick Start" : "🔑 Sign In"}
              </button>
            ))}
          </div>

          {tab === "guest" ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1" style={{ fontFamily: "Georgia,serif" }}>Start Learning Now</h2>
                <p className="text-sm" style={{ color: "rgba(245,220,190,0.5)" }}>
                  Dive in instantly. A Learner Key is auto-generated so you can save and restore your progress anytime.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  "AI generates your personalized roadmap",
                  "Track progress across all courses",
                  "Earn XP, badges & certificates",
                  "Restore progress anytime with your key",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 text-[10px]"
                      style={{ background: "rgba(192,57,43,0.3)", color: "#f5a87c" }}>✓</span>
                    <span className="text-sm" style={{ color: "rgba(245,220,190,0.65)" }}>{item}</span>
                  </div>
                ))}
              </div>

              <button id="guest-start-btn" onClick={handleGuestStart} disabled={loading} className="btn-fire w-full py-3.5 rounded-xl text-white font-bold text-base">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Starting…</span>
                  : "Get Started Free →"
                }
              </button>

              <p className="text-[11px] text-center" style={{ color: "rgba(245,220,190,0.3)" }}>
                No account, no email, no password needed.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-white font-bold text-xl mb-1" style={{ fontFamily: "Georgia,serif" }}>Restore Your Session</h2>
                <p className="text-sm" style={{ color: "rgba(245,220,190,0.5)" }}>
                  Paste the Learner Key you saved earlier to continue right where you left off.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "rgba(245,220,190,0.45)" }}>
                  Your Learner Key
                </label>
                <textarea
                  id="login-key-input"
                  rows={3}
                  value={keyInput}
                  onChange={(e) => { setKeyInput(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleLogin(); } }}
                  placeholder="Paste your UUID key here…"
                  className="key-input w-full rounded-xl px-4 py-3 text-sm font-mono resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                  style={{ background: "rgba(169,50,38,0.2)", border: "1px solid rgba(169,50,38,0.4)", color: "#f5a0a0" }}>
                  ⚠ {error}
                </div>
              )}

              <button
                id="login-submit-btn"
                onClick={handleLogin}
                disabled={loading || !keyInput.trim()}
                className="btn-fire w-full py-3.5 rounded-xl text-white font-bold text-base"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Restoring…</span>
                  : "Restore Session →"
                }
              </button>

              <div className="rounded-xl p-4 space-y-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "rgba(245,220,190,0.35)" }}>
                  Where is my key?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(245,220,190,0.5)" }}>
                  Inside the app, click your avatar → <strong style={{ color: "rgba(245,220,190,0.75)" }}>Copy Learner Key</strong>. Save the UUID to restore on any device.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[11px] font-mono" style={{ color: "rgba(245,220,190,0.2)" }}>
          Waypoint — Amplified HCL submission · v4.0 · AI-Powered Personalized Learning
        </p>
      </div>
    </div>
  );
}
