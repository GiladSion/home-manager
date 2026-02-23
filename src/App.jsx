import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─── SUPABASE ─── */
const SUPABASE_URL = "https://uqfpbgjetppfesbavgwu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZnBiZ2pldHBwZmVzYmF2Z3d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTA1ODEsImV4cCI6MjA4NzM2NjU4MX0.X5eGqiF-sH_rNBF2zpJp7NrbiruTlmAagDcCdhYi2UU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── THEME ─── */
const C = {
  bg: "#F4F7F2", card: "#FFFFFF", primary: "#3A6B3E", primaryLight: "#7AAF7E",
  secondary: "#2E7D32", secondaryLight: "#A5D6A7", accent: "#D4A017",
  text: "#1A2E1C", textMuted: "#5C7A5E", border: "#C8DBC9",
  danger: "#C0392B", purple: "#6B8F71",
};

const URGENCY = {
  high:   { label: "דחוף",  color: "#8B2500", bg: "#FDECEA", icon: "🔴" },
  medium: { label: "בינוני", color: "#B8862A", bg: "#FDF6E3", icon: "🟡" },
  low:    { label: "נמוך",  color: "#3A6B3E", bg: "#EDF4EE", icon: "🟢" },
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

/* ─── TOAST UI ─── */
function ToastContainer({ toasts }) {
  const types = {
    info:     { bg: C.primary,   icon: "ℹ️" },
    success:  { bg: C.secondary, icon: "✅" },
    event:    { bg: C.purple,    icon: "📅" },
    shopping: { bg: "#B8862A",   icon: "🛒" },
    warning:  { bg: "#C0392B",   icon: "⚠️" },
  };
  return (
    <div style={{
      position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
      width: "min(94vw, 370px)", pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const s = types[t.type] || types.info;
        return (
          <div key={t.id} style={{
            background: s.bg, color: "#fff", borderRadius: 14, padding: "12px 16px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", gap: 10,
            animation: "toastIn 0.3s ease",
            fontFamily: "Heebo, sans-serif", fontSize: 13, fontWeight: 600, direction: "rtl",
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
  const today = new Date();
  const [tab, setTab] = useState("home");
  const { permission, muted, requestPermission, notify, toasts } = useNotifications();

  const [assignments, setAssignments] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [calendarDate, setCalendarDate] = useState(today);
  const [calView, setCalView] = useState("monthly");
  const [showAddA, setShowAddA] = useState(false);
  const [showAddS, setShowAddS] = useState(false);
  const [showAddE, setShowAddE] = useState(false);
  const [newA, setNewA] = useState({ title: "", assignee: "ואלרי", due: "", urgency: "medium" });
  const [newS, setNewS] = useState({ item: "", qty: "" });
  const [newE, setNewE] = useState({ title: "", date: "", category: "גלעד" });

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
  }
  async function removeEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    await supabase.from("events").delete().eq("id", id);
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
  };

  const TABS = [
    { key: "home",        label: "בית",      icon: "🏠" },
    { key: "assignments", label: "משימות",   icon: "✅" },
    { key: "shopping",    label: "קניות",    icon: "🛒" },
    { key: "calendar",    label: "לוח שנה",  icon: "📅" },
  ];

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Heebo','Assistant',sans-serif", direction: "rtl" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        .hov { transition: all 0.17s ease; }
        .hov:hover { opacity: 0.86; transform: translateY(-1px); }
        .hov:active { transform: scale(0.97); }
        .chov { transition: box-shadow 0.2s; }
        .chov:hover { box-shadow: 0 6px 22px rgba(58,107,62,0.14) !important; }
        .sidebar-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .sidebar-btn.active { background: rgba(255,255,255,0.18) !important; }
        input, select { outline: none; font-family: Heebo, sans-serif; }
        button { font-family: Heebo, sans-serif; }
        .urgency-group { display: flex; gap: 8px; justify-content: flex-start; flex-wrap: nowrap; }
        .urgency-btn { width: 90px !important; flex: 0 0 90px !important; min-width: 0; }
        .check-circle { width: 27px !important; height: 27px !important; flex: 0 0 27px !important; border-radius: 50% !important; }
        .check-square { width: 27px !important; height: 27px !important; flex: 0 0 27px !important; border-radius: 8px !important; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(-12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up  { animation: fadeUp  0.35s ease both; }
        .slide-in { animation: slideIn 0.28s ease both; }
        .cal-cell:hover { background: ${C.border} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      {loading && (
        <div style={{
          position:"fixed", inset:0, background:C.bg, zIndex:9999,
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16,
        }}>
          <span style={{ fontSize:40 }}>🏡</span>
          <div style={{
            width:36, height:36, borderRadius:"50%",
            border:`3px solid ${C.border}`, borderTopColor:C.primary,
            animation:"spin 0.8s linear infinite",
          }} />
          <p style={{ color:C.textMuted, fontFamily:"Heebo,sans-serif", fontSize:14, fontWeight:600 }}>טוען נתונים...</p>
        </div>
      )}
      <style>{`
        /* ── DESKTOP layout ── */
        .app-shell { display: flex; min-height: 100vh; }
        .sidebar {
          width: 240px; flex-shrink: 0;
          background: linear-gradient(180deg, #264D29 0%, #1A3A1C 100%);
          display: flex; flex-direction: column;
          position: fixed; top: 0; right: 0; bottom: 0;
          z-index: 100; padding: 0 0 24px;
          box-shadow: -4px 0 24px rgba(0,0,0,0.15);
        }
        .sidebar-logo {
          padding: 28px 24px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          margin-bottom: 16px;
        }
        .sidebar-nav { flex: 1; padding: 0 14px; display: flex; flex-direction: column; gap: 4px; }
        .sidebar-footer { padding: 0 14px; }
        .main-content {
          margin-right: 240px;
          margin-left: 0;
          flex: 1;
          min-height: 100vh;
          width: calc(100vw - 240px);
        }
        .topbar {
          background: ${C.card};
          border-bottom: 1px solid ${C.border};
          padding: 16px 36px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 50;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          width: 100%;
        }
        .page-body {
          padding: 32px 36px 48px;
          max-width: 960px;
          width: 100%;
          margin: 0 auto;
        }
        .mobile-header { display: none; }
        .mobile-tabbar { display: none; }

        /* ── MOBILE layout ── */
        @media (max-width: 768px) {
          .app-shell { display: block; }
          .sidebar { display: none; }
          .main-content {
            margin-right: 0;
            margin-left: 0;
            width: 100vw;
          }
          .topbar { display: none; }
          .page-body { padding: 16px 16px 90px; max-width: 100%; }
          .mobile-header { display: block; }
          .mobile-tabbar {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: ${C.card}; border-top: 1px solid ${C.border};
            z-index: 100; padding: 8px 10px 12px; gap: 4px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
          }
        }
      `}</style>

      <ToastContainer toasts={toasts} />

      <div className="app-shell">

        {/* ══ SIDEBAR (desktop) ══ */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <span style={{ fontSize:26 }}>🏡</span>
              <span style={{ color:"#fff", fontSize:20, fontWeight:900, letterSpacing:"-0.3px" }}>בית חכם</span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.55)", fontSize:12 }}>ניהול משק הבית המשפחתי</p>
          </div>

          <nav className="sidebar-nav">
            {TABS.map(t => (
              <button key={t.key} className={`sidebar-btn hov${tab===t.key?" active":""}`}
                onClick={() => setTab(t.key)} style={{
                  width:"100%", padding:"11px 16px", borderRadius:12,
                  background: tab===t.key ? "rgba(255,255,255,0.18)" : "transparent",
                  border: tab===t.key ? "1.5px solid rgba(255,255,255,0.25)" : "1.5px solid transparent",
                  color: tab===t.key ? "#fff" : "rgba(255,255,255,0.65)",
                  fontFamily:"inherit", fontSize:14, fontWeight: tab===t.key ? 700 : 500,
                  cursor:"pointer", display:"flex", alignItems:"center", gap:12, textAlign:"right",
                  transition:"all 0.17s",
                }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
                {t.label}
                {tab===t.key && <div style={{ marginRight:"auto", width:6, height:6, borderRadius:"50%", background:"#fff" }} />}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="hov" onClick={requestPermission} style={{
              width:"100%", padding:"10px 16px", borderRadius:12,
              background: permission==="granted" && !muted ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              border:"1.5px solid rgba(255,255,255,0.2)",
              color:"rgba(255,255,255,0.8)", fontFamily:"inherit", fontSize:12, fontWeight:600,
              cursor:"pointer", display:"flex", alignItems:"center", gap:8,
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
            background:`linear-gradient(135deg, ${C.primary} 0%, #264D29 100%)`,
            padding:"18px 16px 20px", position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", right:-20, top:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", position:"relative", zIndex:1 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                  <span style={{ fontSize:22 }}>🏡</span>
                  <span style={{ color:"#fff", fontSize:20, fontWeight:900 }}>בית חכם</span>
                </div>
                <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12 }}>ניהול משק הבית המשפחתי</p>
              </div>
              <button className="hov" onClick={requestPermission} style={{
                background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)",
                borderRadius:10, padding:"7px 10px", color:"#fff",
                fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                display:"flex", alignItems:"center", gap:4,
              }}>
                <span>{permission !== "granted" ? "🔕" : muted ? "🔕" : "🔔"}</span>
                {permission !== "granted" ? "התראות" : muted ? "מושתק" : "פעיל"}
              </button>
            </div>
          </div>

          {/* Desktop top bar */}
          <div className="topbar">
            <div>
              <h2 style={{ fontSize:20, fontWeight:800, color:C.text }}>
                {TABS.find(t=>t.key===tab)?.icon} {TABS.find(t=>t.key===tab)?.label}
              </h2>
              <p style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
                {today.getDate()} {MONTHS_HE[today.getMonth()]} {today.getFullYear()}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ display:"flex", gap:8 }}>
                <Stat label="משימות" value={sp.assignments.filter(a=>!a.approved).length} color={C.primary} />
                <Stat label="קניות"  value={sp.shopping.filter(s=>!s.approved).length}    color="#B8862A"   />
                <Stat label="אירועים" value={sp.events.filter(e=>e.date>=today).length}    color={C.purple}  />
              </div>
            </div>
          </div>

          {/* Page body */}
          <div className="page-body">
            {tab==="home"        && <HomeTab        {...sp} />}
            {tab==="assignments" && <AssignmentsTab {...sp} />}
            {tab==="shopping"    && <ShoppingTab    {...sp} />}
            {tab==="calendar"    && <CalendarTab    {...sp} />}
          </div>
        </div>

        {/* ══ MOBILE BOTTOM TAB BAR ══ */}
        <div className="mobile-tabbar">
          {TABS.map(t => (
            <button key={t.key} className="hov" onClick={() => setTab(t.key)} style={{
              flex:1, padding:"8px 4px", borderRadius:12,
              background: tab===t.key ? C.primary : "transparent",
              color: tab===t.key ? "#fff" : C.textMuted,
              fontFamily:"inherit", fontSize:10, fontWeight: tab===t.key ? 700 : 500,
              border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:2,
            }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              {t.label}
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

  const month = today.getMonth(), year = today.getFullYear(), day = today.getDate();
  const dateStr = `${day} ${MONTHS_HE[month]} ${year}`;

  function quickDone(id) { toggleAssignment(id); }
  function quickBought(id) { toggleShopping(id); }

  return (
    <div className="fade-up">
      {/* Welcome */}
      <div style={{
        marginBottom: 20, padding: "16px 18px",
        background: C.card, borderRadius: 16,
        boxShadow: "0 2px 14px rgba(0,0,0,0.07)",
        borderRight: `5px solid ${C.primary}`,
      }}>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 3 }}>📆 {dateStr}</div>
        <div style={{ fontSize: 19, fontWeight: 900, color: C.text }}>שלום, משפחה! 👋</div>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 5 }}>
          <span style={{ color: "#C0392B", fontWeight: 700 }}>{assignments.filter(a=>!a.approved).length}</span> משימות ·{" "}
          <span style={{ color: "#C27A1A", fontWeight: 700 }}>{shopping.filter(s=>!s.approved).length}</span> פריטי קניות ·{" "}
          <span style={{ color: C.secondary, fontWeight: 700 }}>{upcomingEvents.length}</span> אירועים קרובים
        </div>
      </div>

      {/* ── Tasks ── */}
      <DashSection title="משימות ממתינות" icon="✅" navLabel="כל המשימות ←" onNav={() => setTab("assignments")}>
        {pendingTasks.length === 0
          ? <EmptyMsg text="כל המשימות הושלמו! 🎉" />
          : pendingTasks.map((a, i) => (
            <div key={a.id} style={{
              background: C.card, borderRadius: 12, padding: "11px 13px", marginBottom: 8,
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 10,
              border: `1.5px solid ${C.border}`,
              borderRight: `4px solid ${URGENCY[a.urgency].color}`,
              animation: `fadeUp 0.3s ${i*0.07}s ease both`,
            }}>
              <button className="hov check-circle" onClick={() => quickDone(a.id)} style={{
                background: "transparent",
                border: `2px solid ${C.border}`, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} title="סמן כהושלם" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                  <UrgencyBadge urgency={a.urgency} small />
                  <span style={{ color: C.textMuted, fontSize: 11 }}>👤 {a.assignee} · 📅 {a.due}</span>
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
              background: C.card, borderRadius: 12, padding: "11px 13px", marginBottom: 8,
              boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 10,
              border: `1.5px solid ${C.border}`,
              animation: `fadeUp 0.3s ${i*0.07}s ease both`,
            }}>
              <button className="hov check-square" onClick={() => quickBought(s.id)} style={{
                background: "transparent",
                border: `2px solid ${C.border}`, cursor: "pointer",
              }} title="סמן כנרכש" />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{s.item}</span>
                <span style={{ color: C.textMuted, fontSize: 12, marginRight: 8 }}>{s.qty}</span>
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
            return (
              <div key={ev.id} style={{
                background: C.card, borderRadius: 12, padding: "11px 13px", marginBottom: 8,
                boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 10,
                borderRight: `4px solid ${color}`, border: `1.5px solid ${C.border}`,
                borderRightWidth: 4, borderRightColor: color,
                animation: `fadeUp 0.3s ${i*0.07}s ease both`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{ev.title}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                    <span style={{ color: C.textMuted, fontSize: 11 }}>📅 {formatDate(ev.date)}</span>
                    <span style={{ background:`${color}22`, color, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:5 }}>
                      {ev.category}
                    </span>
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
    <div style={{ marginBottom: 20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:17 }}>{icon}</span>
          <span style={{ fontWeight:800, fontSize:15, color:C.text }}>{title}</span>
        </div>
        <button className="hov" onClick={onNav} style={{
          background: "none", border:`1.5px solid ${C.border}`, borderRadius:10,
          padding:"5px 11px", fontFamily:"inherit", fontSize:12, fontWeight:700,
          color:C.primary, cursor:"pointer",
        }}>{navLabel}</button>
      </div>
      <div style={{ background:`${C.primary}07`, borderRadius:14, padding:"12px 12px 4px" }}>
        {children}
      </div>
    </div>
  );
}

function EmptyMsg({ text }) {
  return (
    <div style={{ textAlign:"center", padding:"12px 0 16px", color:C.textMuted, fontSize:13 }}>{text}</div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ASSIGNMENTS
═══════════════════════════════════════════════════════════ */
function AssignmentsTab({ assignments, showAddA, setShowAddA, newA, setNewA, notify,
  addAssignment, toggleAssignment, removeAssignment }) {
  const urgOrder = { high:0, medium:1, low:2 };
  const pending  = [...assignments.filter(a => !a.approved)].sort((a,b)=>urgOrder[a.urgency]-urgOrder[b.urgency]);
  const approved = assignments.filter(a => a.approved);

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
      {pending.map((a,i) => <AssignCard key={a.id} item={a} onToggle={toggle} onRemove={remove} delay={i*0.05} />)}

      {approved.length > 0 && (
        <>
          <Divider label={`הושלמו (${approved.length})`} />
          {approved.map(a => <AssignCard key={a.id} item={a} onToggle={toggle} onRemove={remove} />)}
        </>
      )}
    </div>
  );
}

function AssignCard({ item, onToggle, onRemove, delay=0 }) {
  const u = URGENCY[item.urgency] || URGENCY.medium;
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:14, padding:"13px 14px", marginBottom:10,
      boxShadow:"0 2px 10px rgba(0,0,0,0.06)",
      display:"flex", alignItems:"center", gap:11,
      opacity: item.approved ? 0.58 : 1,
      border:`1.5px solid ${item.approved ? C.secondaryLight : C.border}`,
      borderRight:`4px solid ${item.approved ? C.secondaryLight : u.color}`,
      animation:`fadeUp 0.3s ${delay}s ease both`,
      transition:"box-shadow 0.2s",
    }}>
      <button className="hov check-circle" onClick={()=>onToggle(item.id)} style={{
        background: item.approved ? C.secondary : "transparent",
        border:`2px solid ${item.approved ? C.secondary : C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:13, cursor:"pointer",
      }}>{item.approved ? "✓" : ""}</button>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, fontSize:15, color:C.text,
          textDecoration:item.approved?"line-through":"none",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
        <div style={{ display:"flex", gap:7, marginTop:4, flexWrap:"wrap", alignItems:"center" }}>
          {!item.approved && <UrgencyBadge urgency={item.urgency} />}
          <Tag color={C.primary}>{item.assignee}</Tag>
          <span style={{ color:C.textMuted, fontSize:11 }}>📅 {item.due}</span>
        </div>
      </div>

      <button className="hov" onClick={()=>onRemove(item.id)} style={{
        background:"none", color:C.textMuted, fontSize:20, padding:4, border:"none", cursor:"pointer", flexShrink:0,
      }}>×</button>
    </div>
  );
}

function UrgencyBadge({ urgency, small }) {
  const u = URGENCY[urgency] || URGENCY.medium;
  return (
    <span style={{
      background:u.bg, color:u.color,
      fontSize:small?10:11, fontWeight:700,
      padding:small?"1px 6px":"2px 8px", borderRadius:6,
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
  addShoppingItem, toggleShopping, removeShopping, addQuickItem }) {
  const [quickItems, setQuickItems] = useState(DEFAULT_QUICK_ITEMS);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customItem, setCustomItem] = useState({ label:"", qty:1 });
  const [qtyPicker, setQtyPicker] = useState(null);

  const pending  = shopping.filter(s => !s.approved);
  const approved = shopping.filter(s => s.approved);
  const activeLabels = new Set(pending.map(s => s.item));

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
      {pending.map((s,i) => <ShopCard key={s.id} item={s} onToggle={toggle} onRemove={remove} delay={i*0.05} />)}

      {approved.length > 0 && (
        <>
          <Divider label={`נרכשו (${approved.length})`} />
          {approved.map(s => <ShopCard key={s.id} item={s} onToggle={toggle} onRemove={remove} />)}
        </>
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

function ShopCard({ item, onToggle, onRemove, delay=0 }) {
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:14, padding:"12px 14px", marginBottom:8,
      boxShadow:"0 2px 10px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:11,
      opacity:item.approved?0.58:1,
      border:`1.5px solid ${item.approved?C.secondaryLight:C.border}`,
      animation:`fadeUp 0.3s ${delay}s ease both`, transition:"box-shadow 0.2s",
    }}>
      <button className="hov check-square" onClick={()=>onToggle(item.id)} style={{
        background:item.approved?C.secondary:"transparent",
        border:`2px solid ${item.approved?C.secondary:C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:13, cursor:"pointer",
      }}>{item.approved?"✓":""}</button>
      {item.icon && <span style={{ fontSize:22, flexShrink:0 }}>{item.icon}</span>}
      <div style={{ flex:1 }}>
        <span style={{ fontWeight:600, fontSize:15, color:C.text,
          textDecoration:item.approved?"line-through":"none" }}>{item.item}</span>
      </div>
      {item.qty && item.qty !== "1" && (
        <div style={{
          background:`${C.primary}15`, color:C.primary, border:`1.5px solid ${C.primary}30`,
          borderRadius:8, padding:"3px 10px", fontSize:13, fontWeight:700, flexShrink:0,
        }}>×{item.qty}</div>
      )}
      <button className="hov" onClick={()=>onRemove(item.id)} style={{
        background:"none", color:C.textMuted, fontSize:20, padding:4, border:"none", cursor:"pointer",
      }}>×</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR
═══════════════════════════════════════════════════════════ */
function CalendarTab({ events, calendarDate, setCalendarDate, calView, setCalView,
  today, showAddE, setShowAddE, newE, setNewE, notify, addEvent: addEventDB, removeEvent }) {

  function addEvent() {
    if (!newE.title.trim() || !newE.date) return;
    const [y,m,d] = newE.date.split("-").map(Number);
    const ev = { title:newE.title, date:new Date(y,m-1,d), category:newE.category };
    addEventDB(ev);
    setNewE({ title:"", date:"", category:"גלעד" });
    setShowAddE(false);
  }

  const upcoming = [...events].filter(e=>e.date>=today).sort((a,b)=>a.date-b.date).slice(0,8);

  return (
    <div className="fade-up">
      <SectionHeader title="לוח שנה" icon="📅" onAdd={()=>setShowAddE(!showAddE)} />

      {showAddE && (
        <AddForm onAdd={addEvent} onCancel={()=>setShowAddE(false)}>
          <input value={newE.title} onChange={e=>setNewE({...newE,title:e.target.value})} placeholder="שם האירוע" style={IS} />
          <input type="date" value={newE.date} onChange={e=>setNewE({...newE,date:e.target.value})} style={IS} />
          <select value={newE.category} onChange={e=>setNewE({...newE,category:e.target.value})} style={IS}>
            {["גלעד","ואלרי","דין","מילה","נוגה","ימי הולדת","אחר"].map(c=><option key={c}>{c}</option>)}
          </select>
        </AddForm>
      )}

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{key:"monthly",label:"חודשי"},{key:"upcoming",label:"קרובים"}].map(v=>(
          <button key={v.key} className="hov" onClick={()=>setCalView(v.key)} style={{
            padding:"8px 20px", borderRadius:10, fontFamily:"inherit",
            background:calView===v.key?C.primary:C.card,
            color:calView===v.key?"#fff":C.textMuted,
            fontWeight:600, fontSize:13, boxShadow:"0 2px 8px rgba(0,0,0,0.07)",
            border:"none", cursor:"pointer", transition:"all 0.18s",
          }}>{v.label}</button>
        ))}
      </div>

      {calView==="monthly"  && <MonthlyCalendar calendarDate={calendarDate} setCalendarDate={setCalendarDate} events={events} today={today} removeEvent={removeEvent} />}
      {calView==="upcoming" && <UpcomingList events={upcoming} removeEvent={removeEvent} />}
    </div>
  );
}

function MonthlyCalendar({ calendarDate, setCalendarDate, events, today, removeEvent }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
  const cells = [];
  for (let i=0; i<getFirstDay(y,m); i++) cells.push(null);
  for (let d=1; d<=getDaysInMonth(y,m); d++) cells.push(d);
  function dayEvs(day) { return events.filter(e=>e.date.getFullYear()===y&&e.date.getMonth()===m&&e.date.getDate()===day); }
  const selEvs = selectedDay ? dayEvs(selectedDay) : [];

  return (
    <div>
      {/* nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:11,
        background:C.card, borderRadius:14, padding:"12px 16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
        <button className="hov" onClick={()=>setCalendarDate(new Date(y,m-1,1))} style={NBS}>›</button>
        <span style={{ fontWeight:700, fontSize:16, color:C.text }}>{MONTHS_HE[m]} {y}</span>
        <button className="hov" onClick={()=>setCalendarDate(new Date(y,m+1,1))} style={NBS}>‹</button>
      </div>

      {/* grid */}
      <div style={{ background:C.card, borderRadius:14, padding:11, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:8 }}>
          {DAYS_HE.map(d=>(
            <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:C.textMuted, padding:"3px 0" }}>{d}</div>
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
                borderRadius:9, padding:"5px 3px", minHeight:44, cursor:"pointer",
                background: isS?C.primary : isT?`${C.primary}18`:"transparent",
                border: isT&&!isS?`1.5px solid ${C.primary}`:"1.5px solid transparent",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                transition:"background 0.14s",
              }}>
                <span style={{ fontSize:12, fontWeight:isT?700:500,
                  color:isS?"#fff":isT?C.primary:C.text }}>{day}</span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:2, justifyContent:"center" }}>
                  {de.slice(0,3).map((e,idx)=>(
                    <div key={idx} style={{ width:5, height:5, borderRadius:"50%",
                      background:isS?"rgba(255,255,255,0.8)":CATEGORY_COLORS[e.category]||C.accent }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="slide-in" style={{ marginTop:12 }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text, marginBottom:8 }}>
            אירועים ב-{selectedDay}/{m+1}/{y}
          </div>
          {selEvs.length===0
            ? <EmptyState text="אין אירועים ביום זה" />
            : selEvs.map(e=><EventCard key={e.id} event={e} onRemove={id=>removeEvent(id)} />)
          }
        </div>
      )}

      <div style={{ display:"flex", gap:14, marginTop:13, flexWrap:"wrap" }}>
        {Object.entries(CATEGORY_COLORS).map(([cat,color])=>(
          <div key={cat} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
            <span style={{ fontSize:11, color:C.textMuted }}>{cat}</span>
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
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:14, padding:"13px 14px", marginBottom:10,
      boxShadow:"0 2px 10px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:11,
      borderRight:`4px solid ${color}`, border:`1.5px solid ${C.border}`,
      borderRightWidth:4, borderRightColor:color, transition:"box-shadow 0.2s",
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:600, fontSize:15, color:C.text }}>{event.title}</div>
        <div style={{ display:"flex", gap:8, marginTop:4, alignItems:"center", flexWrap:"wrap" }}>
          {showDate && <span style={{ color:C.textMuted, fontSize:12 }}>📅 {formatDate(event.date)}</span>}
          <span style={{ background:`${color}22`, color, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6 }}>
            {event.category}
          </span>
        </div>
      </div>
      <button className="hov" onClick={()=>onRemove(event.id)} style={{
        background:"none", color:C.textMuted, fontSize:20, padding:4, border:"none", cursor:"pointer",
      }}>×</button>
    </div>
  );
}

/* ─── SHARED ─── */
function SectionHeader({ title, icon, count, label, onAdd, addLabel }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <h2 style={{ fontSize:20, fontWeight:900, color:C.text }}>{title}</h2>
        {count!==undefined && (
          <div style={{ background:C.primary, color:"#fff", borderRadius:20, padding:"2px 9px", fontSize:12, fontWeight:700 }}>
            {count} {label}
          </div>
        )}
      </div>
      <button className="hov" onClick={onAdd} style={{
        background:C.primary, color:"#fff", border:"none", borderRadius:12, padding:"8px 15px",
        fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer",
        display:"flex", alignItems:"center", gap:5, boxShadow:"0 3px 12px rgba(58,107,62,0.3)",
      }}>
        <span style={{ fontSize:17 }}>+</span> {addLabel || "הוסף"}
      </button>
    </div>
  );
}

function AddForm({ children, onAdd, onCancel }) {
  return (
    <div className="slide-in" style={{
      background:C.card, borderRadius:16, padding:16, marginBottom:16,
      boxShadow:"0 4px 20px rgba(58,107,62,0.14)", border:`1.5px solid ${C.primaryLight}`,
      display:"flex", flexDirection:"column", gap:10,
    }}>
      {children}
      <div style={{ display:"flex", gap:8 }}>
        <button className="hov" onClick={onAdd} style={{
          flex:1, background:C.primary, color:"#fff", border:"none",
          borderRadius:10, padding:"10px", fontFamily:"inherit", fontWeight:700, fontSize:14, cursor:"pointer",
        }}>שמור</button>
        <button className="hov" onClick={onCancel} style={{
          background:C.border, color:C.text, border:"none",
          borderRadius:10, padding:"10px 15px", fontFamily:"inherit", fontWeight:600, fontSize:14, cursor:"pointer",
        }}>ביטול</button>
      </div>
    </div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ margin:"18px 0 10px", display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:1, background:C.border }} />
      <span style={{ color:C.textMuted, fontSize:12, fontWeight:600 }}>{label}</span>
      <div style={{ flex:1, height:1, background:C.border }} />
    </div>
  );
}

function Tag({ children, color }) {
  return (
    <span style={{ background:`${color}18`, color, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:6 }}>
      {children}
    </span>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign:"center", padding:"28px 0", color:C.textMuted, fontSize:15 }}>{text}</div>;
}

function Stat({ label, value, color }) {
  return (
    <div style={{
      background:`${color}12`, border:`1.5px solid ${color}30`,
      borderRadius:10, padding:"6px 14px", textAlign:"center",
    }}>
      <div style={{ fontSize:18, fontWeight:900, color }}>{value}</div>
      <div style={{ fontSize:10, color:C.textMuted, fontWeight:600 }}>{label}</div>
    </div>
  );
}

const IS = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.bg, direction:"rtl" };
const NBS = { background:C.border, border:"none", width:32, height:32, borderRadius:8, fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };