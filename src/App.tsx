import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, ClipboardCheck, LogIn, LogOut, UserPlus, Users, Settings, BookOpenText, Sparkles, BarChart3, NotebookPen, ListChecks, Target } from "lucide-react";

/*************************
 * BRAND & THEME
 *************************/
const BRAND = {
  primary: "#7e0d9a", // purple
  accent: "#c9e265", // lime
  black: "#000000",
  white: "#ffffff",
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header
        className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60"
        style={{ borderColor: "#eee" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InfinityMark />
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: BRAND.primary }}>
                Beyond
              </h1>
              <p className="text-xs text-neutral-500">Design the life you want to live</p>
            </div>
          </div>
          <InstallHint />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-neutral-400">
        © {new Date().getFullYear()} Beyond • PWA
      </footer>
    </div>
  );
};

const InfinityMark: React.FC = () => {
  return (
    <div
      className="h-10 w-10 grid place-items-center rounded-full"
      style={{ background: BRAND.black }}
      aria-label="Infinity logo"
    >
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5c0-1.657 1.343-3 3-3 4.5 0 6.5 6 12 6 1.657 0 3-1.343 3-3s-1.343-3-3-3c-5.5 0-7.5 6-12 6-1.657 0-3-1.343-3-3Z" stroke={BRAND.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
};

/*************************
 * UTILITIES & STORAGE
 *************************/
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const storage = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(k: string, v: T) {
    localStorage.setItem(k, JSON.stringify(v));
  },
};

/*************************
 * AUTH (Preview-only)
 *************************/
interface User {
  id: string;
  name: string;
  role: "admin" | "member";
  cohort?: string;
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => storage.get<User | null>("beyond:user", null));

  const loginWithInvite = (invite: string, name: string) => {
    const role: User["role"] = invite?.toUpperCase().startsWith("ADMIN-") ? "admin" : "member";
    const parts = invite?.split("-") || [];
    const cohort = parts.length >= 2 ? parts[1] : "Alpha";
    const u: User = { id: crypto.randomUUID(), name: name || "Guest", role, cohort };
    setUser(u);
    storage.set("beyond:user", u);
  };
  const logout = () => {
    setUser(null);
    storage.set("beyond:user", null as any);
  };

  return { user, loginWithInvite, logout };
};

/*************************
 * APP NAV
 *************************/
const TABS = [
  { key: "daily", label: "Daily", icon: ListChecks },
  { key: "weekly", label: "Weekly", icon: CalendarDays },
  { key: "quarterly", label: "Quarterly", icon: BarChart3 },
  { key: "yearly", label: "Yearly", icon: Target },
  { key: "journal", label: "AI Journal", icon: NotebookPen },
  { key: "admin", label: "Admin", icon: Users },
  { key: "account", label: "Account", icon: Settings },
] as const;

type TabKey = typeof TABS[number]["key"];

/*************************
 * DAILY — Morning & Evening, Streaks
 *************************/
const DEFAULT_MORNING = [
  { id: "movement", label: "Movement", hint: "5–20 mins. Just get the blood flowing." },
  { id: "learning", label: "Learning", hint: "Read / listen / take notes." },
  { id: "meeting", label: "Meeting with myself", hint: "Plan the day in 5 mins." },
];

const DEFAULT_EVENING = [
  { id: "reflection", label: "End‑of‑Day Reflection", hint: "What worked? What will I change?" },
  { id: "gratitude", label: "Gratitude", hint: "3 things I’m grateful for." },
];

interface DailyEntry {
  date: string;
  morning: Record<string, boolean>;
  evening: Record<string, { done: boolean; note: string }>;
}

const useDaily = () => {
  const [entries, setEntries] = useState<Record<string, DailyEntry>>(() => storage.get("beyond:daily", {} as Record<string, DailyEntry>));

  const toggleMorning = (date: string, id: string) => {
    setEntries(prev => {
      const e = prev[date] || { date, morning: {}, evening: {} };
      const next = { ...prev, [date]: { ...e, morning: { ...e.morning, [id]: !e.morning[id] } } };
      storage.set("beyond:daily", next);
      return next;
    });
  };

  const setEvening = (date: string, id: string, done: boolean, note: string) => {
    setEntries(prev => {
      const e = prev[date] || { date, morning: {}, evening: {} };
      const next = { ...prev, [date]: { ...e, evening: { ...e.evening, [id]: { done, note } } } };
      storage.set("beyond:daily", next);
      return next;
    });
  };

  return { entries, toggleMorning, setEvening };
};

