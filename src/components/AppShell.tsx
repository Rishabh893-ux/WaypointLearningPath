"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { useToast } from "@/components/ToastProvider";

function ChatIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16v11H8l-4 4V5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BookIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 0 4 23V5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 3h5.5A2.5 2.5 0 0 1 20 5.5V21a2.5 2.5 0 0 0-2.5-2.5H12" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function MapIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21c4-4.5 7-8.2 7-11.5A7 7 0 0 0 5 9.5C5 12.8 8 16.5 12 21Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="9.5" r="2.2" fill="currentColor" />
    </svg>
  );
}
function GridIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function BrainIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="9" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="15" r="4.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function TrophyIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 14v3m-3 3h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function RibbonIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12.5 7 21l5-3 5 3-2-8.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function UserIcon(p: { className?: string }) {
  return (
    <svg className={p.className} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 20c1.4-3.8 4.4-6 7.5-6s6.1 2.2 7.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/", label: "Chat", icon: ChatIcon },
  { href: "/courses", label: "Courses", icon: BookIcon },
  { href: "/roadmap", label: "Roadmap", icon: MapIcon },
  { href: "/skills", label: "Skills", icon: BrainIcon },
  { href: "/achievements", label: "Achievements", icon: TrophyIcon },
  { href: "/certificate", label: "Certificate", icon: RibbonIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

/** Deterministic gradient from name string */
function nameToGradient(name: string | null): string {
  if (!name) return "linear-gradient(135deg, #8b4513, #2a6048)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 60) % 360;
  return `linear-gradient(135deg, hsl(${h1},55%,48%), hsl(${h2},60%,40%))`;
}



export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gami, setGami] = useState<{ level: number; streakCount: number } | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);

  // Auth and modal states
  const [showMenu, setShowMenu] = useState(false);
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [learnerId, setLearnerId] = useState("");
  const [loginKeyInput, setLoginKeyInput] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((d) => setGami({ level: d.level, streakCount: d.streakCount }))
      .catch(() => {});
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfileName(d?.name ?? null))
      .catch(() => {});
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setLearnerId(d.learnerId || ""))
      .catch(() => {});
  }, []);

  async function handleLogin() {
    const cleanKey = loginKeyInput.trim();
    if (!cleanKey) {
      showToast("Please enter a Learner Key", "error");
      return;
    }
    if (cleanKey.length < 10) {
      showToast("Learner Key is too short or invalid", "error");
      return;
    }
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", learnerId: cleanKey }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Logged in successfully! Reloading path...", "success");
        setShowLoginModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        showToast(data.error || "Login failed", "error");
      }
    } catch {
      showToast("Connection to login server failed", "error");
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (res.ok) {
        showToast("Logged out! Starting new session...", "success");
        setShowLoginModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        showToast("Logout failed", "error");
      }
    } catch {
      showToast("Connection to logout server failed", "error");
    }
  }

  function handleCopyKey() {
    if (!learnerId) return;
    navigator.clipboard.writeText(learnerId);
    showToast("Learner Key copied to clipboard!", "success");
  }

  const initials = profileName
    ? profileName
        .split(" ")
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
    : "W";

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              active ? "nav-active-neon" : "hover:bg-white/10"
            }`}
            style={{
              color: active ? "#f8c4a0" : "#d8c0b4",
              background: active ? "rgba(192, 57, 43, 0.30)" : "transparent",
              fontWeight: active ? 600 : 400,
            }}
          >
            <Icon className="shrink-0" />
            {item.label}
            {active && (
              <span
                className="ml-auto w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] sticky top-0 z-20"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <Link href="/" className="flex items-center gap-2 font-display text-lg">
          <Logo />
          Waypoint
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            className="w-8 h-8 rounded-md border border-[var(--border)] flex items-center justify-center"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-b border-[var(--border)] sticky top-[53px] z-20" style={{ background: "var(--sidebar-bg)" }}>
          <nav className="flex flex-col p-3 gap-1">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-[var(--border)] sticky top-0 h-screen"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div className="px-5 py-5 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Logo />
          <span className="font-display text-lg" style={{ color: '#f5ede4' }}>Waypoint</span>
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: '#c8a898' }}>v4.0</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Gradient avatar + name in sidebar footer */}
        <div className="px-4 py-4 flex items-center gap-3 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            onClick={() => setShowSidebarMenu(!showSidebarMenu)}
            className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:scale-105 transition-transform"
            style={{ background: nameToGradient(profileName) }}
          >
            {initials}
          </div>
          <div
            onClick={() => setShowSidebarMenu(!showSidebarMenu)}
            className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <p className="text-xs font-medium truncate" style={{ color: '#f0e0d4' }}>{profileName || "Guest"}</p>
            <p className="text-[10px] mono truncate" style={{ color: '#a08070' }}>Amplified HCL — click to manage</p>
          </div>

          {showSidebarMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSidebarMenu(false)} />
              <div className="absolute left-4 bottom-14 w-52 rounded-md shadow-lg bg-[var(--panel)] border border-[var(--border)] py-1.5 z-50 animate-[fadeIn_0.15s_ease] text-left">
                <div className="px-4 py-2 border-b border-[var(--border)] text-[10px] mono text-[var(--text-muted)]">
                  {profileName ? profileName : "Waypoint Guest"}
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowSidebarMenu(false)}
                  className="block px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-alt)] transition-colors"
                >
                  Profile & Settings
                </Link>
                <button
                  onClick={() => {
                    setShowSidebarMenu(false);
                    setShowLoginModal(true);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-alt)] transition-colors"
                >
                  Log In / Switch Key
                </button>
                <button
                  onClick={() => {
                    setShowSidebarMenu(false);
                    handleCopyKey();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-alt)] transition-colors"
                >
                  Copy Learner Key
                </button>
                <button
                  onClick={() => {
                    setShowSidebarMenu(false);
                    if (confirm("Log out? Any unsaved progress will be lost unless you save your Learner Key.")) {
                      handleLogout();
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--panel-alt)] transition-colors"
                >
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="hidden md:flex items-center justify-end gap-3 px-6 py-3 border-b border-[var(--border)] sticky top-0 z-40 backdrop-blur glass"
          style={{ background: "color-mix(in srgb, var(--panel) 85%, transparent)" }}
        >
          {gami && (
            <Link href="/achievements" className="tag-pill hover:border-[var(--accent)] transition-colors flex items-center gap-1.5">
              <span style={{ color: "var(--accent)" }}>Lv.{gami.level}</span>
              {gami.streakCount > 0 && (
                <span>
                  <span className="flame-anim">🔥</span>
                  {gami.streakCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="tag-pill hover:border-[var(--accent)] transition-colors"
            title="Search (Cmd+K)"
          >
            ⌘K
          </button>
          <NotificationBell />
          <ThemeToggle />
          
          {/* Header avatar dropdown */}
          <div className="relative">
            <div
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:scale-105 transition-transform"
              style={{ background: nameToGradient(profileName) }}
              title={profileName || "Profile Options"}
            >
              {initials}
            </div>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 rounded-md shadow-lg bg-[var(--panel)] border border-[var(--border)] py-1.5 z-50 animate-[fadeIn_0.15s_ease] text-left">
                  <div className="px-4 py-2 border-b border-[var(--border)] text-[10px] mono text-[var(--text-muted)]">
                    {profileName ? profileName : "Waypoint Guest"}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowMenu(false)}
                    className="block px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-alt)] transition-colors"
                  >
                    Profile & Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowLoginModal(true);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-alt)] transition-colors"
                  >
                    Log In / Switch Key
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleCopyKey();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--panel-alt)] transition-colors"
                  >
                    Copy Learner Key
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (confirm("Log out? Any local progress will be lost unless you save your Learner Key.")) {
                        handleLogout();
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-[var(--danger)] hover:bg-[var(--panel-alt)] transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <main className="flex-1">{children}</main>
        
        <footer className="border-t border-[var(--border)] py-6 text-center text-xs text-[var(--text-muted)] mono">
          AI-Powered Personalized Learning Path Recommender — Amplified HCL submission — v4.0
        </footer>
      </div>

      {/* Account Settings / Key Restore Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
          <div className="card max-w-md w-full p-6 space-y-4 m-4 relative animate-[pageFade_0.25s_ease]">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              ✕
            </button>
            <h3 className="font-display text-lg">Manage Account Key</h3>

            <div className="space-y-1">
              <label className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider block">
                Your Current Learner Key
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={learnerId}
                  className="flex-1 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs outline-none select-all font-mono"
                />
                <button
                  onClick={handleCopyKey}
                  className="px-3 py-1.5 rounded-md text-xs border border-[var(--border)] hover:border-[var(--accent)] font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                Copy this key to save your progress. You can use it to log in on any device.
              </p>
            </div>

            <div className="border-t border-[var(--border)] pt-4 space-y-2">
              <label className="text-[10px] mono text-[var(--text-muted)] uppercase tracking-wider block">
                Log In with Key / Switch Profile
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Learner Key UUID here"
                  value={loginKeyInput}
                  onChange={(e) => setLoginKeyInput(e.target.value)}
                  className="flex-1 bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs outline-none focus:border-[var(--accent)] font-mono"
                />
                <button
                  onClick={handleLogin}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.97]"
                  style={{ background: "var(--gradient-accent)" }}
                >
                  Log In
                </button>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 flex justify-between gap-4">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to log out and start a fresh session? Any local data will be lost unless you saved your current key.")) {
                    handleLogout();
                  }
                }}
                className="px-4 py-2 rounded-md text-xs font-semibold text-white bg-[var(--danger)] hover:opacity-90 transition-transform active:scale-[0.97]"
              >
                Log Out / Reset
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 rounded-md text-xs border border-[var(--border)] hover:bg-[var(--panel-alt)] font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
