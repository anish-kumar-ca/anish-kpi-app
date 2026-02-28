import { useState, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { ref, set, get } from "firebase/database";

// ─── KPI FRAMEWORK ────────────────────────────────────────────────────────────
const GOALS = [
  {
    id: "pr",
    title: "Canadian PR",
    subtitle: "Permanent Residency Journey",
    emoji: "🍁",
    color: "#c8a96e",
    colorDim: "rgba(200,169,110,0.12)",
    weight: 25,
    metrics: [
      { id: "studyHrs",    label: "CELPIP Study Hours",        unit: "hrs", target: 10,  type: "number", tip: "10 hrs/week = exam-ready in 8 weeks" },
      { id: "practiceTests",label: "Practice Tests Completed", unit: "",    target: 1,   type: "number", tip: "1 full test/week minimum" },
      { id: "docsDone",    label: "Documents Gathered",        unit: "%",   target: 100, type: "number", tip: "Track % of checklist complete" },
      { id: "crsScore",    label: "CRS Score (current)",       unit: "pts", target: 480, type: "number", tip: "Lagging indicator — update when known", lagging: true },
    ],
    milestones: [
      { id: "celpipBooked",  label: "CELPIP Exam Booked" },
      { id: "celpipDone",    label: "CELPIP Score Received" },
      { id: "eeProfile",     label: "Express Entry Profile Created" },
      { id: "itaReceived",   label: "ITA Received" },
    ]
  },
  {
    id: "business",
    title: "Business & Income",
    subtitle: "Build Revenue · Grow Wealth",
    emoji: "🏗️",
    color: "#9b5de5",
    colorDim: "rgba(155,93,229,0.12)",
    weight: 25,
    metrics: [
      { id: "bizHours",      label: "Hours on Business",          unit: "hrs", target: 15,  type: "number", tip: "15 focused hrs/week is the minimum viable threshold" },
      { id: "revenueActions",label: "Revenue Actions (outreach/proposals)", unit: "",  target: 10, type: "number", tip: "Calls, proposals, pitches, DMs with intent" },
      { id: "contentSessions",label: "Build Sessions (product/content)", unit: "",  target: 3,  type: "number", tip: "Deep work sessions creating the actual thing" },
      { id: "monthlyRevenue",label: "Monthly Revenue",            unit: "CAD", target: 5000, type: "number", tip: "Lagging — update monthly, track trend", lagging: true },
    ],
    milestones: [
      { id: "bizIdea",       label: "Core Business Model Defined" },
      { id: "firstClient",   label: "First Paying Client/Sale" },
      { id: "rev1k",         label: "First $1K Month" },
      { id: "rev5k",         label: "First $5K Month" },
    ]
  },
  {
    id: "investments",
    title: "Investment Portfolio",
    subtitle: "Build Wealth · Let Money Work",
    emoji: "📈",
    color: "#f4a261",
    colorDim: "rgba(244,162,97,0.12)",
    weight: 20,
    metrics: [
      { id: "sipDone",       label: "SIP / Contribution Made",    unit: "%",   target: 100, type: "number", tip: "100% = done this week, 0 = missed" },
      { id: "researchHrs",   label: "Research / Learning Hours",  unit: "hrs", target: 2,   type: "number", tip: "Reading, analysing, staying sharp" },
      { id: "savingsInvested",label: "% Income Invested",         unit: "%",   target: 20,  type: "number", tip: "20% minimum of income into assets" },
      { id: "portfolioValue",label: "Portfolio Value",            unit: "CAD", target: 50000, type: "number", tip: "Lagging — update monthly", lagging: true },
    ],
    milestones: [
      { id: "inv10k",        label: "Portfolio Crosses $10K" },
      { id: "inv50k",        label: "Portfolio Crosses $50K" },
      { id: "car",           label: "Car Purchase Saved & Bought" },
      { id: "emergencyFund", label: "6-Month Emergency Fund Built" },
    ]
  },
  {
    id: "finance",
    title: "Finance & Expenses",
    subtitle: "Know Where Every Dollar Goes",
    emoji: "💰",
    color: "#f25c54",
    colorDim: "rgba(242,92,84,0.12)",
    weight: 15,
    metrics: [
      { id: "budgetAdherence",label: "Budget Adherence",          unit: "%",   target: 90,  type: "number", tip: "Stayed within planned budget across categories" },
      { id: "expensesLogged", label: "Expenses Logged (days)",    unit: "/7",  target: 7,   type: "number", tip: "Days you logged every expense this week" },
      { id: "impulseSpend",   label: "Unplanned Expenses",        unit: "CAD", target: 0,   type: "number", tip: "Lower is better. Target is $0 impulse", reverse: true },
      { id: "savingsRate",    label: "Savings Rate",              unit: "%",   target: 25,  type: "number", tip: "Lagging — (income - expenses) / income", lagging: true },
    ],
    milestones: [
      { id: "budget0",       label: "First Month Zero Impulse Spend" },
      { id: "debt0",         label: "All Debt Cleared" },
      { id: "netPos",        label: "Positive Net Worth Milestone" },
    ]
  },
  {
    id: "health",
    title: "Health & Body",
    subtitle: "Best Shape of Your Life",
    emoji: "🧬",
    color: "#a8e063",
    colorDim: "rgba(168,224,99,0.12)",
    weight: 15,
    metrics: [
      { id: "workouts",      label: "Workouts Completed",         unit: "/wk", target: 4,   type: "number", tip: "4 sessions minimum. 5 is elite." },
      { id: "avgSleep",      label: "Avg Sleep (hrs/night)",      unit: "hrs", target: 7.5, type: "number", tip: "7.5hrs is the recovery minimum" },
      { id: "avgSteps",      label: "Avg Daily Steps",            unit: "k",   target: 8,   type: "number", tip: "8,000 steps/day baseline activity" },
      { id: "energyScore",   label: "Energy / Focus Score",       unit: "/10", target: 8,   type: "number", tip: "Self-rated. How did your body feel this week?" },
    ],
    milestones: [
      { id: "bodyGoal",      label: "Body Composition Goal Hit" },
      { id: "strengthGoal",  label: "Strength Benchmark Reached" },
      { id: "consistMonth",  label: "4-Week Unbroken Workout Streak" },
    ]
  }
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getWeekStart(offsetWeeks = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + offsetWeeks * 7);
  d.setHours(0,0,0,0);
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(isoDate) {
  const d = new Date(isoDate + "T12:00:00");
  const end = new Date(d); end.setDate(d.getDate() + 6);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
}

function metricScore(metric, value) {
  if (value === undefined || value === null || value === "") return null;
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  if (metric.reverse) {
    if (v === 0) return 100;
    const maxBad = metric.target * 10 || 500;
    return Math.max(0, 100 - (v / maxBad) * 100);
  }
  return Math.min(100, (v / metric.target) * 100);
}

function goalScore(goal, weekData) {
  const data = weekData?.[goal.id] || {};
  const leading = goal.metrics.filter(m => !m.lagging);
  const scores = leading.map(m => metricScore(m, data[m.id])).filter(s => s !== null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a,b) => a+b, 0) / scores.length);
}

