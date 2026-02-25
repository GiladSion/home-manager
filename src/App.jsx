import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── SUPABASE ─── */
const SUPABASE_URL = "https://uqfpbgjetppfesbavgwu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZnBiZ2pldHBwZmVzYmF2Z3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTA1ODEsImV4cCI6MjA4NzM2NjU4MX0.X5eGqiF-sH_rNBF2zpJp7NrbiruTlmAagDcCdhYi2UU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── THEME — Material Design ─── */
const C = {
  bg: "#EEEEEE",
  card: "#FFFFFF",
  primary: "#4CAF50",
  primaryDark: "#388E3C",
  primaryLight: "#C8E6C9",
  secondary: "#66BB6A",
  secondaryLight: "#A5D6A7",
  accent: "#FF5722",
  text: "#212121",
  textMuted: "#757575",
  border: "#E0E0E0",
  danger: "#F44336",
  purple: "#9C27B0",
  headerGrad: "linear-gradient(160deg, #11998e 0%, #38ef7d 100%)",
  shadow: "0 2px 10px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.12)",
  shadowHover: "0 8px 24px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.12)",
  shadowDeep: "0 16px 38px rgba(0,0,0,0.2), 0 6px 12px rgba(0,0,0,0.14)",
};

const URGENCY = {
  high:   { label: "דחוף",   color: "#E53935", bg: "#FFEBEE", icon: "🔴" },
  medium: { label: "בינוני", color: "#F57C00", bg: "#FFF3E0", icon: "🟡" },
  low:    { label: "נמוך",   color: "#2E7D32", bg: "#E8F5E9", icon: "🟢" },
};