const computeStreak = (entries: Record<string, DailyEntry>): number => {
  const sortedKeys = Object.keys(entries).sort((a, b) => (a > b ? -1 : 1));
  if (!sortedKeys.length) return 0;
  let streak = 0;
  const today = new Date();

  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const e = entries[key];
    if (!e) break;

    const allMorning = DEFAULT_MORNING.every(m => e.morning[m.id]);
    if (allMorning) streak += 1; else break;
  }
  return streak;
};

/*************************
 * CEREMONIES (Weekly / Quarterly / Yearly)
 *************************/
interface CeremonyEntry {
  date: string; // ISO (yyyy-mm-dd)
  type: "planning" | "retro";
  scope: "weekly" | "quarterly" | "yearly";
  content: string;
}

const useCeremonies = () => {
  const [items, setItems] = useState<CeremonyEntry[]>(() => storage.get("beyond:ceremonies", [] as CeremonyEntry[]));
  const add = (x: CeremonyEntry) => {
    const next = [x, ...items];
    setItems(next);
    storage.set("beyond:ceremonies", next);
  };
  return { items, add };
};

/*************************
 * YEARLY GOALS
 *************************/
interface Goal { id: string; year: number; title: string; why: string; how: string; done: boolean; }
const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>(() => storage.get("beyond:goals", [] as Goal[]));
  const add = (g: Omit<Goal, "id" | "done">) => {
    const goal: Goal = { id: crypto.randomUUID(), done: false, ...g };
    const next = [goal, ...goals];
    setGoals(next);
    storage.set("beyond:goals", next);
  };
  const toggle = (id: string) => {
    const next = goals.map(g => (g.id === id ? { ...g, done: !g.done } : g));
    setGoals(next); storage.set("beyond:goals", next);
  };
  return { goals, add, toggle };
};

/*************************
 * JOURNAL (single context window)
 *************************/
interface JournalEntry { id: string; date: string; text: string; reply?: string }
const useJournal = () => {
  const [j, setJ] = useState<JournalEntry[]>(() => storage.get("beyond:journal", [] as JournalEntry[]));
  const add = (text: string) => {
    const entry: JournalEntry = { id: crypto.randomUUID(), date: todayKey(), text, reply: mockCoach(text) };
    const next = [entry, ...j];
    setJ(next); storage.set("beyond:journal", next);
  };
  return { entries: j, add };
};

const mockCoach = (text: string) => {
  const prompts = [
    "If this goes well, what will be the first small sign you notice?",
    "Name one obstacle you can remove in the next 24 hours.",
    "On a scale of 1–10, how important is this? What would move it +1?",
    "What would ‘good enough’ look like this week?",
    "Who can you ask for help, and what exactly will you ask?",
  ];
  let h = 0; for (let i=0;i<text.length;i++) h = (h<<5)-h+text.charCodeAt(i);
  const i = Math.abs(h) % prompts.length;
  return prompts[i];
};

/*************************
 * ADMIN (Preview)
 *************************/
interface CohortUser { id: string; name: string; cohort: string; lastActive: string }
const useAdmin = () => {
  const [cohorts, setCohorts] = useState<string[]>(() => storage.get("beyond:cohorts", ["Alpha", "Beta"]))
  const [users, setUsers] = useState<CohortUser[]>(() => storage.get("beyond:cohortUsers", [] as CohortUser[]));

  const createInvite = (role: "admin" | "member", cohort: string) => {
    const code = `${role.toUpperCase()}-${cohort}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return `beyond://invite/${code}`;
  };
  const addCohort = (name: string) => {
    const next = Array.from(new Set([...cohorts, name]));
    setCohorts(next); storage.set("beyond:cohorts", next);
  };
  const seedUser = (name: string, cohort: string) => {
    const u: CohortUser = { id: crypto.randomUUID(), name, cohort, lastActive: todayKey() };
    const next = [u, ...users];
    setUsers(next); storage.set("beyond:cohortUsers", next);
  };
  return { cohorts, addCohort, users, seedUser, createInvite };
};

/*************************
 * COMPONENTS
 *************************/
const Pill: React.FC<{ children: React.ReactNode; tone?: "primary" | "accent" | "neutral" }>= ({ children, tone = "neutral" }) => {
  const bg = tone === "primary" ? BRAND.primary : tone === "accent" ? BRAND.accent : "#f4f4f5";
  const fg = tone === "neutral" ? "#111" : BRAND.black;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
};