function lifeScore(weekData) {
  const scores = GOALS.map(g => ({ score: goalScore(g, weekData), weight: g.weight }))
    .filter(g => g.score !== null);
  if (!scores.length) return null;
  const totalWeight = scores.reduce((a,b) => a + b.weight, 0);
  const weighted = scores.reduce((a,b) => a + b.score * b.weight, 0);
  return Math.round(weighted / totalWeight);
}

function statusColor(score) {
  if (score === null) return "#3a3a4a";
  if (score >= 80) return "#a8e063";
  if (score >= 55) return "#f4a261";
  return "#f25c54";
}

function statusLabel(score) {
  if (score === null) return "NO DATA";
  if (score >= 80) return "ON TRACK";
  if (score >= 55) return "WATCH";
  return "OFF TRACK";
}

function trendArrow(curr, prev) {
  if (curr === null || prev === null) return null;
  const diff = curr - prev;
  if (diff > 5) return { arrow: "↑", color: "#a8e063" };
  if (diff < -5) return { arrow: "↓", color: "#f25c54" };
  return { arrow: "→", color: "#f4a261" };
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
function generateObsidianMD(weekKey, weekData, allData) {
  const lines = [];
  const weekLabel = formatWeekLabel(weekKey);

  lines.push(`---`);
  lines.push(`week: ${weekKey}`);
  lines.push(`tags: [review/weekly]`);
  lines.push(`life-score: ${lifeScore(weekData) ?? "—"}`);
  lines.push(`---`);
  lines.push(``);
  lines.push(`# 📊 Weekly KPI Review — ${weekLabel}`);
  lines.push(``);
  lines.push(`**Life Score: ${lifeScore(weekData) ?? "—"}/100**`);
  lines.push(``);

  GOALS.forEach(goal => {
    const data = weekData?.[goal.id] || {};
    const score = goalScore(goal, weekData);
    const status = statusLabel(score);
    lines.push(`## ${goal.emoji} ${goal.title} — ${score ?? "—"}/100 · ${status}`);
    lines.push(``);
    lines.push(`| Metric | This Week | Target | Status |`);
    lines.push(`|--------|-----------|--------|--------|`);
    goal.metrics.forEach(m => {
      const v = data[m.id];
      const s = metricScore(m, v);
      const st = s === null ? "—" : s >= 80 ? "✅" : s >= 55 ? "⚠️" : "🔴";
      lines.push(`| ${m.label} | ${v ?? "—"} ${m.unit} | ${m.target} ${m.unit} | ${st} |`);
    });
    if (data[`${goal.id}_notes`]) {
      lines.push(``);
      lines.push(`> ${data[`${goal.id}_notes`]}`);
    }
    lines.push(``);

    const achieved = (goal.milestones || []).filter(ms => data[`ms_${ms.id}`]);
    if (achieved.length) {
      lines.push(`**Milestones Achieved:**`);
      achieved.forEach(ms => lines.push(`- ✅ ${ms.label}`));
      lines.push(``);
    }
  });

  lines.push(`---`);
  lines.push(`## 🔍 Weekly Reflection`);
  lines.push(``);
  lines.push(`**What moved forward?**`);
  lines.push(weekData?.reflection_wins || "_");
  lines.push(``);
  lines.push(`**What held me back?**`);
  lines.push(weekData?.reflection_blocks || "_");
  lines.push(``);
  lines.push(`**One thing I'm committing to next week:**`);
  lines.push(weekData?.reflection_commit || "_");

  return lines.join("\n");
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app: {
    fontFamily: "'IBM Plex Sans', 'IBM Plex Mono', monospace",
    background: "#0c0c0e",
    minHeight: "100vh",
    color: "#d4d0c8",
    fontSize: 15,
  },
  inner: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "36px 20px 80px",
  }
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function LifeScoreRing({ score }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const fill = score !== null ? (score / 100) * circ : 0;
  const color = statusColor(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="#1e1e26" strokeWidth={8} />
        <circle
          cx={65} cy={65} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div style={{ marginTop: -98, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
          {score ?? "—"}
        </div>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: "#5a5870", marginTop: 2 }}>LIFE SCORE</div>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", color, marginTop: 4, fontWeight: 600 }}>
          {statusLabel(score)}
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, weekData, prevWeekData, onClick, active }) {
  const score = goalScore(goal, weekData);
  const prevScore = goalScore(goal, prevWeekData);
  const trend = trendArrow(score, prevScore);
  const color = statusColor(score);

  return (
    <div
      onClick={onClick}
      style={{
        background: active ? goal.colorDim : "#131317",
        border: `1px solid ${active ? goal.color + "60" : "#1e1e26"}`,
        borderTop: `3px solid ${active ? goal.color : "#2a2a3a"}`,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 18, marginBottom: 4 }}>{goal.emoji}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
            {goal.title}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color, fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>
            {score ?? "—"}
          </div>
          {trend && <div style={{ fontSize: 14, color: trend.color, marginTop: 2 }}>{trend.arrow} {Math.abs((score||0) - (prevScore||0))}</div>}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {goal.metrics.filter(m => !m.lagging).map(m => {
          const v = weekData?.[goal.id]?.[m.id];
          const s = metricScore(m, v);
          return (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 9, color: "#5a5870", width: 140, letterSpacing: "0.05em", flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{m.label}</div>
              <div style={{ flex: 1, height: 3, background: "#1e1e26", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${s ?? 0}%`,
                  background: statusColor(s),
                  transition: "width 0.5s ease",
                  borderRadius: 2
                }} />
              </div>
              <div style={{ fontSize: 9, color: "#5a5870", width: 36, textAlign: "right" }}>
                {v !== undefined && v !== "" ? `${v}${m.unit ? " " + m.unit : ""}` : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#5a5870", marginTop: 8 }}>
        {active ? "▲ EDITING" : "▼ CLICK TO ENTER DATA"}
      </div>
    </div>
  );
}

function MetricInput({ metric, value, onChange }) {
  const score = metricScore(metric, value);
  const color = statusColor(score);

  return (
    <div style={{ background: "#0e0e14", border: "1px solid #1e1e26", padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: "#d4d0c8", fontWeight: 500, marginBottom: 2 }}>
            {metric.label}
            {metric.lagging && <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "#5a5870", marginLeft: 6 }}>LAGGING</span>}
          </div>
          <div style={{ fontSize: 10, color: "#5a5870", lineHeight: 1.4 }}>{metric.tip}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontSize: 9, color: "#5a5870", letterSpacing: "0.1em", marginBottom: 4 }}>TARGET: {metric.target} {metric.unit}</div>
          {score !== null && (
            <div style={{ fontSize: 12, color, fontWeight: 600 }}>{Math.round(score)}%</div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="number"
          value={value ?? ""}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{
            background: "#131317",
            border: `1px solid ${value !== undefined && value !== "" ? color + "60" : "#2a2a3a"}`,
            color: "#fff",
            padding: "8px 12px",
            fontSize: 16,
            fontFamily: "inherit",
            width: 100,
            outline: "none",
          }}
        />
        <div style={{ flex: 1, height: 4, background: "#1e1e26", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${score ?? 0}%`,
            background: color, transition: "width 0.4s ease", borderRadius: 2
          }} />
        </div>
        <div style={{ fontSize: 10, color: "#5a5870", minWidth: 30 }}>{metric.unit}</div>
      </div>
    </div>
  );
}

function MilestoneToggle({ milestone, checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px",
        background: checked ? "rgba(168,224,99,0.08)" : "#0e0e14",
        border: `1px solid ${checked ? "rgba(168,224,99,0.3)" : "#1e1e26"}`,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{
        width: 16, height: 16,
        border: `2px solid ${checked ? "#a8e063" : "#3a3a4a"}`,
        background: checked ? "#a8e063" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, color: "#0c0c0e", fontWeight: 900,
        flexShrink: 0,
      }}>
        {checked ? "✓" : ""}
      </div>
      <div style={{ fontSize: 11, color: checked ? "#d4d0c8" : "#5a5870" }}>{milestone.label}</div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AnishKPI() {
  const [user, setUser] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [allData, setAllData] = useState({});
  const [activeGoal, setActiveGoal] = useState(null);
  const [view, setView] = useState("dashboard");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const weekKey = getWeekStart(weekOffset);
  const prevWeekKey = getWeekStart(weekOffset - 1);

  // ── Auth ──
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const snapshot = await get(ref(db, `users/${currentUser.uid}/kpi`));
          if (snapshot.exists()) {
            setAllData(snapshot.val());
          }
        } catch (error) {
          console.error("Error loading data:", error);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ── Save to Firebase ──
  const save = useCallback(async (newAll) => {
    if (!user) return;
    setAllData(newAll);
    setSaving(true);
    try {
      await set(ref(db, `users/${user.uid}/kpi`), newAll);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving to cloud. Please try again.");
    }
    setSaving(false);
  }, [user]);

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Sign in failed: " + error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const updateMetric = (goalId, metricId, value) => {
    const newAll = {
      ...allData,
      [weekKey]: {
        ...allData[weekKey],
        [goalId]: {
          ...(allData[weekKey]?.[goalId] || {}),
          [metricId]: value,
        }
      }
    };
    save(newAll);
  };

  const updateMilestone = (goalId, msId, val) => {
    const newAll = {
      ...allData,
      [weekKey]: {
        ...allData[weekKey],
        [goalId]: {
          ...(allData[weekKey]?.[goalId] || {}),
          [`ms_${msId}`]: val,
        }
      }
    };
    save(newAll);
  };

  const updateReflection = (field, val) => {
    const newAll = {
      ...allData,
      [weekKey]: {
        ...(allData[weekKey] || {}),
        [field]: val,
      }
    };
    save(newAll);
  };

  const weekData = allData[weekKey] || {};
  const prevWeekData = allData[prevWeekKey] || {};
  const score = lifeScore(weekData);
  const exportMD = generateObsidianMD(weekKey, weekData, allData);

  const copyExport = () => {
    navigator.clipboard.writeText(exportMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const historyWeeks = Array.from({ length: 8 }, (_, i) => {
    const key = getWeekStart(weekOffset - 7 + i);
    const data = allData[key] || {};
    return { key, label: formatWeekLabel(key), score: lifeScore(data), goalScores: GOALS.map(g => goalScore(g, data)) };
  });

  // ── Render ──
  if (loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: "#5a5870" }}>LOADING...</div>
    </div>
  );

  if (!user) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
          🏆 Anish's Life Score
        </div>
        <div style={{ fontSize: 12, color: "#5a5870", marginBottom: 24 }}>Sign in to track your weekly KPIs</div>
        <button
          onClick={signIn}
          style={{
            background: "#c8a96e",
            color: "#0c0c0e",
            border: "none",
            padding: "12px 32px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        textarea { resize: vertical; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0c0c0e; } ::-webkit-scrollbar-thumb { background: #2a2a3a; }
      `}</style>
      <div style={S.inner}>

        {/* ── HEADER ── */}
        <div style={{ borderBottom: "1px solid #1e1e26", paddingBottom: 24, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "#7a6340" }}>
              PERSONAL OPERATING SYSTEM · WEEKLY KPI TRACKER
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {saving && <div style={{ fontSize: 9, color: "#f4a261", letterSpacing: "0.1em" }}>SYNCING...</div>}
              <button
                onClick={handleSignOut}
                style={{
                  background: "transparent",
                  border: "1px solid #1e1e26",
                  color: "#5a5870",
                  padding: "6px 12px",
                  fontSize: 10,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                SIGN OUT
              </button>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px,5vw,48px)", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em" }}>
                <span style={{ color: "#c8a96e" }}>Anish's</span> Life Score
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5a5870", marginTop: 6, letterSpacing: "0.15em" }}>
                WEEK OF {formatWeekLabel(weekKey).toUpperCase()}
              </div>
            </div>
            <LifeScoreRing score={score} />
          </div>
        </div>

        {/* ── WEEK NAVIGATOR ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {["dashboard","history","export"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "6px 16px",
                background: view === v ? "#1e1e26" : "transparent",
                border: `1px solid ${view === v ? "#2e2e3e" : "#1e1e26"}`,
                color: view === v ? "#d4d0c8" : "#5a5870",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10, letterSpacing: "0.15em", cursor: "pointer",
                textTransform: "uppercase",
              }}>{v}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => { setWeekOffset(w => w-1); setActiveGoal(null); }} style={{ background: "transparent", border: "1px solid #1e1e26", color: "#5a5870", padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 12 }}>←</button>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#5a5870", letterSpacing: "0.1em", minWidth: 120, textAlign: "center" }}>
              {weekOffset === 0 ? "THIS WEEK" : weekOffset === -1 ? "LAST WEEK" : `${Math.abs(weekOffset)}W AGO`}
            </div>
            <button onClick={() => { if (weekOffset < 0) { setWeekOffset(w => w+1); setActiveGoal(null); } }} style={{ background: "transparent", border: "1px solid #1e1e26", color: weekOffset < 0 ? "#5a5870" : "#2a2a3a", padding: "6px 12px", cursor: weekOffset < 0 ? "pointer" : "default", fontFamily: "inherit", fontSize: 12 }}>→</button>
          </div>
        </div>

        {/* ════════════ DASHBOARD VIEW ════════════ */}
        {view === "dashboard" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2, marginBottom: 2 }}>
              {GOALS.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  weekData={weekData}
                  prevWeekData={prevWeekData}
                  active={activeGoal === goal.id}
                  onClick={() => setActiveGoal(activeGoal === goal.id ? null : goal.id)}
                />
              ))}
            </div>

            {activeGoal && (() => {
              const goal = GOALS.find(g => g.id === activeGoal);
              if (!goal) return null;
              return (
                <div style={{ background: "#131317", border: `1px solid ${goal.color}40`, borderTop: `2px solid ${goal.color}`, padding: "24px", marginTop: 2 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                        {goal.emoji} {goal.title}
                      </div>
                      <div style={{ fontSize: 10, color: "#5a5870", letterSpacing: "0.1em", marginTop: 2 }}>{goal.subtitle}</div>
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 28, fontWeight: 900, color: statusColor(goalScore(goal, weekData)) }}>
                      {goalScore(goal, weekData) ?? "—"}
                    </div>
                  </div>

                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#7a6340", marginBottom: 10 }}>METRICS — ENTER THIS WEEK'S NUMBERS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8, marginBottom: 20 }}>
                    {goal.metrics.map(m => (
                      <MetricInput
                        key={m.id}
                        metric={m}
                        value={weekData?.[goal.id]?.[m.id]}
                        onChange={v => updateMetric(goal.id, m.id, v)}
                      />
                    ))}
                  </div>

                  {goal.milestones?.length > 0 && (
                    <>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#7a6340", marginBottom: 10 }}>MILESTONES</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 6, marginBottom: 20 }}>
                        {goal.milestones.map(ms => (
                          <MilestoneToggle
                            key={ms.id}
                            milestone={ms}
                            checked={!!weekData?.[goal.id]?.[`ms_${ms.id}`]}
                            onChange={v => updateMilestone(goal.id, ms.id, v)}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#7a6340", marginBottom: 6 }}>NOTES (optional)</div>
                  <textarea
                    value={weekData?.[goal.id]?.[`${goal.id}_notes`] || ""}
                    onChange={e => updateMetric(goal.id, `${goal.id}_notes`, e.target.value)}
                    placeholder={`Any context for ${goal.title} this week...`}
                    rows={2}
                    style={{
                      width: "100%", background: "#0e0e14", border: "1px solid #1e1e26",
                      color: "#d4d0c8", padding: "10px 12px", fontSize: 12,
                      fontFamily: "inherit", outline: "none",
                    }}
                  />
                </div>
              );
            })()}

            <div style={{ background: "#131317", border: "1px solid #1e1e26", borderTop: "2px solid #c8a96e", padding: 24, marginTop: 2 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#7a6340", marginBottom: 16 }}>WEEKLY REFLECTION</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {[
                  { field: "reflection_wins", label: "What moved forward?", placeholder: "Wins, progress, breakthroughs..." },
                  { field: "reflection_blocks", label: "What held you back?", placeholder: "Blockers, distractions, honest reflection..." },
                  { field: "reflection_commit", label: "One commitment for next week", placeholder: "Single most important thing to do..." },
                ].map(r => (
                  <div key={r.field}>
                    <div style={{ fontSize: 11, color: "#d4d0c8", fontWeight: 500, marginBottom: 6 }}>{r.label}</div>
                    <textarea
                      value={weekData?.[r.field] || ""}
                      onChange={e => updateReflection(r.field, e.target.value)}
                      placeholder={r.placeholder}
                      rows={3}
                      style={{
                        width: "100%", background: "#0e0e14", border: "1px solid #1e1e26",
                        color: "#d4d0c8", padding: "8px 12px", fontSize: 12,
                        fontFamily: "inherit", outline: "none",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ════════════ HISTORY VIEW ════════════ */}
        {view === "history" && (
          <div style={{ background: "#131317", border: "1px solid #1e1e26", padding: 24 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#7a6340", marginBottom: 20 }}>TREND — LAST 8 WEEKS</div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: "#5a5870", marginBottom: 12, letterSpacing: "0.1em" }}>LIFE SCORE</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {historyWeeks.map((w, i) => {
                  const h = w.score !== null ? Math.max(8, (w.score / 100) * 72) : 4;
                  const isCurrentView = w.key === weekKey;
                  return (
                    <div key={w.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 9, color: statusColor(w.score), fontWeight: 600 }}>{w.score ?? "—"}</div>
                      <div
                        style={{
                          width: "100%", height: h,
                          background: isCurrentView ? statusColor(w.score) : statusColor(w.score) + "80",
                          border: isCurrentView ? `1px solid ${statusColor(w.score)}` : "none",
                          transition: "height 0.5s ease",
                          cursor: "pointer",
                        }}
                        onClick={() => { const off = i - 7 + weekOffset; setWeekOffset(off); setView("dashboard"); }}
                      />
                      <div style={{ fontSize: 8, color: "#3a3a4a", textAlign: "center", letterSpacing: "0.05em" }}>
                        {new Date(w.key + "T12:00:00").toLocaleDateString("en", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#5a5870", marginBottom: 12, letterSpacing: "0.1em" }}>GOAL BREAKDOWN</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#5a5870", letterSpacing: "0.15em", borderBottom: "1px solid #1e1e26" }}>GOAL</th>
                      {historyWeeks.slice(-6).map(w => (
                        <th key={w.key} style={{ textAlign: "center", padding: "8px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#5a5870", letterSpacing: "0.1em", borderBottom: "1px solid #1e1e26" }}>
                          {new Date(w.key + "T12:00:00").toLocaleDateString("en", { day: "numeric", month: "short" })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GOALS.map(goal => (
                      <tr key={goal.id}>
                        <td style={{ padding: "8px 12px", color: "#d4d0c8", borderBottom: "1px solid #1e1e26" }}>
                          {goal.emoji} {goal.title}
                        </td>
                        {historyWeeks.slice(-6).map(w => {
                          const s = goalScore(goal, allData[w.key] || {});
                          return (
                            <td key={w.key} style={{ textAlign: "center", padding: "8px 8px", borderBottom: "1px solid #1e1e26" }}>
                              <span style={{ color: statusColor(s), fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                                {s ?? "—"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ EXPORT VIEW ════════════ */}
        {view === "export" && (
          <div style={{ background: "#131317", border: "1px solid #1e1e26", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#7a6340", marginBottom: 4 }}>OBSIDIAN EXPORT</div>
                <div style={{ fontSize: 12, color: "#5a5870" }}>Copy this markdown → paste into your Obsidian Weekly Review note</div>
              </div>
              <button
                onClick={copyExport}
                style={{
                  background: copied ? "rgba(168,224,99,0.15)" : "rgba(200,169,110,0.1)",
                  border: `1px solid ${copied ? "rgba(168,224,99,0.4)" : "rgba(200,169,110,0.3)"}`,
                  color: copied ? "#a8e063" : "#c8a96e",
                  padding: "10px 20px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10, letterSpacing: "0.15em",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {copied ? "✓ COPIED" : "COPY MARKDOWN"}
              </button>
            </div>

            <div style={{ background: "#0a0a10", border: "1px solid #1e1e26", borderLeft: "3px solid #c8a96e", padding: "10px 14px", marginBottom: 14, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#7a6340" }}>
              PASTE INTO → 00 - INBOX/Weekly Reviews/{weekKey}.md
            </div>

            <pre style={{
              background: "#080810", border: "1px solid #1e1e26",
              padding: "16px", fontSize: 11, color: "#6a8a6a",
              fontFamily: "'IBM Plex Mono', monospace",
              lineHeight: 1.7, overflowX: "auto", overflowY: "auto",
              maxHeight: 500, whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {exportMD}
            </pre>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid #1e1e26", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#3a3a4a", letterSpacing: "0.15em" }}>ANISH'S OS · WEEKLY KPI TRACKER · DATA SYNCED WITH FIREBASE</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#3a3a4a", letterSpacing: "0.1em" }}>
            {Object.keys(allData).length} WEEKS ON RECORD
          </div>
        </div>

      </div>
    </div>
  );
}