const CATEGORY_COLORS = {
  "גלעד":      "#3A6B3E",
  "ואלרי":     "#B8862A",
  "דין":       "#7B4FA0",
  "מילה":      "#C06090",
  "נוגה":      "#C0392B",
  "ימי הולדת": "#1A7A8A",
  "אחר":       "#6B8F71",
};
const FAMILY_MEMBERS = ["ואלרי", "גלעד"];
const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const DAYS_HE = ["א","ב","ג","ד","ה","ו","ש"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function formatDate(d) { return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`; }
function isSameDay(a, b) { return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear(); }

/* ─── TOAST / NOTIFICATION HOOK ─── */
function useNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [muted, setMuted] = useState(false);
  const [toasts, setToasts] = useState([]);
  const notifiedRef = useRef(new Set());

  const requestPermission = useCallback(async () => {
    if (permission === "granted") {
      setMuted(prev => !prev);
      return;
    }
    if (typeof Notification === "undefined") return;
    const r = await Notification.requestPermission();
    setPermission(r);
  }, [permission]);

  const addToast = useCallback((msg, type = "info") => {
    if (muted) return;
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, [muted]);

  const notify = useCallback((title, body, type = "info") => {
    if (muted) return;
    addToast(body ? `${title}: ${body}` : title, type);
    if (permission === "granted") {
      try { new Notification(title, { body, icon: "🏡" }); } catch {}
    }
  }, [permission, muted, addToast]);

  return { permission, muted, requestPermission, notify, toasts };
}

/* ─── TOAST UI — Material Snackbar style ─── */
function ToastContainer({ toasts }) {
  const types = {
    info:     { bg: "#323232", icon: "ℹ️" },
    success:  { bg: "#388E3C", icon: "✅" },
    event:    { bg: "#7B1FA2", icon: "📅" },
    shopping: { bg: "#E65100", icon: "🛒" },
    warning:  { bg: "#D32F2F", icon: "⚠️" },
  };
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
      zIndex:9999, display:"flex", flexDirection:"column-reverse", gap:8,
      width:"min(94vw, 400px)", pointerEvents:"none",
    }}>
      {toasts.map(t => {
        const s = types[t.type] || types.info;
        return (
          <div key={t.id} style={{
            background:s.bg, color:"#fff", borderRadius:4, padding:"14px 18px",
            boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
            display:"flex", alignItems:"center", gap:10,
            animation:"toastIn 0.25s cubic-bezier(0.4,0,0.2,1)",
            fontSize:13, fontWeight:500, direction:"rtl",
            letterSpacing:"0.2px",
          }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════ */
export default function App() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // midnight = start of today
  const [tab, setTab] = useState("home");
  const { permission, muted, requestPermission, notify, toasts } = useNotifications();

  const [assignments, setAssignments] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [calendarDate, setCalendarDate] = useState(today);
  const [calView, setCalView] = useState("upcoming");
  const [showAddA, setShowAddA] = useState(false);
  const [showAddS, setShowAddS] = useState(false);
  const [showAddE, setShowAddE] = useState(false);
  const [newA, setNewA] = useState({ title: "", assignee: "ואלרי", due: "", urgency: "medium" });
  const [newS, setNewS] = useState({ item: "", qty: "" });
  const [newE, setNewE] = useState({ title: "", date: "", time: "", category: "גלעד" });

  /* ── helpers to parse DB rows ── */
  function parseEvent(row) {
    return { ...row, date: new Date(row.date) };
  }

  /* ── Initial load ── */
  useEffect(() => {
    async function loadAll() {
      const [{ data: a }, { data: s }, { data: e }] = await Promise.all([
        supabase.from("assignments").select("*").order("created_at"),
        supabase.from("shopping").select("*").order("created_at"),
        supabase.from("events").select("*").order("date"),
      ]);
      setAssignments(a || []);
      setShopping(s || []);
      setEvents((e || []).map(parseEvent));
      setLoading(false);
    }
    loadAll();
  }, []);

  /* ── Real-time subscriptions ── */
  useEffect(() => {
    const channel = supabase
      .channel("db-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, payload => {
        if (payload.eventType === "INSERT") setAssignments(prev => [...prev, payload.new]);
        if (payload.eventType === "UPDATE") setAssignments(prev => prev.map(a => a.id === payload.new.id ? payload.new : a));
        if (payload.eventType === "DELETE") setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shopping" }, payload => {
        if (payload.eventType === "INSERT") setShopping(prev => [...prev, payload.new]);
        if (payload.eventType === "UPDATE") setShopping(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        if (payload.eventType === "DELETE") setShopping(prev => prev.filter(s => s.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, payload => {
        if (payload.eventType === "INSERT") setEvents(prev => [...prev, parseEvent(payload.new)]);
        if (payload.eventType === "UPDATE") setEvents(prev => prev.map(e => e.id === payload.new.id ? parseEvent(payload.new) : e));
        if (payload.eventType === "DELETE") setEvents(prev => prev.filter(e => e.id !== payload.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  /* ── DB actions: assignments ── */
  async function addAssignment(item) {
    const tempId = Date.now();
    const optimistic = { ...item, id: tempId };
    setAssignments(prev => [...prev, optimistic]);
    const { data } = await supabase.from("assignments").insert([item]).select().single();
    if (data) {
      setAssignments(prev => prev.map(a => a.id === tempId ? data : a));
      notify("משימה חדשה נוספה 📋", `${data.title} · ${URGENCY[data.urgency]?.label}`, "info");
    }
  }
  async function toggleAssignment(id) {
    const item = assignments.find(a => a.id === id);
    if (!item) return;
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, approved: !a.approved } : a));
    await supabase.from("assignments").update({ approved: !item.approved }).eq("id", id);
  }
  async function removeAssignment(id) {
    setAssignments(prev => prev.filter(a => a.id !== id));
    await supabase.from("assignments").delete().eq("id", id);
  }

  /* ── DB actions: shopping ── */
  async function addShoppingItem(item) {
    const tempId = Date.now();
    const optimistic = { ...item, id: tempId };
    setShopping(prev => [...prev, optimistic]);
    const { data } = await supabase.from("shopping").insert([item]).select().single();
    if (data) setShopping(prev => prev.map(s => s.id === tempId ? data : s));
  }
  async function toggleShopping(id) {
    const item = shopping.find(s => s.id === id);
    if (!item) return;
    setShopping(prev => prev.map(s => s.id === id ? { ...s, approved: !s.approved } : s));
    await supabase.from("shopping").update({ approved: !item.approved }).eq("id", id);
  }
  async function removeShopping(id) {
    setShopping(prev => prev.filter(s => s.id !== id));
    await supabase.from("shopping").delete().eq("id", id);
  }
  async function addQuickItem(qi) {
    await supabase.from("quick_items").insert([{ label: qi.label, icon: qi.icon }]);
  }

  /* ── DB actions: events ── */
  async function addEvent(ev) {
    const tempId = Date.now();
    const optimistic = { ...ev, id: tempId };
    setEvents(prev => [...prev, optimistic]);
    const { data } = await supabase.from("events").insert([{ ...ev, date: ev.date.toISOString() }]).select().single();
    if (data) setEvents(prev => prev.map(e => e.id === tempId ? parseEvent(data) : e));
  }  async function removeEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    await supabase.from("events").delete().eq("id", id);
  }

  /* ── Budget state ── */
  const [budgetEntries, setBudgetEntries] = useState([]);
  const [monthlyLimit, setMonthlyLimit] = useState(0);
  const [budgetSettingsId, setBudgetSettingsId] = useState(null);

  useEffect(() => {
    async function loadBudget() {
      const [{ data: entries }, { data: settings }] = await Promise.all([
        supabase.from("budget_entries").select("*").order("created_at", { ascending: false }),
        supabase.from("budget_settings").select("*").limit(1),
      ]);
      setBudgetEntries(entries || []);
      if (settings && settings.length > 0) {
        setMonthlyLimit(settings[0].monthly_limit || 0);
        setBudgetSettingsId(settings[0].id);
      }
    }
    loadBudget();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("budget-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_entries" }, payload => {
        if (payload.eventType === "INSERT") setBudgetEntries(prev => [payload.new, ...prev]);
        if (payload.eventType === "DELETE") setBudgetEntries(prev => prev.filter(e => e.id !== payload.old.id));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "budget_settings" }, payload => {
        if (payload.eventType === "UPDATE") setMonthlyLimit(payload.new.monthly_limit || 0);
        if (payload.eventType === "INSERT") { setMonthlyLimit(payload.new.monthly_limit || 0); setBudgetSettingsId(payload.new.id); }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function addBudgetEntry(amount, note) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    const tempId = Date.now();
    const optimistic = { id: tempId, amount, note, month, created_at: now.toISOString() };
    setBudgetEntries(prev => [optimistic, ...prev]);
    const { data } = await supabase.from("budget_entries").insert([{ amount, note, month }]).select().single();
    if (data) setBudgetEntries(prev => prev.map(e => e.id === tempId ? data : e));
  }

  async function removeBudgetEntry(id) {
    setBudgetEntries(prev => prev.filter(e => e.id !== id));
    await supabase.from("budget_entries").delete().eq("id", id);
  }

  async function saveMonthlyLimit(limit) {
    setMonthlyLimit(limit);
    if (budgetSettingsId) {
      await supabase.from("budget_settings").update({ monthly_limit: limit }).eq("id", budgetSettingsId);
    } else {
      const { data } = await supabase.from("budget_settings").insert([{ monthly_limit: limit }]).select().single();
      if (data) setBudgetSettingsId(data.id);
    }
  }

  const sp = {
    assignments, shopping, events, today, notify, loading, muted,
    addAssignment, toggleAssignment, removeAssignment,
    addShoppingItem, toggleShopping, removeShopping, addQuickItem,
    addEvent, removeEvent,
    calendarDate, setCalendarDate, calView, setCalView,
    showAddA, setShowAddA, newA, setNewA,
    showAddS, setShowAddS, newS, setNewS,
    showAddE, setShowAddE, newE, setNewE,
    setTab,
    budgetEntries, monthlyLimit, setMonthlyLimit: saveMonthlyLimit,
    addBudgetEntry, removeBudgetEntry,
  };

  const TABS = [
    { key: "home",        label: "בית",      icon: "🏠" },
    { key: "assignments", label: "משימות",   icon: "✅" },
    { key: "shopping",    label: "קניות",    icon: "🛒" },
    { key: "calendar",    label: "לוח שנה",  icon: "📅" },
    { key: "budget",      label: "תקציב",    icon: "💰" },
  ];

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Heebo','Assistant',sans-serif", direction: "rtl" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Heebo:wght@300;400;500;600;700;800;900&family=Pacifico&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #EEEEEE; }
        input, select { outline: none; font-family: Roboto, Heebo, sans-serif; }
        button { font-family: Roboto, Heebo, sans-serif; }

        /* Material ripple hover */
        .hov { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .hov:hover { opacity: 0.92; transform: translateY(-2px); }
        .hov:active { transform: scale(0.97); opacity: 1; }

        /* Card hover lift */
        .chov { transition: box-shadow 0.3s cubic-bezier(0.4,0,0.2,1); }
        .chov:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.12) !important; }

        /* Sidebar */
        .sidebar-btn { transition: all 0.2s ease; border-radius: 0 !important; position: relative; }
        .sidebar-btn::after { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:white; transform:scaleY(0); transition:transform 0.2s ease; border-radius:0 2px 2px 0; }
        .sidebar-btn.active::after { transform:scaleY(1); }
        .sidebar-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .sidebar-btn.active { background: rgba(255,255,255,0.15) !important; }

        /* Inputs */
        input:focus, select:focus { border-color: ${C.primary} !important; box-shadow: 0 2px 0 ${C.primary} !important; }

        /* Urgency */
        .urgency-group { display: flex; gap: 8px; justify-content: flex-start; flex-wrap: nowrap; }
        .urgency-btn { width: 90px !important; flex: 0 0 90px !important; min-width: 0; }

        /* Checkboxes */
        .check-circle { width: 27px !important; height: 27px !important; flex: 0 0 27px !important; border-radius: 50% !important; }
        .check-square { width: 27px !important; height: 27px !important; flex: 0 0 27px !important; border-radius: 3px !important; }

        /* Animations */
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(-12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        .fade-up  { animation: fadeUp  0.3s cubic-bezier(0.4,0,0.2,1) both; }
        .slide-in { animation: slideIn 0.25s cubic-bezier(0.4,0,0.2,1) both; }

        /* Calendar */
        .cal-cell:hover { background: ${C.primaryLight} !important; border-radius: 50%; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #BDBDBD; border-radius: 4px; }

        /* ── DESKTOP layout ── */
        .app-shell { display: flex; min-height: 100vh; }
        .sidebar {
          width: 260px; flex-shrink: 0;
          background: ${C.headerGrad};
          display: flex; flex-direction: column;
          position: fixed; top: 0; right: 0; bottom: 0;
          z-index: 100; padding: 0 0 24px;
          box-shadow: -4px 0 20px rgba(0,0,0,0.25);
        }
        .sidebar-logo {
          padding: 32px 24px 28px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          margin-bottom: 8px;
        }
        .sidebar-nav { flex: 1; padding: 8px 0; display: flex; flex-direction: column; gap: 0; }
        .sidebar-footer { padding: 0 16px; }
        .main-content {
          margin-right: 260px;
          margin-left: 0;
          flex: 1;
          min-height: 100vh;
          width: calc(100vw - 260px);
        }
        .topbar {
          background: #FFFFFF;
          padding: 0 36px;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
          width: 100%;
          border-bottom: 1px solid #E0E0E0;
        }
        .page-body {
          padding: 24px 36px 48px;
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
        }
        .mobile-header { display: none; }
        .mobile-tabbar { display: none; }

        /* ── MOBILE layout ── */
        @media (max-width: 768px) {
          .app-shell { display: block; }
          .sidebar { display: none; }
          .main-content { margin-right: 0; margin-left: 0; width: 100vw; }
          .topbar { display: none; }
          .page-body { padding: 16px 14px 90px; max-width: 100%; }
          .mobile-header { display: block; }
          .mobile-tabbar {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: ${C.card}; border-top: 1px solid ${C.border};
            z-index: 100; padding: 6px 8px 10px; gap: 2px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
          }
        }
      `}</style>

      {loading && (
        <div style={{
          position:"fixed", inset:0, background:"#EEEEEE", zIndex:9999,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16,
        }}>
          <span style={{ fontSize:44 }}>🏡</span>
          <div style={{
            width:40, height:40, borderRadius:"50%",
            border:`3px solid #C8E6C9`, borderTopColor:C.primary,
            animation:"spin 0.8s linear infinite",
          }} />
          <p style={{ color:C.textMuted, fontFamily:"Roboto,Heebo,sans-serif", fontSize:14, fontWeight:500, letterSpacing:"0.5px" }}>טוען נתונים...</p>
        </div>
      )}

      <ToastContainer toasts={toasts} />

      <div className="app-shell">

        {/* ══ SIDEBAR (desktop) ══ */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
              <div style={{
                fontFamily:"'Pacifico', cursive",
                fontSize:42, color:"#fff",
                letterSpacing:"1px",
                textShadow:"0 2px 12px rgba(0,0,0,0.15)",
                lineHeight:1.1,
              }}>Sion</div>
              <div style={{ color:"rgba(255,255,255,0.55)", fontSize:11, fontWeight:400, marginTop:4, letterSpacing:"1.5px", textTransform:"uppercase" }}>ניהול משק הבית</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {TABS.map(t => (
              <button key={t.key} className={`sidebar-btn hov${tab===t.key?" active":""}`}
                onClick={() => setTab(t.key)} style={{
                  width:"100%", padding:"14px 24px",
                  background:"transparent",
                  border:"none",
                  color: tab===t.key ? "#fff" : "rgba(255,255,255,0.88)",
                  fontSize:14, fontWeight: tab===t.key ? 700 : 400,
                  cursor:"pointer", display:"flex", alignItems:"center", gap:16, textAlign:"right",
                  letterSpacing:"0.2px",
                }}>
                <span style={{ fontSize:20, flexShrink:0, opacity: tab===t.key ? 1 : 0.95 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="hov" onClick={requestPermission} style={{
              width:"100%", padding:"11px 16px", borderRadius:4,
              background:"rgba(255,255,255,0.1)",
              border:"none",
              color:"rgba(255,255,255,0.85)", fontSize:12, fontWeight:500,
              cursor:"pointer", display:"flex", alignItems:"center", gap:10,
              letterSpacing:"0.3px",
            }}>
              <span style={{ fontSize:16 }}>
                {permission !== "granted" ? "🔕" : muted ? "🔕" : "🔔"}
              </span>
              {permission !== "granted" ? "הפעל התראות" : muted ? "התראות מושתקות" : "התראות פעילות"}
            </button>
          </div>
        </aside>

        {/* ══ MAIN CONTENT ══ */}
        <div className="main-content">

          {/* Mobile header */}
          <div className="mobile-header" style={{
            background: C.headerGrad,
            padding:"16px 16px 18px", position:"relative", overflow:"hidden",
            boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ fontFamily:"'Pacifico', cursive", fontSize:28, color:"#fff", textShadow:"0 2px 8px rgba(0,0,0,0.15)" }}>Sion</div>
                <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", marginTop:2 }}>ניהול משק הבית</div>
              </div>
              <button className="hov" onClick={requestPermission} style={{
                background:"rgba(255,255,255,0.15)", border:"none",
                borderRadius:24, padding:"7px 14px", color:"#fff",
                fontSize:11, fontWeight:500, cursor:"pointer",
                display:"flex", alignItems:"center", gap:6,
                letterSpacing:"0.3px",
              }}>
                <span>{permission !== "granted" ? "🔕" : muted ? "🔕" : "🔔"}</span>
                {permission !== "granted" ? "התראות" : muted ? "מושתק" : "פעיל"}
              </button>
            </div>
          </div>

          {/* Desktop top bar */}
          <div className="topbar">
            <div>
              <h2 style={{ fontSize:20, fontWeight:500, color:C.text, letterSpacing:"0.3px" }}>
                {TABS.find(t=>t.key===tab)?.icon} {TABS.find(t=>t.key===tab)?.label}
              </h2>
              <p style={{ fontSize:12, color:C.textMuted, marginTop:2, fontWeight:400 }}>
                {today.getDate()} {MONTHS_HE[today.getMonth()]} {today.getFullYear()}
              </p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <Stat label="משימות" value={sp.assignments.filter(a=>!a.approved).length} color={C.primary} />
              <Stat label="קניות"  value={sp.shopping.filter(s=>!s.approved).length}    color="#FF9800" />
              <Stat label="אירועים" value={sp.events.filter(e=>e.date>=today).length}   color="#9C27B0" />
            </div>
          </div>

          {/* Page body */}
          <div className="page-body">
            {tab==="home"        && <HomeTab        {...sp} />}
            {tab==="assignments" && <AssignmentsTab {...sp} />}
            {tab==="shopping"    && <ShoppingTab    {...sp} />}
            {tab==="calendar"    && <CalendarTab    {...sp} />}
            {tab==="budget"      && <BudgetTab      {...sp} />}
          </div>
        </div>

        {/* ══ MOBILE BOTTOM TAB BAR ══ */}
        <div className="mobile-tabbar">
          {TABS.map(t => (
            <button key={t.key} className="hov" onClick={() => setTab(t.key)} style={{
              flex:1, padding:"6px 2px", borderRadius:0,
              background:"transparent",
              color: tab===t.key ? C.primary : "#9E9E9E",
              border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              borderTop: tab===t.key ? `2px solid ${C.primary}` : "2px solid transparent",
            }}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:9, fontWeight: tab===t.key ? 700 : 400, letterSpacing:"0.3px" }}>{t.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME  –  DASHBOARD
═══════════════════════════════════════════════════════════ */
function HomeTab({ assignments, shopping, events, today, notify, setTab, toggleAssignment, toggleShopping }) {
  const pendingTasks    = assignments.filter(a => !a.approved)
    .sort((a,b) => ({high:0,medium:1,low:2}[a.urgency]-({high:0,medium:1,low:2}[b.urgency])))
    .slice(0, 3);
  const pendingShopping = shopping.filter(s => !s.approved).slice(0, 3);
  const upcomingEvents  = [...events].filter(e => e.date >= today).sort((a,b)=>a.date-b.date).slice(0, 3);

  const DAYS_FULL = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const month = today.getMonth(), year = today.getFullYear(), day = today.getDate();
  const dayName = DAYS_FULL[today.getDay()];
  const dateStr = `יום ${dayName}، ${day} ${MONTHS_HE[month]} ${year}`;

  function quickDone(id) { toggleAssignment(id); }
  function quickBought(id) { toggleShopping(id); }

  return (
    <div className="fade-up">
      {/* Welcome card — Material header overlap style */}
      <div style={{
        marginBottom:20,
        background: C.headerGrad,
        borderRadius:4,
        padding:"22px 22px 22px",
        boxShadow: C.shadowDeep,
        color:"#fff",
      }}>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginBottom:4, letterSpacing:"0.5px", fontWeight:400 }}>📆 {dateStr}</div>
        <div style={{ fontSize:22, fontWeight:500, letterSpacing:"0.2px" }}>שלום, משפחה! 👋</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:10, display:"flex", gap:16, flexWrap:"wrap" }}>
          <span>✅ <strong>{assignments.filter(a=>!a.approved).length}</strong> משימות</span>
          <span>🛒 <strong>{shopping.filter(s=>!s.approved).length}</strong> פריטי קניות</span>
          <span>📅 <strong>{upcomingEvents.length}</strong> אירועים קרובים</span>
        </div>
      </div>

      {/* ── Tasks ── */}
      <DashSection title="משימות ממתינות" icon="✅" navLabel="כל המשימות ←" onNav={() => setTab("assignments")}>
        {pendingTasks.length === 0
          ? <EmptyMsg text="כל המשימות הושלמו! 🎉" />
          : pendingTasks.map((a, i) => (
            <div key={a.id} style={{
              background: C.card, borderRadius:4, padding:"12px 14px", marginBottom:8,
              boxShadow: C.shadow, display:"flex", alignItems:"center", gap:10,
              borderRight:`5px solid ${URGENCY[a.urgency].color}`,
              animation:`fadeUp 0.3s ${i*0.07}s cubic-bezier(0.4,0,0.2,1) both`,
            }}>
              <button className="hov" onClick={() => quickDone(a.id)} style={{
                width:25, height:25, minWidth:25, maxWidth:25, borderRadius:"50%",
                background:"transparent", border:`2px solid #BDBDBD`,
                flexShrink:0, cursor:"pointer", padding:0,
                display:"flex", alignItems:"center", justifyContent:"center",
              }} title="סמן כהושלם" />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:14, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.title}</div>
                <div style={{ display:"flex", gap:6, marginTop:3, flexWrap:"wrap", alignItems:"center" }}>
                  <UrgencyBadge urgency={a.urgency} small />
                  <span style={{ color:C.textMuted, fontSize:11 }}>👤 {a.assignee} · 📅 {a.due}</span>
                </div>
              </div>
            </div>
          ))
        }
      </DashSection>

      {/* ── Shopping ── */}
      <DashSection title="רשימת קניות" icon="🛒" navLabel="לרשימה המלאה ←" onNav={() => setTab("shopping")}>
        {pendingShopping.length === 0
          ? <EmptyMsg text="אין פריטים לקנייה כרגע 🛍️" />
          : pendingShopping.map((s, i) => (
            <div key={s.id} style={{
              background:C.card, borderRadius:4, padding:"12px 14px", marginBottom:8,
              boxShadow:C.shadow, display:"flex", alignItems:"center", gap:10,
              animation:`fadeUp 0.3s ${i*0.07}s cubic-bezier(0.4,0,0.2,1) both`,
            }}>
              <button className="hov" onClick={() => quickBought(s.id)} style={{
                width:25, height:25, minWidth:25, maxWidth:25, borderRadius:3,
                background:"transparent", border:`2px solid #BDBDBD`,
                flexShrink:0, cursor:"pointer", padding:0,
              }} title="סמן כנרכש" />
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <div style={{ flex:1 }}>
                <span style={{ fontWeight:500, fontSize:14, color:C.text }}>{s.item}</span>
                {s.qty && s.qty !== "1" && <span style={{ color:C.textMuted, fontSize:12, marginRight:8 }}> ×{s.qty}</span>}
              </div>
            </div>
          ))
        }
      </DashSection>

      {/* ── Events ── */}
      <DashSection title="אירועים קרובים" icon="📅" navLabel="ללוח השנה ←" onNav={() => setTab("calendar")}>
        {upcomingEvents.length === 0
          ? <EmptyMsg text="אין אירועים קרובים 📭" />
          : upcomingEvents.map((ev, i) => {
            const color = CATEGORY_COLORS[ev.category] || C.accent;
            const DAYS_FULL = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
            const dayName = ev.date instanceof Date ? DAYS_FULL[ev.date.getDay()] : "";
            return (
              <div key={ev.id} style={{
                background:C.card, borderRadius:4, padding:"12px 14px", marginBottom:8,
                boxShadow:C.shadow, display:"flex", alignItems:"center", gap:10,
                borderRight:`4px solid ${color}`,
                animation:`fadeUp 0.3s ${i*0.07}s cubic-bezier(0.4,0,0.2,1) both`,
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500, fontSize:14, color:C.text, display:"flex", alignItems:"center", gap:7 }}>
                    {ev.title}
                    {ev.time && <span style={{ color:C.textMuted, fontSize:12, fontWeight:400 }}>🕐 {ev.time}</span>}
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center" }}>
                    <span style={{ color:C.textMuted, fontSize:11 }}>📅 יום {dayName}، {formatDate(ev.date)}</span>
                    <span style={{ background:`${color}18`, color, fontSize:10, fontWeight:500, padding:"2px 8px", borderRadius:99 }}>{ev.category}</span>
                  </div>
                </div>
              </div>
            );
          })
        }
      </DashSection>
    </div>
  );
}

function DashSection({ title, icon, children, onNav, navLabel }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontWeight:500, fontSize:16, color:C.text, letterSpacing:"0.2px" }}>{title}</span>
        </div>
        <button className="hov" onClick={onNav} style={{
          background:"transparent", border:"none",
          fontSize:12, fontWeight:500, color:C.primary, cursor:"pointer",
          letterSpacing:"0.5px", textTransform:"uppercase",
          padding:"4px 8px",
        }}>{navLabel}</button>
      </div>
      <div style={{ borderRadius:4 }}>
        {children}
      </div>
    </div>
  );
}

function EmptyMsg({ text }) {
  return (
    <div style={{ textAlign:"center", padding:"16px 0 20px", color:C.textMuted, fontSize:13, fontWeight:400, letterSpacing:"0.2px" }}>{text}</div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ASSIGNMENTS
═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   DRAG & DROP HOOK — pointer events, works desktop + mobile
═══════════════════════════════════════════════════════════ */
function useDragSort(initialItems) {
  const [items, setItems] = useState(initialItems);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragNode = useRef(null);
  const frameRef = useRef(null);

  // Sync when external items change (DB updates etc)
  useEffect(() => { setItems(initialItems); }, [JSON.stringify(initialItems.map(i=>i.id))]);

  function handleDragStart(e, idx) {
    setDragIdx(idx);
    setOverIdx(idx);
    dragNode.current = e.currentTarget;
    dragNode.current.style.opacity = "0.4";
    e.dataTransfer && (e.dataTransfer.effectAllowed = "move");
  }
  function handleDragEnter(idx) {
    if (idx === dragIdx) return;
    setOverIdx(idx);
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  }
  function handleDragEnd() {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    dragNode.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }

  // Touch/pointer support
  function handlePointerDown(e, idx) {
    if (e.pointerType === "mouse") return; // mouse uses drag events
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIdx(idx);
    dragNode.current = e.currentTarget;
    dragNode.current.style.opacity = "0.4";
    dragNode.current.style.transform = "scale(1.02)";
  }
  function handlePointerMove(e, idx) {
    if (dragIdx === null || dragIdx === undefined) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el?.closest("[data-drag-idx]");
      if (!card) return;
      const targetIdx = parseInt(card.dataset.dragIdx);
      if (isNaN(targetIdx) || targetIdx === dragIdx) return;
      setItems(prev => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(targetIdx, 0, moved);
        return next;
      });
      setDragIdx(targetIdx);
    });
  }
  function handlePointerUp(e) {
    if (dragNode.current) {
      dragNode.current.style.opacity = "1";
      dragNode.current.style.transform = "";
    }
    dragNode.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }

  function getDragProps(idx) {
    return {
      "data-drag-idx": idx,
      draggable: true,
      onDragStart: e => handleDragStart(e, idx),
      onDragEnter: () => handleDragEnter(idx),
      onDragEnd: handleDragEnd,
      onDragOver: e => e.preventDefault(),
      onPointerDown: e => handlePointerDown(e, idx),
      onPointerMove: e => handlePointerMove(e, idx),
      onPointerUp: handlePointerUp,
      style: {
        cursor: "grab",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        touchAction: "none",
      }
    };
  }

  return { items, dragIdx, getDragProps };
}