const SectionCard: React.FC<{ title: string; subtitle?: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }>= ({ title, subtitle, icon, right, children }) => (
  <div className="rounded-2xl border p-4 md:p-6 shadow-sm bg-white" style={{ borderColor: "#eee" }}>
    <div className="flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="text-base md:text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

const TopTabs: React.FC<{ active: TabKey; onChange: (k: TabKey) => void }>= ({ active, onChange }) => {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {TABS.map(t => {
        const ActiveIcon = t.icon as any;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${isActive ? "shadow" : ""}`}
            style={{
              borderColor: isActive ? BRAND.primary : "#e9e9e9",
              background: isActive ? BRAND.accent : "#fff",
              color: isActive ? BRAND.black : BRAND.primary,
            }}
          >
            <ActiveIcon size={16} />
            {t.label}
          </button>
        );
      })}
    </nav>
  );
};

const InstallHint: React.FC = () => {
  const [isStandalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  }, []);
  if (isStandalone) return null;
  return (
    <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500">
      <Sparkles size={14} /> Add to Home Screen for full PWA feel
    </div>
  );
};

/*************************
 * VIEWS
 *************************/
const DailyView: React.FC = () => {
  const [date, setDate] = useState(todayKey());
  const { entries, toggleMorning, setEvening } = useDaily();
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const entry = entries[date] || { date, morning: {}, evening: {} };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <input
          type="date"
          className="rounded-xl border px-3 py-2 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ borderColor: "#e9e9e9" }}
        />
        <Pill tone="primary">Streak: {streak} days</Pill>
      </div>

      <SectionCard title="Morning Routine" subtitle="Tick your non‑negotiables" icon={<CheckCircle2 style={{ color: BRAND.primary }} />}>
        <div className="grid gap-3">
          {DEFAULT_MORNING.map(m => (
            <label key={m.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={!!entry.morning[m.id]}
                onChange={() => toggleMorning(date, m.id)}
                className="mt-1 h-4 w-4"
              />
              <div>
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-neutral-500">{m.hint}</div>
              </div>
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Evening Routine" subtitle="Close the loop" icon={<ClipboardCheck style={{ color: BRAND.primary }} />}>
        <div className="grid gap-4">
          {DEFAULT_EVENING.map(ev => (
            <div key={ev.id} className="grid gap-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={!!entry.evening[ev.id]?.done}
                  onChange={(e) => setEvening(date, ev.id, e.target.checked, entry.evening[ev.id]?.note || "")}
                  className="h-4 w-4"
                />
                {ev.label}
              </label>
              <textarea
                placeholder={ev.hint}
                value={entry.evening[ev.id]?.note || ""}
                onChange={(e) => setEvening(date, ev.id, !!entry.evening[ev.id]?.done, e.target.value)}
                className="w-full rounded-xl border p-3 text-sm"
                style={{ borderColor: "#e9e9e9" }}
                rows={3}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Days" subtitle="Jump back to review" icon={<CalendarDays style={{ color: BRAND.primary }} /> }>
        <RecentDates onPick={setDate} current={date} />
      </SectionCard>
    </div>
  );
};

const RecentDates: React.FC<{ onPick: (d: string) => void; current: string }> = ({ onPick, current }) => {
  const days = Array.from({length: 14}).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  return (
    <div className="flex flex-wrap gap-2">
      {days.map(d => (
        <button
          key={d}
          onClick={() => onPick(d)}
          className={`rounded-full border px-3 py-1.5 text-xs ${current === d ? "font-semibold" : ""}`}
          style={{ borderColor: current === d ? BRAND.primary : "#e9e9e9", background: current === d ? BRAND.accent : "#fff" }}
        >
          {d}
        </button>
      ))}
    </div>
  );
};

const CeremonyView: React.FC<{ scope: "weekly" | "quarterly" | "yearly"; scheduleHint: string; extras?: React.ReactNode }>= ({ scope, scheduleHint, extras }) => {
  const [subtab, setSubtab] = useState<"planning" | "retro">("planning");
  const [date, setDate] = useState(todayKey());
  const [text, setText] = useState("");
  const { items, add } = useCeremonies();

  const filtered = items.filter(i => i.scope === scope);
  const onSave = () => {
    if (!text.trim()) return;
    add({ date, type: subtab, scope, content: text.trim() });
    setText("");
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubtab("planning")}
            className={`rounded-full border px-3 py-1.5 text-sm ${subtab === "planning" ? "font-semibold" : ""}`}
            style={{ borderColor: subtab === "planning" ? BRAND.primary : "#e9e9e9", background: subtab === "planning" ? BRAND.accent : "#fff" }}
          >
            Planning
          </button>
          <button
            onClick={() => setSubtab("retro")}
            className={`rounded-full border px-3 py-1.5 text-sm ${subtab === "retro" ? "font-semibold" : ""}`}
            style={{ borderColor: subtab === "retro" ? BRAND.primary : "#e9e9e9", background: subtab === "retro" ? BRAND.accent : "#fff" }}
          >
            Retro
          </button>
        </div>
        <Pill tone="neutral">{scheduleHint}</Pill>
      </div>

      <SectionCard title={`${capitalize(scope)} ${capitalize(subtab)}`} subtitle="Coach‑style prompts to guide you">
        <div className="grid gap-3">
          <PromptHints scope={scope} type={subtab} />
          <div className="flex items-center gap-3 flex-wrap">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
            <button onClick={onSave} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.primary, color: BRAND.white }}>Save</button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your plan or retro here…"
            className="w-full rounded-xl border p-3 text-sm"
            rows={6}
            style={{ borderColor: "#e9e9e9" }}
          />
        </div>
      </SectionCard>

      {extras}

      <SectionCard title="History" subtitle="Your saved entries">
        <div className="grid gap-4">
          {filtered.length === 0 && <p className="text-sm text-neutral-500">No entries yet.</p>}
          {filtered.map((x, idx) => (
            <div key={idx} className="rounded-xl border p-3" style={{ borderColor: "#eee" }}>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-500">
                <span>{x.date}</span>
                <span className="uppercase tracking-wide">{x.type}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{x.content}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

const PromptHints: React.FC<{ scope: "weekly" | "quarterly" | "yearly"; type: "planning" | "retro" }> = ({ scope, type }) => {
  const list = useMemo(() => {
    if (scope === "weekly" && type === "planning") return [
      "What 1–3 moves will advance my yearly goals this week?",
      "What must be true by Sunday to call this week a win?",
      "What will I deliberately say ‘no’ to?",
    ];
    if (scope === "weekly" && type === "retro") return [
      "What worked? What didn’t?",
      "What will I do differently next week?",
      "What did I learn about myself?",
    ];
    if (scope === "quarterly" && type === "planning") return [
      "Which yearly goal gets the most leverage this quarter?",
      "What milestones will prove progress in 13 weeks?",
      "What risks should I pre‑empt?",
    ];
    if (scope === "quarterly" && type === "retro") return [
      "Which bets paid off? Which did not—and why?",
      "What will I double down on for next quarter?",
      "What did I unlearn?",
    ];
    if (scope === "yearly" && type === "planning") return [
      "My 3–5 tangible goals for the year are…",
      "Why do these matter now?",
      "What capabilities and relationships will I build?",
    ];
    return [
      "What am I proud of this year?",
      "What will I leave behind?",
      "What identity shift is emerging?",
    ];
  }, [scope, type]);

  return (
    <ul className="grid gap-1">
      {list.map((x, i) => (
        <li key={i} className="text-sm text-neutral-700">• {x}</li>
      ))}
    </ul>
  );
};

const BucketlistCard: React.FC = () => {
  const [items, setItems] = useState<string[]>(() => storage.get("beyond:bucketlist", [] as string[]));
  const [t, setT] = useState("");
  const add = () => { if (!t.trim()) return; const next = [t.trim(), ...items]; setItems(next); storage.set("beyond:bucketlist", next); setT(""); };
  return (
    <SectionCard title="Bucketlist" subtitle="Plant seeds for future adventures" icon={<Sparkles style={{ color: BRAND.primary }} />}> 
      <div className="flex gap-2">
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a bucketlist item…" className="flex-1 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
        <button onClick={add} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.accent, color: BRAND.black }}>Add</button>
      </div>
      <ul className="mt-3 grid gap-2">
        {items.map((x, i) => (
          <li key={i} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#eee" }}>{x}</li>
        ))}
      </ul>
    </SectionCard>
  );
};

const YearlyView: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [how, setHow] = useState("");
  const { goals, add, toggle } = useGoals();

  const onAdd = () => {
    if (!title.trim()) return;
    add({ year, title: title.trim(), why: why.trim(), how: how.trim() });
    setTitle(""); setWhy(""); setHow("");
  };

  return (
    <div className="grid gap-6">
      <SectionCard title="3–5 Yearly Goals" subtitle="Make them tangible and tractable" icon={<Target style={{ color: BRAND.primary }} /> }>
        <div className="grid gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value || `${new Date().getFullYear()}`))} className="rounded-xl border px-3 py-2 text-sm w-28" style={{ borderColor: "#e9e9e9" }} />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title (e.g., Ship my PWA)" className="flex-1 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
          </div>
          <input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Why this matters now" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
          <textarea value={how} onChange={(e) => setHow(e.target.value)} placeholder="How I will make it happen (capabilities, milestones, people)" className="rounded-xl border p-3 text-sm" rows={4} style={{ borderColor: "#e9e9e9" }} />
          <button onClick={onAdd} className="rounded-xl px-4 py-2 text-sm font-semibold self-start" style={{ background: BRAND.primary, color: BRAND.white }}>Add Goal</button>
        </div>
      </SectionCard>

      <SectionCard title="Goals" subtitle="Click to mark done">
        <div className="grid gap-3">
          {goals.filter(g => g.year === year).length === 0 && <p className="text-sm text-neutral-500">No goals for {year} yet.</p>}
          {goals.filter(g => g.year === year).map(g => (
            <button key={g.id} onClick={() => toggle(g.id)} className="text-left rounded-xl border p-3" style={{ borderColor: "#eee", background: g.done ? BRAND.accent : "#fff" }}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{g.title}</span>
                <span className="text-xs">{g.done ? "Done" : "Active"}</span>
              </div>
              {(g.why || g.how) && (
                <div className="mt-1 text-xs text-neutral-600">
                  {g.why && <div><span className="font-semibold">Why:</span> {g.why}</div>}
                  {g.how && <div><span className="font-semibold">How:</span> {g.how}</div>}
                </div>
              )}
            </button>
          ))}
        </div>
      </SectionCard>

      <CeremonyView scope="yearly" scheduleHint="Year is enough: 2025, 2026…" />
    </div>
  );
};

const JournalView: React.FC = () => {
  const { entries, add } = useJournal();
  const [text, setText] = useState("");

  const submit = () => { if (!text.trim()) return; add(text.trim()); setText(""); };

  return (
    <div className="grid gap-6">
      <SectionCard title="How can I help you today?" subtitle="Single context window — a sounding board" icon={<BookOpenText style={{ color: BRAND.primary }} /> }>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question, think out loud, or journal…" className="w-full rounded-xl border p-3 text-sm" rows={5} style={{ borderColor: "#e9e9e9" }} />
        <div className="mt-3 flex items-center gap-2">
          <button onClick={submit} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.primary, color: BRAND.white }}>Save Entry</button>
          <Pill tone="accent">Private</Pill>
        </div>
      </SectionCard>

      <SectionCard title="Entries" subtitle="Newest first">
        <div className="grid gap-3">
          {entries.length === 0 && <p className="text-sm text-neutral-500">No entries yet.</p>}
          {entries.map(e => (
            <div key={e.id} className="rounded-xl border p-3" style={{ borderColor: "#eee" }}>
              <div className="mb-1 text-xs text-neutral-500">{e.date}</div>
              <div className="whitespace-pre-wrap text-sm mb-2">{e.text}</div>
              {e.reply && (
                <div className="rounded-xl border p-3 text-sm" style={{ borderColor: BRAND.primary, background: "#faf5ff" }}>
                  <span className="font-semibold" style={{ color: BRAND.primary }}>Coach:</span> {e.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

const AdminView: React.FC<{ user: User | null }> = ({ user }) => {
  const { cohorts, addCohort, users, seedUser, createInvite } = useAdmin();
  const [newCohort, setNewCohort] = useState("");
  const [inviteCohort, setInviteCohort] = useState(cohorts[0] || "Alpha");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [invite, setInvite] = useState<string | null>(null);

  const generate = () => { const code = createInvite(inviteRole, inviteCohort); setInvite(code); };

  if (!user || user.role !== "admin") {
    return (
      <div className="rounded-2xl border p-6 text-sm" style={{ borderColor: "#eee" }}>
        <p className="mb-2">Admin area is restricted. Log in with an admin invite to manage cohorts.</p>
        <p className="text-neutral-500">Preview tip: Use an invite code starting with <b>ADMIN-</b> to unlock admin mode.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="Cohorts" subtitle="Create and view cohorts" icon={<Users style={{ color: BRAND.primary }} /> }>
        <div className="flex gap-2 flex-wrap">
          <input value={newCohort} onChange={(e) => setNewCohort(e.target.value)} placeholder="New cohort name" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
          <button onClick={() => { if (!newCohort.trim()) return; addCohort(newCohort.trim()); setNewCohort(""); }} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.accent, color: BRAND.black }}>Add Cohort</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cohorts.map((c, i) => (
            <Pill key={i} tone="primary">{c}</Pill>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Invite Links" subtitle="Invitation‑only access" icon={<UserPlus style={{ color: BRAND.primary }} /> }>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={inviteCohort} onChange={(e) => setInviteCohort(e.target.value)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }}>
            {cohorts.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={generate} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.primary, color: BRAND.white }}>Generate</button>
        </div>
        {invite && (
          <div className="mt-3 rounded-xl border p-3 text-xs" style={{ borderColor: "#eee", background: "#fafafa" }}>
            {invite}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Preview Users" subtitle="Seed fake users for the preview" icon={<Users style={{ color: BRAND.primary }} /> }>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => seedUser("Alex", "Alpha")} className="rounded-xl px-3 py-2 text-sm" style={{ background: BRAND.accent, color: BRAND.black }}>Seed Alex</button>
          <button onClick={() => seedUser("Bea", "Alpha")} className="rounded-xl px-3 py-2 text-sm" style={{ background: BRAND.accent, color: BRAND.black }}>Seed Bea</button>
          <button onClick={() => seedUser("Carlos", "Beta")} className="rounded-xl px-3 py-2 text-sm" style={{ background: BRAND.accent, color: BRAND.black }}>Seed Carlos</button>
        </div>
        <div className="mt-3 grid gap-2">
          {users.length === 0 && <p className="text-sm text-neutral-500">No users yet. Seed some for the preview.</p>}
          {users.map(u => (
            <div key={u.id} className="rounded-xl border p-3 flex items-center justify-between text-sm" style={{ borderColor: "#eee" }}>
              <div className="flex items-center gap-2"><Pill tone="primary">{u.cohort}</Pill><span className="font-medium">{u.name}</span></div>
              <div className="text-xs text-neutral-500">Last active: {u.lastActive}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

const AccountView: React.FC<{ user: User | null; onLogin: (code: string, name: string) => void; onLogout: () => void }> = ({ user, onLogin, onLogout }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (user) {
    return (
      <div className="grid gap-6">
        <SectionCard title="Profile" subtitle="Your account" icon={<Settings style={{ color: BRAND.primary }} /> }>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{user.name}</div>
              <div className="text-sm text-neutral-500">Role: {user.role} • Cohort: {user.cohort || "–"}</div>
            </div>
            <button onClick={onLogout} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.black, color: BRAND.white }}>
              <LogOut className="inline-block mr-1" size={16}/> Sign out
            </button>
          </div>
        </SectionCard>
        <SectionCard title="PWA Status">
          <p className="text-sm text-neutral-600">Install on your phone via browser menu → Add to Home Screen.</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="Invitation‑only Access" subtitle="Use your invite link/code" icon={<LogIn style={{ color: BRAND.primary }} /> }>
        <div className="grid gap-3 max-w-md">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste invite code (e.g., ADMIN-Alpha-XXXXXX)" className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#e9e9e9" }} />
          <button onClick={() => onLogin(code, name)} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: BRAND.primary, color: BRAND.white }}>
            <LogIn className="inline-block mr-1" size={16}/> Continue
          </button>
          <p className="text-xs text-neutral-500">Preview tip: Use an invite code that starts with <b>ADMIN-</b> to see the Admin tab capabilities.</p>
        </div>
      </SectionCard>
    </div>
  );
};

/*************************
 * ROOT APP
 *************************/
export default function App() {
  const { user, loginWithInvite, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("daily");

  useEffect(() => { if (!user) setTab("account"); }, [user]);

  return (
    <AppShell>
      <div className="mb-6">
        <TopTabs active={tab} onChange={setTab} />
      </div>

      {tab === "daily" && <DailyView />}
      {tab === "weekly" && <CeremonyView scope="weekly" scheduleHint="Scheduled every Sunday" />}
      {tab === "quarterly" && <CeremonyView scope="quarterly" scheduleHint="Every 13 weeks" extras={<BucketlistCard />} />}
      {tab === "yearly" && <YearlyView />}
      {tab === "journal" && <JournalView />}
      {tab === "admin" && <AdminView user={user} />}
      {tab === "account" && <AccountView user={user} onLogin={loginWithInvite} onLogout={logout} />}
    </AppShell>
  );
}

/*************************
 * HELPERS
 *************************/
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
