"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };
type Profile = {
  goal: string | null;
  experienceLevel: string;
  interests: string[];
};

const STARTERS = [
  "I know basic Python and want to learn machine learning",
  "I'm new to programming and want to build websites",
  "I want to move from frontend into full-stack development",
  "I want to break into UX design with no experience",
];

/** Simple inline markdown renderer — handles bold, inline code, bullets, line breaks */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-4 space-y-0.5 my-1">
          {listItems.map((item, i) => (
            <li key={i}>{inlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function inlineMarkdown(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Bold **text** and inline `code`
    const pattern = /(\*\*(.+?)\*\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      if (match[0].startsWith("**")) {
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else {
        parts.push(
          <code key={match.index} className="mono text-[0.8em] px-1 py-0.5 rounded bg-[var(--panel-alt)] border border-[var(--border)]">
            {match[3]}
          </code>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    return parts;
  }

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      listItems.push(trimmed.slice(2));
    } else {
      flushList();
      if (trimmed === "") {
        if (i > 0 && lines[i - 1]?.trim() !== "") elements.push(<br key={`br-${i}`} />);
      } else {
        elements.push(<span key={`line-${i}`}>{inlineMarkdown(trimmed)}</span>);
        if (i < lines.length - 1 && lines[i + 1]?.trim() !== "") elements.push(<br key={`br2-${i}`} />);
      }
    }
  });

  flushList();
  return elements;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) setMessages(d.messages);
        else
          setMessages([
            {
              role: "assistant",
              content:
                "Hi — I'm here to map out a learning path for you. What are you trying to learn, and where are you starting from?",
            },
          ]);
      });
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-grow textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  async function send(text?: string) {
    const content = text ?? input;
    if (!content.trim() || loading) return;
    const userMsg: Message = { role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.profile) {
        setProfile({
          goal: data.profile.goal,
          experienceLevel: data.profile.experienceLevel,
          interests: data.profile.interests ?? [],
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const hasEnoughProfile = !!(profile?.goal && (profile?.interests?.length ?? 0) > 0);
  const isFreshChat = messages.length <= 1;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {isFreshChat && (
        <div className="mb-8 relative overflow-hidden rounded-xl px-8 py-10" style={{ background: "var(--gradient-hero)", border: "1px solid var(--border)" }}>
          <TrailBackdrop />
          <div className="relative">
            <p className="text-xs mono uppercase tracking-[0.2em] mb-3" style={{ color: "var(--accent)" }}>
              AI-Powered Learning Path Recommender
            </p>
            <h1 className="font-display text-3xl sm:text-4xl leading-tight max-w-lg mb-3">
              Tell me where you&apos;re headed. I&apos;ll map the route.
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              Describe your goal below — I&apos;ll build a prerequisite-ordered roadmap with real syllabi, graded
              assessments, and a dashboard that adapts as you go.
            </p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
      <section className="card flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`msg-in flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {m.role === "assistant" && <Avatar role="assistant" />}
              <div
                className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed"
                style={m.role === "user" ? {
                  background: "var(--gradient-accent)",
                  color: "white",
                  boxShadow: "0 3px 12px rgba(192,57,43,0.25)"
                } : {
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  backdropFilter: "blur(8px)"
                }}
              >
                {m.role === "assistant" ? renderMarkdown(m.content) : m.content}
              </div>
              {m.role === "user" && <Avatar role="user" />}
            </div>
          ))}
          {loading && (
            <div className="msg-in flex gap-2.5 justify-start">
              <Avatar role="assistant" />
              <div className="bg-[var(--panel-alt)] border border-[var(--border)] rounded-lg px-4 py-3 flex items-center gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {isFreshChat && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:scale-105 hover:shadow-md"
                style={{ background: "var(--panel-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--gradient-accent)";
                  (e.currentTarget as HTMLElement).style.color = "white";
                  (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--panel-alt)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  (e.currentTarget as HTMLElement).style.border = "1px solid var(--border)";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-[var(--border)] p-3 flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              className="w-full bg-[var(--panel-alt)] border border-[var(--border)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none overflow-hidden leading-relaxed"
              placeholder="e.g. I know basic Python and want to break into machine learning"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              style={{ minHeight: "38px", maxHeight: "120px" }}
            />
            {input.length > 0 && (
              <span className="absolute bottom-1.5 right-2 text-[10px] mono text-[var(--text-muted)] pointer-events-none">
                {input.length}
              </span>
            )}
          </div>
          <button
            onClick={() => send()}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 shrink-0 transition-all hover:scale-105 active:scale-95"
            style={{ background: "var(--gradient-accent)", color: "white", boxShadow: "0 3px 10px rgba(192,57,43,0.3)" }}
          >
            Send
          </button>
        </div>
      </section>

      <aside className="card p-5 space-y-4 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base">Field notes</h2>
          {profile?.goal && (
            <span className="text-[10px] mono text-[var(--accent-2)] bg-[var(--accent-2-soft)] px-2 py-0.5 rounded-full border border-[var(--accent-2)]/30">
              Live
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mono mb-1">GOAL</p>
          <p className="text-sm">{profile?.goal || "Not captured yet"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mono mb-1">LEVEL</p>
          <p className="text-sm capitalize">{profile?.experienceLevel || "beginner"}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mono mb-1">INTERESTS</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile?.interests?.length ? (
              profile.interests.map((t) => (
                <span key={t} className="tag-pill">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-sm text-[var(--text-muted)]">None yet</span>
            )}
          </div>
        </div>
        <button
          onClick={() => router.push("/roadmap")}
          disabled={!hasEnoughProfile}
          className="w-full mt-2 px-4 py-2.5 rounded-md border border-[var(--accent)] text-sm font-medium disabled:opacity-40 disabled:border-[var(--border)] disabled:text-[var(--text-muted)] hover:scale-[1.01] active:scale-[0.99] transition-all"
          style={hasEnoughProfile ? { background: "var(--gradient-accent)", color: "var(--panel)", border: "none" } : {}}
        >
          {hasEnoughProfile ? "Build my roadmap →" : "Tell me a bit more first"}
        </button>
      </aside>
      </div>
    </div>
  );
}

function TrailBackdrop() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.35] pointer-events-none"
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
    >
      <path
        d="M-10 140 C 60 100, 100 180, 170 110 S 280 40, 410 90"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="1 9"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="60" cy="112" r="3" fill="var(--accent-2)" />
      <circle cx="170" cy="110" r="3" fill="var(--accent)" />
      <circle cx="330" cy="55" r="3" fill="var(--accent-2)" />
    </svg>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  return (
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
      style={{ background: role === "assistant" ? "var(--gradient-accent)" : "var(--gradient-accent-2)" }}
    >
      {role === "assistant" ? "◆" : "Y"}
    </div>
  );
}