function AssignmentsTab({ assignments, showAddA, setShowAddA, newA, setNewA, notify,
  addAssignment, toggleAssignment, removeAssignment }) {
  const urgOrder = { high:0, medium:1, low:2 };
  const pendingRaw = [...assignments.filter(a => !a.approved)].sort((a,b)=>urgOrder[a.urgency]-urgOrder[b.urgency]);
  const approved = assignments.filter(a => a.approved);

  const { items: pending, dragIdx: aDragIdx, getDragProps: getADragProps } = useDragSort(pendingRaw);

  function toggle(id) { toggleAssignment(id); }
  function remove(id) { removeAssignment(id); }
  function add() {
    if (!newA.title.trim()) return;
    const item = { title:newA.title, assignee:newA.assignee, due:newA.due||"לא נקבע", urgency:newA.urgency, approved:false };
    addAssignment(item);
    setNewA({ title:"", assignee:"ואלרי", due:"", urgency:"medium" });
    setShowAddA(false);
  }

  return (
    <div className="fade-up">
      <SectionHeader title="משימות הבית" icon="✅" count={pending.length} label="ממתינות" onAdd={()=>setShowAddA(!showAddA)} />

      {showAddA && (
        <AddForm onAdd={add} onCancel={()=>setShowAddA(false)}>
          <input value={newA.title} onChange={e=>setNewA({...newA,title:e.target.value})} placeholder="שם המשימה" style={IS} />
          <select value={newA.assignee} onChange={e=>setNewA({...newA,assignee:e.target.value})} style={IS}>
            {FAMILY_MEMBERS.map(m=><option key={m}>{m}</option>)}
          </select>
          <input type="date" value={newA.due} onChange={e=>setNewA({...newA,due:e.target.value})} style={IS} />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:7 }}>רמת דחיפות</div>
            <div className="urgency-group">
              {Object.entries(URGENCY).map(([key,u])=>(
                <button key={key} className="hov urgency-btn" onClick={()=>setNewA({...newA,urgency:key})} style={{
                  padding:"9px 4px", borderRadius:11, cursor:"pointer",
                  background: newA.urgency===key ? u.bg : C.card,
                  border:`2px solid ${newA.urgency===key ? u.color : C.border}`,
                  fontSize:12, fontWeight:700, color:u.color,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                  transition:"all 0.16s",
                }}>
                  <span style={{ fontSize:18 }}>{u.icon}</span>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </AddForm>
      )}

      {pending.length===0 && <EmptyState text="כל המשימות הושלמו! 🎉" />}
      {pending.map((a,i) => (
        <div key={a.id} {...getADragProps(i)} style={{
          ...getADragProps(i).style,
          boxShadow: aDragIdx===i ? "0 8px 24px rgba(0,0,0,0.2)" : "none",
          zIndex: aDragIdx===i ? 10 : 1, position:"relative",
        }}>
          <AssignCard item={a} onToggle={toggle} onRemove={remove} delay={0} showHandle />
        </div>
      ))}

      {approved.length > 0 && (
        <>
          <Divider label={`הושלמו (${approved.length})`} />
          {approved.map(a => <AssignCard key={a.id} item={a} onToggle={toggle} onRemove={remove} />)}
        </>
      )}
    </div>
  );
}

function AssignCard({ item, onToggle, onRemove, delay=0, showHandle=false }) {
  const u = URGENCY[item.urgency] || URGENCY.medium;
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:4, padding:"14px 16px", marginBottom:8,
      boxShadow: C.shadow,
      display:"flex", alignItems:"center", gap:12,
      opacity: item.approved ? 0.55 : 1,
      borderRight:`5px solid ${item.approved ? "#BDBDBD" : u.color}`,
      animation: delay ? `fadeUp 0.3s ${delay}s cubic-bezier(0.4,0,0.2,1) both` : "none",
    }}>
      {showHandle && (
        <div style={{ color:"#BDBDBD", fontSize:16, flexShrink:0, display:"flex", flexDirection:"column", gap:2, paddingLeft:2, cursor:"grab" }}>
          <div style={{ display:"flex", gap:2 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
          </div>
          <div style={{ display:"flex", gap:2 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
          </div>
          <div style={{ display:"flex", gap:2 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
          </div>
        </div>
      )}
      <button className="hov" onClick={()=>onToggle(item.id)} style={{
        width:27, height:27, minWidth:27, maxWidth:27, borderRadius:"50%",
        background: item.approved ? C.primary : "transparent",
        border:`2px solid ${item.approved ? C.primary : "#BDBDBD"}`,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        color:"#fff", fontSize:13, cursor:"pointer", padding:0,
      }}>{item.approved ? "✓" : ""}</button>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:500, fontSize:15, color:C.text,
          textDecoration:item.approved?"line-through":"none",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          letterSpacing:"0.1px",
        }}>{item.title}</div>
        <div style={{ display:"flex", gap:7, marginTop:5, flexWrap:"wrap", alignItems:"center" }}>
          {!item.approved && <UrgencyBadge urgency={item.urgency} />}
          <Tag color={C.primary}>{item.assignee}</Tag>
          <span style={{ color:C.textMuted, fontSize:11 }}>📅 {item.due}</span>
        </div>
      </div>

      <button className="hov" onClick={()=>onRemove(item.id)} style={{
        background:"none", color:"#BDBDBD", fontSize:22, padding:4, border:"none", cursor:"pointer", flexShrink:0,
      }}>×</button>
    </div>
  );
}

function UrgencyBadge({ urgency, small }) {
  const u = URGENCY[urgency] || URGENCY.medium;
  return (
    <span style={{
      background:u.bg, color:u.color,
      fontSize:small?10:11, fontWeight:500,
      padding:small?"1px 7px":"2px 9px", borderRadius:99,
      letterSpacing:"0.3px",
      border:`1px solid ${u.color}33`, flexShrink:0,
    }}>{u.icon} {u.label}</span>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHOPPING
═══════════════════════════════════════════════════════════ */
/* Auto-assign emoji based on Hebrew keyword matching */
function autoEmoji(label) {
  const l = label.toLowerCase();
  const map = [
    ["ביצ", "🥚"], ["חלב", "🥛"], ["גמב", "🫑"], ["פית", "🫓"], ["לחם", "🍞"],
    ["קולה", "🥤"], ["שניצ", "🍗"], ["אקטימל", "🍶"], ["יוגורט", "🫙"],
    ["קוטג", "🧀"], ["חומוס", "🫘"], ["חטיף", "🍿"], ["מעדנ", "🍮"],
    ["תפוח אד", "🥔"], ["תפוח", "🍎"], ["בננ", "🍌"], ["בצל", "🧅"],
    ["גבינה צ", "🧀"], ["גבינ", "🫕"], ["סמוצ", "🧃"], ["בשר", "🥩"],
    ["דג", "🐟"], ["עוף", "🍗"], ["ירק", "🥦"], ["פרי", "🍓"],
    ["מיץ", "🧃"], ["שמן", "🫙"], ["סוכר", "🍬"], ["קפה", "☕"],
    ["תה", "🍵"], ["שוקולד", "🍫"], ["עוגה", "🎂"], ["לימון", "🍋"],
    ["עגבנ", "🍅"], ["מלפפ", "🥒"], ["גזר", "🥕"], ["תפוז", "🍊"],
    ["אבוקד", "🥑"], ["פסטה", "🍝"], ["אורז", "🍚"], ["לבן", "🥛"],
  ];
  for (const [kw, emoji] of map) {
    if (l.includes(kw)) return emoji;
  }
  return "🛍️";
}

const DEFAULT_QUICK_ITEMS = [
  { label:"ביצים",           icon:"🥚" },
  { label:"חלב",             icon:"🥛" },
  { label:"גמבה",            icon:"🫑" },
  { label:"פיתות",           icon:"🫓" },
  { label:"לחם",             icon:"🍞" },
  { label:"קולה זירו",       icon:"🥤" },
  { label:"שניצל",           icon:"🍗" },
  { label:"אקטימל",          icon:"🍶" },
  { label:"יוגורט",          icon:"🫙" },
  { label:"קוטג'",           icon:"🧀" },
  { label:"חומוס",           icon:"🫘" },
  { label:"חטיפים",          icon:"🍿" },
  { label:"מעדנים למילה",    icon:"🍮" },
  { label:"תפוחים",          icon:"🍎" },
  { label:"בננות",           icon:"🍌" },
  { label:"בצל",             icon:"🧅" },
  { label:"גבינה צהובה",     icon:"🧀" },
  { label:"סמוצ'י",          icon:"🧃" },
  { label:"תפוח אדמה",       icon:"🥔" },
];

function ShoppingTab({ shopping, showAddS, setShowAddS, newS, setNewS,
  addShoppingItem, toggleShopping, removeShopping, addQuickItem,
  addBudgetEntry, setTab }) {
  const [quickItems, setQuickItems] = useState(DEFAULT_QUICK_ITEMS);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItem, setCustomItem] = useState({ label:"", qty:1 });
  const [qtyPicker, setQtyPicker] = useState(null);
  const [showFinish, setShowFinish] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");

  const pendingRaw = shopping.filter(s => !s.approved);
  const approved = shopping.filter(s => s.approved);
  const activeLabels = new Set(pendingRaw.map(s => s.item));

  const { items: pending, dragIdx: sDragIdx, getDragProps: getSDragProps } = useDragSort(pendingRaw);

  function toggle(id) { toggleShopping(id); }
  function remove(id) { removeShopping(id); }

  function handleGridClick(qi) {
    const existing = shopping.find(s => s.item===qi.label && !s.approved);
    if (existing) {
      removeShopping(existing.id);
    } else {
      setQtyPicker({ qi, qty:1 });
    }
  }

  function confirmQtyAdd() {
    if (!qtyPicker) return;
    addShoppingItem({ item:qtyPicker.qi.label, qty:String(qtyPicker.qty), approved:false, icon:qtyPicker.qi.icon });
    setQtyPicker(null);
  }

  function addCustom() {
    if (!customItem.label.trim()) return;
    const icon = autoEmoji(customItem.label);
    const newQI = { label:customItem.label.trim(), icon };
    setQuickItems(prev => [...prev, newQI]);
    addShoppingItem({ item:newQI.label, qty:String(customItem.qty), approved:false, icon });
    addQuickItem(newQI);
    setCustomItem({ label:"", qty:1 });
    setShowCustomForm(false);
  }

  async function finishShopping() {
    if (!finalAmount || isNaN(Number(finalAmount))) return;
    const purchased = shopping.filter(s => s.approved).map(s => s.item).join(", ");
    await addBudgetEntry(Number(finalAmount), purchased ? `קנייה: ${purchased}` : "קנייה");
    shopping.filter(s => s.approved).forEach(s => removeShopping(s.id));
    setFinalAmount("");
    setShowFinish(false);
    setTab("budget");
  }

  return (
    <div className="fade-up">
      <SectionHeader title="רשימת קניות" icon="🛒" count={pending.length} label="פריטים" onAdd={()=>setShowCustomForm(!showCustomForm)} addLabel="פריט חדש" />

      {/* Custom item form */}
      {showCustomForm && (
        <AddForm onAdd={addCustom} onCancel={()=>setShowCustomForm(false)}>
          <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:4 }}>הוסף פריט חדש לרשת הבחירה המהירה</div>
          <input value={customItem.label} onChange={e=>setCustomItem({...customItem,label:e.target.value})}
            placeholder="שם הפריט" style={IS} />
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:6 }}>כמות</div>
            <QtySelector qty={customItem.qty} onChange={qty=>setCustomItem({...customItem,qty})} />
          </div>
        </AddForm>
      )}

      {/* Qty picker modal */}
      {qtyPicker && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.35)", zIndex:500,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }} onClick={()=>setQtyPicker(null)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:20, padding:24, width:"min(320px,90vw)",
            boxShadow:"0 12px 40px rgba(0,0,0,0.2)", direction:"rtl",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <span style={{ fontSize:36 }}>{qtyPicker.qi.icon}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:C.text }}>{qtyPicker.qi.label}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>כמה להוסיף לרשימה?</div>
              </div>
            </div>
            <QtySelector qty={qtyPicker.qty} onChange={qty=>setQtyPicker({...qtyPicker,qty})} large />
            <div style={{ display:"flex", gap:8, marginTop:18 }}>
              <button className="hov" onClick={confirmQtyAdd} style={{
                flex:1, background:C.primary, color:"#fff", border:"none",
                borderRadius:12, padding:"11px", fontFamily:"inherit", fontWeight:700, fontSize:14, cursor:"pointer",
              }}>הוסף לרשימה</button>
              <button className="hov" onClick={()=>setQtyPicker(null)} style={{
                background:C.border, color:C.text, border:"none",
                borderRadius:12, padding:"11px 16px", fontFamily:"inherit", fontWeight:600, fontSize:14, cursor:"pointer",
              }}>ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick-select grid ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:10 }}>בחירה מהירה — לחץ להוסיף לרשימה:</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(82px, 1fr))", gap:8 }}>
          {quickItems.map((qi, i) => {
            const isActive = activeLabels.has(qi.label);
            return (
              <button key={i} className="hov" onClick={()=>handleGridClick(qi)} style={{
                padding:"10px 6px", borderRadius:14, cursor:"pointer",
                background: isActive ? `${C.primary}18` : C.card,
                border:`2px solid ${isActive ? C.primary : C.border}`,
                display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                fontFamily:"inherit", transition:"all 0.16s",
                boxShadow: isActive ? `0 2px 10px ${C.primary}25` : "0 1px 4px rgba(0,0,0,0.05)",
                position:"relative",
              }}>
                {isActive && (
                  <div style={{
                    position:"absolute", top:5, left:5, width:17, height:17, borderRadius:"50%",
                    background:C.primary, color:"#fff", fontSize:10, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>✓</div>
                )}
                <span style={{ fontSize:26 }}>{qi.icon}</span>
                <span style={{ fontSize:10, fontWeight:isActive?700:500,
                  color:isActive?C.primary:C.text, textAlign:"center", lineHeight:1.3 }}>
                  {qi.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Divider label="רשימת הקניות" />

      {pending.length===0 && <EmptyState text="הרשימה ריקה — בחר פריטים למעלה 🛍️" />}
      {pending.map((s,i) => (
        <div key={s.id} {...getSDragProps(i)} style={{
          ...getSDragProps(i).style,
          boxShadow: sDragIdx===i ? "0 8px 24px rgba(0,0,0,0.2)" : "none",
          zIndex: sDragIdx===i ? 10 : 1, position:"relative",
        }}>
          <ShopCard item={s} onToggle={toggle} onRemove={remove} showHandle />
        </div>
      ))}

      {approved.length > 0 && (
        <>
          <Divider label={`נרכשו (${approved.length})`} />
          {approved.map(s => <ShopCard key={s.id} item={s} onToggle={toggle} onRemove={remove} />)}
        </>
      )}

      {/* Finish shopping button */}
      {approved.length > 0 && (
        <button className="hov" onClick={()=>setShowFinish(true)} style={{
          width:"100%", marginTop:16, padding:"14px",
          borderRadius:24,
          background: C.headerGrad,
          color:"#fff", border:"none", fontSize:14,
          fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center",
          justifyContent:"center", gap:10,
          boxShadow:`0 6px 20px rgba(76,175,80,0.45)`,
          letterSpacing:"0.8px", textTransform:"uppercase",
        }}>
          <span style={{ fontSize:20 }}>🛒</span>
          סיום קנייה ({approved.length} פריטים)
        </button>
      )}

      {/* Finish shopping modal */}
      {showFinish && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:500,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }} onClick={()=>setShowFinish(false)}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:C.card, borderRadius:4, padding:0, width:"min(340px,90vw)",
            boxShadow:C.shadowDeep, direction:"rtl", overflow:"hidden",
          }}>
            <div style={{ background:C.headerGrad, padding:"24px 24px 20px", color:"#fff" }}>
              <div style={{ fontSize:32, marginBottom:4 }}>🛒</div>
              <h3 style={{ fontSize:20, fontWeight:500, letterSpacing:"0.2px" }}>סיום קנייה</h3>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginTop:4, fontWeight:400 }}>
                {approved.length} פריטים נרכשו — כמה שילמת?
              </p>
            </div>
            <div style={{ padding:"20px 24px 24px" }}>
              <div style={{ position:"relative", marginBottom:20 }}>
                <input
                  type="number" value={finalAmount}
                  onChange={e=>setFinalAmount(e.target.value)}
                  placeholder="סכום בש״ח"
                  style={{ ...IS, fontSize:24, fontWeight:300, textAlign:"center", paddingLeft:36, border:"none", borderBottom:`2px solid ${C.primary}`, borderRadius:0 }}
                  autoFocus
                />
                <span style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", fontSize:18, color:C.textMuted }}>₪</span>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button className="hov" onClick={()=>setShowFinish(false)} style={{
                  padding:"10px 18px", borderRadius:24, background:"transparent",
                  color:C.textMuted, border:"none", fontWeight:500,
                  fontSize:13, cursor:"pointer", letterSpacing:"0.5px", textTransform:"uppercase",
                }}>ביטול</button>
                <button className="hov" onClick={finishShopping} style={{
                  padding:"10px 24px", borderRadius:24, background:C.primary,
                  color:"#fff", border:"none", fontWeight:500,
                  fontSize:13, cursor:"pointer", letterSpacing:"0.5px", textTransform:"uppercase",
                  boxShadow:"0 3px 8px rgba(76,175,80,0.4)",
                }}>שמור וסיים</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Quantity selector ── */
function QtySelector({ qty, onChange, large }) {
  const sz = large ? 38 : 30;
  const fs = large ? 18 : 14;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <button className="hov" onClick={()=>onChange(Math.max(1, qty-1))} style={{
        width:sz, height:sz, borderRadius:10, background:C.border, border:"none",
        fontSize:fs+2, fontWeight:700, cursor:"pointer", color:C.text,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>−</button>
      <span style={{ minWidth:36, textAlign:"center", fontSize:large?22:16, fontWeight:800, color:C.text }}>{qty}</span>
      <button className="hov" onClick={()=>onChange(qty+1)} style={{
        width:sz, height:sz, borderRadius:10, background:C.primary, border:"none",
        fontSize:fs+2, fontWeight:700, cursor:"pointer", color:"#fff",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>+</button>
    </div>
  );
}

function ShopCard({ item, onToggle, onRemove, delay=0, showHandle=false }) {
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:4, padding:"13px 16px", marginBottom:8,
      boxShadow: C.shadow, display:"flex", alignItems:"center", gap:12,
      opacity:item.approved ? 0.55 : 1,
      animation: delay ? `fadeUp 0.3s ${delay}s cubic-bezier(0.4,0,0.2,1) both` : "none",
    }}>
      {showHandle && (
        <div style={{ flexShrink:0, display:"flex", flexDirection:"column", gap:2, paddingLeft:2, cursor:"grab" }}>
          <div style={{ display:"flex", gap:2 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
          </div>
          <div style={{ display:"flex", gap:2 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
          </div>
          <div style={{ display:"flex", gap:2 }}>
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
            <div style={{ width:3, height:3, borderRadius:"50%", background:"#BDBDBD" }} />
          </div>
        </div>
      )}
      <button className="hov" onClick={()=>onToggle(item.id)} style={{
        width:27, height:27, minWidth:27, maxWidth:27, borderRadius:3,
        background:item.approved ? C.primary : "transparent",
        border:`2px solid ${item.approved ? C.primary : "#BDBDBD"}`,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
        color:"#fff", fontSize:13, cursor:"pointer", padding:0,
      }}>{item.approved ? "✓" : ""}</button>
      {item.icon && <span style={{ fontSize:22, flexShrink:0 }}>{item.icon}</span>}
      <div style={{ flex:1 }}>
        <span style={{ fontWeight:500, fontSize:15, color:C.text, letterSpacing:"0.1px",
          textDecoration:item.approved ? "line-through" : "none" }}>{item.item}</span>
      </div>
      {item.qty && item.qty !== "1" && (
        <div style={{
          background:`${C.primary}15`, color:C.primary,
          borderRadius:99, padding:"3px 12px", fontSize:12, fontWeight:500, flexShrink:0,
          letterSpacing:"0.3px",
        }}>×{item.qty}</div>
      )}
      <button className="hov" onClick={()=>onRemove(item.id)} style={{
        background:"none", color:"#BDBDBD", fontSize:22, padding:4, border:"none", cursor:"pointer",
      }}>×</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR
═══════════════════════════════════════════════════════════ */
function CalendarTab({ events, calendarDate, setCalendarDate, calView, setCalView,
  today, showAddE, setShowAddE, newE, setNewE, notify, addEvent: addEventDB, removeEvent }) {

  const [selectedDay, setSelectedDay] = useState(null);

  function addEvent() {
    if (!newE.title.trim() || !newE.date) return;
    const [y,m,d] = newE.date.split("-").map(Number);
    const ev = { title:newE.title, date:new Date(y,m-1,d), time:newE.time||"", category:newE.category };
    addEventDB(ev);
    setNewE({ title:"", date:"", time:"", category:"גלעד" });
    setShowAddE(false);
  }

  function handleAddClick() {
    // Pre-fill date from selected calendar day if available
    if (selectedDay && !showAddE) {
      const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
      const dateStr = `${y}-${String(m+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`;
      setNewE(prev => ({ ...prev, date: dateStr }));
    }
    setShowAddE(!showAddE);
  }

  const upcoming = [...events].filter(e=>e.date>=today).sort((a,b)=>a.date-b.date).slice(0,8);

  return (
    <div className="fade-up">
      <SectionHeader title="לוח שנה" icon="📅" onAdd={handleAddClick} />

      {showAddE && (
        <AddForm onAdd={addEvent} onCancel={()=>setShowAddE(false)}>
          <input value={newE.title} onChange={e=>setNewE({...newE,title:e.target.value})} placeholder="שם האירוע" style={IS} />
          <input type="date" value={newE.date} onChange={e=>setNewE({...newE,date:e.target.value})} style={IS} />
          <input type="time" value={newE.time} onChange={e=>setNewE({...newE,time:e.target.value})} style={{...IS, direction:"ltr", textAlign:"right"}} placeholder="שעה (אופציונלי)" />
          <select value={newE.category} onChange={e=>setNewE({...newE,category:e.target.value})} style={IS}>
            {["גלעד","ואלרי","דין","מילה","נוגה","ימי הולדת","אחר"].map(c=><option key={c}>{c}</option>)}
          </select>
        </AddForm>
      )}

      {/* View toggle buttons - קרובים first */}
      <div style={{ display:"flex", gap:0, marginBottom:16, background:C.card, borderRadius:4, boxShadow:C.shadow, overflow:"hidden" }}>
        {[{key:"upcoming",label:"קרובים"},{key:"monthly",label:"חודשי"}].map(v=>(
          <button key={v.key} className="hov" onClick={()=>setCalView(v.key)} style={{
            flex:1, padding:"12px 20px", borderRadius:0,
            background: calView===v.key ? C.primary : "transparent",
            color: calView===v.key ? "#fff" : C.textMuted,
            fontWeight: calView===v.key ? 700 : 400,
            fontSize:13, border:"none", cursor:"pointer",
            borderBottom: calView===v.key ? `3px solid ${C.primaryDark}` : "3px solid transparent",
            letterSpacing:"0.5px", textTransform:"uppercase",
            transition:"all 0.2s",
          }}>{v.label}</button>
        ))}
      </div>

      {calView==="upcoming" && <UpcomingList events={upcoming} removeEvent={removeEvent} />}
      {calView==="monthly" && (
        <MonthlyCalendar
          calendarDate={calendarDate} setCalendarDate={setCalendarDate}
          events={events} today={today} removeEvent={removeEvent}
          selectedDay={selectedDay} setSelectedDay={setSelectedDay}
        />
      )}
    </div>
  );
}

function MonthlyCalendar({ calendarDate, setCalendarDate, events, today, removeEvent, selectedDay, setSelectedDay }) {
  const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
  const cells = [];
  for (let i=0; i<getFirstDay(y,m); i++) cells.push(null);
  for (let d=1; d<=getDaysInMonth(y,m); d++) cells.push(d);
  function dayEvs(day) { return events.filter(e=>e.date.getFullYear()===y&&e.date.getMonth()===m&&e.date.getDate()===day); }
  const selEvs = selectedDay ? dayEvs(selectedDay) : [];

  return (
    <div>
      {/* nav */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:12, background:C.card, borderRadius:4,
        padding:"12px 20px", boxShadow:C.shadow,
      }}>
        <button className="hov" onClick={()=>setCalendarDate(new Date(y,m-1,1))} style={NBS}>›</button>
        <span style={{ fontWeight:500, fontSize:17, color:C.text, letterSpacing:"0.3px" }}>{MONTHS_HE[m]} {y}</span>
        <button className="hov" onClick={()=>setCalendarDate(new Date(y,m+1,1))} style={NBS}>‹</button>
      </div>

      {/* grid */}
      <div style={{ background:C.card, borderRadius:4, padding:14, boxShadow:C.shadow }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:8 }}>
          {DAYS_HE.map(d=>(
            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:500, color:C.textMuted, padding:"4px 0", letterSpacing:"0.5px" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cells.map((day,i)=>{
            if (!day) return <div key={`x${i}`} />;
            const de  = dayEvs(day);
            const isT = isSameDay(new Date(y,m,day), today);
            const isS = selectedDay===day;
            return (
              <div key={day} className="cal-cell" onClick={()=>setSelectedDay(isS?null:day)} style={{
                borderRadius: isT || isS ? "50%" : 4,
                padding:"5px 3px", minHeight:44, cursor:"pointer",
                background: isS ? C.primary : isT ? C.primary : "transparent",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                transition:"background 0.15s",
              }}>
                <span style={{ fontSize:12, fontWeight: isT||isS ? 700 : 400,
                  color: isS||isT ? "#fff" : C.text }}>{day}</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:2, justifyContent:"center" }}>
                  {de.slice(0,3).map((e,idx)=>(
                    <div key={idx} style={{ width:5, height:5, borderRadius:"50%",
                      background: isS||isT ? "rgba(255,255,255,0.8)" : CATEGORY_COLORS[e.category]||C.accent }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="slide-in" style={{ marginTop:14 }}>
          <div style={{ fontWeight:500, fontSize:14, color:C.text, marginBottom:10, letterSpacing:"0.2px" }}>
            אירועים ב-{selectedDay}/{m+1}/{y}
          </div>
          {selEvs.length===0
            ? <EmptyState text="אין אירועים ביום זה" />
            : selEvs.map(e=><EventCard key={e.id} event={e} onRemove={id=>removeEvent(id)} />)
          }
        </div>
      )}

      <div style={{ display:"flex", gap:14, marginTop:14, flexWrap:"wrap" }}>
        {Object.entries(CATEGORY_COLORS).map(([cat,color])=>(
          <div key={cat} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:11, color:C.textMuted, fontWeight:400 }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingList({ events, removeEvent }) {
  if (!events.length) return <EmptyState text="אין אירועים קרובים 📭" />;
  return <div>{events.map(e=><EventCard key={e.id} event={e} showDate onRemove={id=>removeEvent(id)} />)}</div>;
}

function EventCard({ event, onRemove, showDate }) {
  const color = CATEGORY_COLORS[event.category] || C.accent;
  const DAYS_FULL = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
  const dayName = showDate && event.date instanceof Date ? DAYS_FULL[event.date.getDay()] : null;
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:4, padding:"13px 16px", marginBottom:10,
      boxShadow: C.shadow, display:"flex", alignItems:"center", gap:12,
      borderRight:`4px solid ${color}`,
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:500, fontSize:15, color:C.text, display:"flex", alignItems:"center", gap:8, letterSpacing:"0.1px" }}>
          {event.title}
          {event.time && <span style={{ color:C.textMuted, fontSize:13, fontWeight:400 }}>🕐 {event.time}</span>}
        </div>
        <div style={{ display:"flex", gap:8, marginTop:5, alignItems:"center", flexWrap:"wrap" }}>
          {showDate && (
            <span style={{ color:C.textMuted, fontSize:12 }}>
              📅 יום {dayName}، {formatDate(event.date)}
            </span>
          )}
          <span style={{ background:`${color}18`, color, fontSize:11, fontWeight:500, padding:"2px 9px", borderRadius:99, letterSpacing:"0.3px" }}>
            {event.category}
          </span>
        </div>
      </div>
      <button className="hov" onClick={()=>onRemove(event.id)} style={{
        background:"none", color:"#BDBDBD", fontSize:22, padding:4, border:"none", cursor:"pointer",
      }}>×</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BUDGET
═══════════════════════════════════════════════════════════ */
function BudgetTab({ budgetEntries, monthlyLimit, setMonthlyLimit, removeBudgetEntry }) {
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState(String(monthlyLimit || ""));

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const MONTHS_HE_FULL = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

  // Group entries by month
  const grouped = {};
  budgetEntries.forEach(e => {
    if (!grouped[e.month]) grouped[e.month] = [];
    grouped[e.month].push(e);
  });
  const sortedMonths = Object.keys(grouped).sort((a,b) => b.localeCompare(a));

  const thisMonthEntries = grouped[currentMonth] || [];
  const thisMonthTotal = thisMonthEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  const progress = monthlyLimit > 0 ? Math.min(thisMonthTotal / monthlyLimit * 100, 100) : 0;
  const remaining = monthlyLimit > 0 ? monthlyLimit - thisMonthTotal : null;
  const overBudget = remaining !== null && remaining < 0;

  function formatMonthLabel(monthStr) {
    const [y, m] = monthStr.split("-");
    return `${MONTHS_HE_FULL[parseInt(m)-1]} ${y}`;
  }

  function saveLimit() {
    const val = Number(limitInput);
    if (!isNaN(val) && val >= 0) setMonthlyLimit(val);
    setEditingLimit(false);
  }

  return (
    <div className="fade-up">
      <SectionHeader title="תקציב חודשי" icon="💰" />

      {/* Monthly summary card — Material header style */}
      <div style={{
        background: overBudget ? "#B71C1C" : C.headerGrad,
        borderRadius:4, padding:"24px 24px 20px", marginBottom:20,
        boxShadow: C.shadowDeep, color:"#fff",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:400, marginBottom:4, letterSpacing:"0.5px", textTransform:"uppercase" }}>הוצאות החודש</div>
            <div style={{ fontSize:36, fontWeight:300, letterSpacing:"-0.5px" }}>
              ₪{thisMonthTotal.toLocaleString()}
            </div>
            {remaining !== null && (
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.85)", fontWeight:400, marginTop:4 }}>
                {overBudget ? `⚠️ חריגה של ₪${Math.abs(remaining).toLocaleString()}` : `✅ נותרו ₪${remaining.toLocaleString()}`}
              </div>
            )}
          </div>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:400, marginBottom:6, letterSpacing:"0.5px", textTransform:"uppercase" }}>תקציב חודשי</div>
            {editingLimit ? (
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input type="number" value={limitInput} onChange={e=>setLimitInput(e.target.value)}
                  style={{ ...IS, width:100, fontSize:16, fontWeight:500, textAlign:"center", padding:"6px 8px", background:"rgba(255,255,255,0.2)", color:"#fff", border:"none", borderBottom:"2px solid rgba(255,255,255,0.8)" }}
                  autoFocus onKeyDown={e=>e.key==="Enter"&&saveLimit()} />
                <button className="hov" onClick={saveLimit} style={{
                  background:"rgba(255,255,255,0.25)", color:"#fff", border:"none", borderRadius:24,
                  padding:"7px 14px", fontWeight:500, cursor:"pointer", fontSize:12, letterSpacing:"0.5px",
                }}>✓</button>
              </div>
            ) : (
              <button className="hov" onClick={()=>{ setLimitInput(String(monthlyLimit||"")); setEditingLimit(true); }} style={{
                background:"rgba(255,255,255,0.18)", color:"#fff", border:"none",
                borderRadius:24, padding:"8px 18px", fontWeight:500,
                cursor:"pointer", fontSize:15, letterSpacing:"0.2px",
              }}>
                {monthlyLimit > 0 ? `₪${monthlyLimit.toLocaleString()}` : "הגדר תקציב"}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {monthlyLimit > 0 && (
          <div>
            <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:2, height:6, overflow:"hidden" }}>
              <div style={{
                width:`${progress}%`, height:"100%", borderRadius:2,
                background: overBudget ? "#EF9A9A" : progress > 80 ? "#FFB74D" : "#A5D6A7",
                transition:"width 0.6s cubic-bezier(0.4,0,0.2,1)",
              }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>₪0</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.9)", fontWeight:500 }}>{Math.round(progress)}%</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>₪{monthlyLimit.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {sortedMonths.length === 0 && <EmptyState text="אין עדיין רשומות קניות 🛍️" />}
      {sortedMonths.map(month => (
        <div key={month} style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontWeight:500, fontSize:14, color:C.text, letterSpacing:"0.2px" }}>{formatMonthLabel(month)}</span>
            <span style={{ fontWeight:700, fontSize:14, color:C.primary }}>
              ₪{grouped[month].reduce((s,e)=>s+Number(e.amount),0).toLocaleString()}
            </span>
          </div>
          {grouped[month].map(entry => (
            <div key={entry.id} style={{
              background:C.card, borderRadius:4, padding:"13px 16px", marginBottom:8,
              boxShadow:C.shadow, display:"flex", alignItems:"center", gap:12,
              borderRight:`4px solid ${C.primary}`,
            }}>
              <span style={{ fontSize:22 }}>🛒</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:15, color:C.text }}>₪{Number(entry.amount).toLocaleString()}</div>
                {entry.note && <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{entry.note}</div>}
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                  {new Date(entry.created_at).toLocaleDateString("he-IL")}
                </div>
              </div>
              <button className="hov" onClick={()=>removeBudgetEntry(entry.id)} style={{
                background:"none", color:"#BDBDBD", fontSize:22, padding:4, border:"none", cursor:"pointer",
              }}>×</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── SHARED ─── */
function SectionHeader({ title, icon, count, label, onAdd, addLabel }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <h2 style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"0.2px" }}>{title}</h2>
        {count !== undefined && (
          <div style={{
            background:C.primary, color:"#fff", borderRadius:99,
            padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:"0.5px",
          }}>
            {count} {label}
          </div>
        )}
      </div>
      {onAdd && (
        <button className="hov" onClick={onAdd} style={{
          background:C.primary, color:"#fff", border:"none",
          borderRadius:24, padding:"9px 20px",
          fontSize:13, fontWeight:500, cursor:"pointer",
          display:"flex", alignItems:"center", gap:6,
          boxShadow:"0 3px 8px rgba(76,175,80,0.4)",
          letterSpacing:"0.5px",
          textTransform:"uppercase",
        }}>
          + {addLabel || "הוסף"}
        </button>
      )}
    </div>
  );
}

function AddForm({ children, onAdd, onCancel }) {
  return (
    <div className="slide-in" style={{
      background:C.card, borderRadius:4, padding:20, marginBottom:20,
      boxShadow: C.shadowDeep,
      display:"flex", flexDirection:"column", gap:12,
    }}>
      {children}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
        <button className="hov" onClick={onCancel} style={{
          background:"transparent", color:C.textMuted, border:"none",
          padding:"9px 18px", fontWeight:500, fontSize:13, cursor:"pointer",
          borderRadius:24, letterSpacing:"0.5px", textTransform:"uppercase",
        }}>ביטול</button>
        <button className="hov" onClick={onAdd} style={{
          background:C.primary, color:"#fff", border:"none",
          borderRadius:24, padding:"9px 24px",
          fontWeight:500, fontSize:13, cursor:"pointer",
          boxShadow:"0 3px 8px rgba(76,175,80,0.4)",
          letterSpacing:"0.5px", textTransform:"uppercase",
        }}>שמור</button>
      </div>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ margin:"20px 0 12px", display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:1, background:C.border }} />
      <span style={{ color:C.textMuted, fontSize:11, fontWeight:500, letterSpacing:"0.8px", textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{ background:`${color}18`, color, fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:99, letterSpacing:"0.3px" }}>
      {children}
    </span>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign:"center", padding:"36px 0", color:C.textMuted, fontSize:14, fontWeight:400, letterSpacing:"0.2px" }}>
      {text}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      background:`${color}15`,
      borderRadius:99, padding:"6px 16px", textAlign:"center",
      minWidth:64, display:"flex", alignItems:"center", gap:6,
    }}>
      <div style={{ fontSize:18, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:11, color, fontWeight:500, opacity:0.8, letterSpacing:"0.3px" }}>{label}</div>
    </div>
  );
}

const IS = {
  width:"100%", padding:"10px 14px",
  borderRadius:4, border:`1px solid ${C.border}`,
  borderBottom:`2px solid ${C.border}`,
  fontSize:14, color:C.text, background:C.card, direction:"rtl",
  transition:"border-color 0.2s",
};
const NBS = {
  background:C.border, border:"none", width:32, height:32, borderRadius:4,
  fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
};