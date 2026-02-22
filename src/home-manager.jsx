import { useState, useEffect, useCallback, useRef } from "react";

/* ─── THEME ─── */
const C = {
  bg: "#F4F7F2", card: "#FFFFFF", primary: "#3A6B3E", primaryLight: "#7AAF7E",
  secondary: "#B8862A", secondaryLight: "#E8C97A", accent: "#D4A017",
  text: "#1A2E1C", textMuted: "#5C7A5E", border: "#C8DBC9",
  danger: "#C0392B", purple: "#6B8F71",
};

const URGENCY = {
  high:   { label: "דחוף",  color: "#8B2500", bg: "#FDECEA", icon: "🔴" },
  medium: { label: "בינוני", color: "#B8862A", bg: "#FDF6E3", icon: "🟡" },
  low:    { label: "נמוך",  color: "#3A6B3E", bg: "#EDF4EE", icon: "🟢" },
};

const CATEGORY_COLORS = { "משפחה": "#3A6B3E", "עבודה": "#B8862A", "אחר": "#6B8F71" };
const FAMILY_MEMBERS = ["אמא", "אבא", "יוסי", "מיכל", "כולם"];
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
  const [toasts, setToasts] = useState([]);
  const notifiedRef = useRef(new Set());

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const r = await Notification.requestPermission();
    setPermission(r);
  }, []);

  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const notify = useCallback((title, body, type = "info") => {
    addToast(body ? `${title}: ${body}` : title, type);
    if (permission === "granted") {
      try { new Notification(title, { body, icon: "🏡" }); } catch {}
    }
  }, [permission, addToast]);

  const checkUpcoming = useCallback((events) => {
    const now = new Date();
    events.forEach(ev => {
      const diff = ev.date - now;
      const key = `ev-${ev.id}`;
      if (diff > 0 && diff < 24 * 60 * 60 * 1000 && !notifiedRef.current.has(key)) {
        notifiedRef.current.add(key);
        const h = Math.round(diff / 3600000);
        notify("אירוע מתקרב 📅", `${ev.title} – בעוד ${h} שעות`, "event");
      }
    });
  }, [notify]);

  return { permission, requestPermission, notify, toasts, checkUpcoming };
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
  const today = new Date(2026, 1, 22);
  const [tab, setTab] = useState("home");
  const { permission, requestPermission, notify, toasts, checkUpcoming } = useNotifications();

  const [assignments, setAssignments] = useState([
    { id: 1, title: "לנקות את הסלון",  assignee: "יוסי",  due: "24/2/2026", approved: false, urgency: "high"   },
    { id: 2, title: "לשטוף כלים",       assignee: "מיכל",  due: "22/2/2026", approved: false, urgency: "medium" },
    { id: 3, title: "לסדר את המחסן",    assignee: "אבא",   due: "28/2/2026", approved: false, urgency: "low"    },
    { id: 4, title: "לקנות מכולת",      assignee: "אמא",   due: "23/2/2026", approved: false, urgency: "medium" },
  ]);
  const [shopping, setShopping] = useState([
    { id: 1, item: "חלב",   qty: "2 ליטר",  approved: false },
    { id: 2, item: "לחם",   qty: "1 כיכר",  approved: false },
    { id: 3, item: "ביצים", qty: "1 תריסר", approved: false },
    { id: 4, item: "גבינה", qty: "200 גרם",  approved: false },
  ]);
  const [events, setEvents] = useState([
    { id: 1, title: "יום הולדת של סבתא",   date: new Date(2026, 1, 25), category: "משפחה" },
    { id: 2, title: "פגישת עבודה",         date: new Date(2026, 1, 24), category: "עבודה" },
    { id: 3, title: "טיול בית ספרי",       date: new Date(2026, 2, 3),  category: "אחר"   },
    { id: 4, title: "ארוחת שישי משפחתית", date: new Date(2026, 1, 28), category: "משפחה" },
  ]);

  const [calendarDate, setCalendarDate] = useState(today);
  const [calView, setCalView] = useState("monthly");
  const [showAddA, setShowAddA] = useState(false);
  const [showAddS, setShowAddS] = useState(false);
  const [showAddE, setShowAddE] = useState(false);
  const [newA, setNewA] = useState({ title: "", assignee: "אמא", due: "", urgency: "medium" });
  const [newS, setNewS] = useState({ item: "", qty: "" });
  const [newE, setNewE] = useState({ title: "", date: "", category: "משפחה" });

  useEffect(() => {
    checkUpcoming(events);
    const interval = setInterval(() => checkUpcoming(events), 60000);
    return () => clearInterval(interval);
  }, [events, checkUpcoming]);

  const sp = {
    assignments, setAssignments, shopping, setShopping, events, setEvents,
    today, notify, calendarDate, setCalendarDate, calView, setCalView,
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
        .chov:hover { box-shadow: 0 6px 22px rgba(58,107,62,0.14) !important; }
        input, select { outline: none; font-family: Heebo, sans-serif; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(-12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        .fade-up  { animation: fadeUp  0.35s ease both; }
        .slide-in { animation: slideIn 0.28s ease both; }
        .cal-cell:hover { background: ${C.border} !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      <ToastContainer toasts={toasts} />

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, #264D29 100%)`,
        padding: "20px 18px 64px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", right:-30, top:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ position:"absolute", left:20, bottom:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
        <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3 }}>
              <span style={{ fontSize:28 }}>🏡</span>
              <h1 style={{ color:"#fff", fontSize:26, fontWeight:900, letterSpacing:"-0.5px" }}>בית חכם</h1>
            </div>
            <p style={{ color:"rgba(255,255,255,0.72)", fontSize:13 }}>ניהול משק הבית המשפחתי</p>
          </div>
          <button className="hov" onClick={requestPermission} style={{
            background: permission==="granted" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)",
            border: "1.5px solid rgba(255,255,255,0.32)",
            borderRadius: 12, padding: "8px 11px", color: "#fff",
            fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ fontSize:16 }}>{permission==="granted" ? "🔔" : "🔕"}</span>
            {permission==="granted" ? "התראות פעילות" : "הפעל התראות"}
          </button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{
        display: "flex", gap: 6, padding: "0 10px",
        marginTop: -30, position: "relative", zIndex: 10, justifyContent: "center",
      }}>
        {TABS.map(t => (
          <button key={t.key} className="hov" onClick={() => setTab(t.key)} style={{
            flex: 1, maxWidth: 100, padding: "11px 4px", borderRadius: 13,
            background: tab===t.key ? C.primary : C.card,
            color: tab===t.key ? "#fff" : C.textMuted,
            fontFamily: "inherit", fontSize: 11, fontWeight: tab===t.key ? 700 : 500,
            boxShadow: tab===t.key ? "0 4px 16px rgba(58,107,62,0.35)" : "0 2px 10px rgba(0,0,0,0.08)",
            border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* PAGE */}
      <div style={{ padding: "20px 13px 90px", maxWidth: 720, margin: "0 auto" }}>
        {tab==="home"        && <HomeTab        {...sp} />}
        {tab==="assignments" && <AssignmentsTab {...sp} />}
        {tab==="shopping"    && <ShoppingTab    {...sp} />}
        {tab==="calendar"    && <CalendarTab    {...sp} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME  –  DASHBOARD
═══════════════════════════════════════════════════════════ */
function HomeTab({ assignments, setAssignments, shopping, setShopping, events, today, notify, setTab }) {
  const pendingTasks    = assignments.filter(a => !a.approved)
    .sort((a,b) => ({high:0,medium:1,low:2}[a.urgency]-({high:0,medium:1,low:2}[b.urgency])))
    .slice(0, 3);
  const pendingShopping = shopping.filter(s => !s.approved).slice(0, 3);
  const upcomingEvents  = [...events].filter(e => e.date >= today).sort((a,b)=>a.date-b.date).slice(0, 3);

  const month = today.getMonth(), year = today.getFullYear(), day = today.getDate();
  const dateStr = `${day} ${MONTHS_HE[month]} ${year}`;

  function quickDone(id) {
    setAssignments(prev => {
      const item = prev.find(a => a.id===id);
      if (item && !item.approved) notify("משימה הושלמה ✅", item.title, "success");
      return prev.map(a => a.id===id ? {...a, approved:true} : a);
    });
  }
  function quickBought(id) {
    setShopping(prev => {
      const item = prev.find(s => s.id===id);
      if (item) notify("פריט נרכש 🛒", item.item, "shopping");
      return prev.map(s => s.id===id ? {...s, approved:true} : s);
    });
  }

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
              <button className="hov" onClick={() => quickDone(a.id)} style={{
                width: 25, height: 25, borderRadius: "50%", background: "transparent",
                border: `2px solid ${C.border}`, flexShrink: 0, cursor: "pointer",
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
              <button className="hov" onClick={() => quickBought(s.id)} style={{
                width: 25, height: 25, borderRadius: 7, background: "transparent",
                border: `2px solid ${C.border}`, flexShrink: 0, cursor: "pointer",
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
function AssignmentsTab({ assignments, setAssignments, showAddA, setShowAddA, newA, setNewA, notify }) {
  const urgOrder = { high:0, medium:1, low:2 };
  const pending  = [...assignments.filter(a => !a.approved)].sort((a,b)=>urgOrder[a.urgency]-urgOrder[b.urgency]);
  const approved = assignments.filter(a => a.approved);

  function toggle(id) {
    setAssignments(prev => {
      const item = prev.find(a => a.id===id);
      if (item && !item.approved) notify("משימה הושלמה ✅", item.title, "success");
      return prev.map(a => a.id===id ? {...a, approved:!a.approved} : a);
    });
  }
  function remove(id) { setAssignments(prev => prev.filter(a => a.id!==id)); }
  function add() {
    if (!newA.title.trim()) return;
    const item = { id:Date.now(), title:newA.title, assignee:newA.assignee, due:newA.due||"לא נקבע", urgency:newA.urgency, approved:false };
    setAssignments(prev => [...prev, item]);
    notify("משימה חדשה נוספה 📋", `${item.title} · ${URGENCY[item.urgency].label}`, "info");
    setNewA({ title:"", assignee:"אמא", due:"", urgency:"medium" });
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
            <div style={{ display:"flex", gap:8 }}>
              {Object.entries(URGENCY).map(([key,u])=>(
                <button key={key} className="hov" onClick={()=>setNewA({...newA,urgency:key})} style={{
                  flex:1, padding:"9px 4px", borderRadius:11, cursor:"pointer",
                  background: newA.urgency===key ? u.bg : C.card,
                  border:`2px solid ${newA.urgency===key ? u.color : C.border}`,
                  fontFamily:"inherit", fontSize:12, fontWeight:700, color:u.color,
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
      <button className="hov" onClick={()=>onToggle(item.id)} style={{
        width:27, height:27, borderRadius:"50%",
        background: item.approved ? C.secondary : "transparent",
        border:`2px solid ${item.approved ? C.secondary : C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:13, flexShrink:0, cursor:"pointer",
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
function ShoppingTab({ shopping, setShopping, showAddS, setShowAddS, newS, setNewS, notify }) {
  const pending  = shopping.filter(s => !s.approved);
  const approved = shopping.filter(s => s.approved);

  function toggle(id) {
    setShopping(prev => {
      const item = prev.find(s => s.id===id);
      if (item) {
        if (!item.approved) notify("פריט נרכש 🛒", item.item, "shopping");
        else notify("פריט הוחזר לרשימה", item.item, "info");
      }
      return prev.map(s => s.id===id ? {...s, approved:!s.approved} : s);
    });
  }
  function remove(id) { setShopping(prev => prev.filter(s => s.id!==id)); }
  function add() {
    if (!newS.item.trim()) return;
    const item = { id:Date.now(), item:newS.item, qty:newS.qty||"1", approved:false };
    setShopping(prev => [...prev, item]);
    notify("פריט חדש נוסף 🛒", `${item.item} — ${item.qty}`, "shopping");
    setNewS({ item:"", qty:"" });
    setShowAddS(false);
  }

  return (
    <div className="fade-up">
      <SectionHeader title="רשימת קניות" icon="🛒" count={pending.length} label="פריטים" onAdd={()=>setShowAddS(!showAddS)} />

      {showAddS && (
        <AddForm onAdd={add} onCancel={()=>setShowAddS(false)}>
          <input value={newS.item} onChange={e=>setNewS({...newS,item:e.target.value})} placeholder="שם הפריט" style={IS} />
          <input value={newS.qty}  onChange={e=>setNewS({...newS,qty:e.target.value})}  placeholder="כמות"     style={IS} />
        </AddForm>
      )}

      {pending.length===0 && <EmptyState text="הרשימה ריקה 🛍️" />}
      {pending.map((s,i)  => <ShopCard key={s.id} item={s} onToggle={toggle} onRemove={remove} delay={i*0.05} />)}

      {approved.length > 0 && (
        <>
          <Divider label={`נרכשו (${approved.length})`} />
          {approved.map(s => <ShopCard key={s.id} item={s} onToggle={toggle} onRemove={remove} />)}
        </>
      )}
    </div>
  );
}

function ShopCard({ item, onToggle, onRemove, delay=0 }) {
  return (
    <div className="chov" style={{
      background:C.card, borderRadius:14, padding:"13px 14px", marginBottom:10,
      boxShadow:"0 2px 10px rgba(0,0,0,0.06)", display:"flex", alignItems:"center", gap:11,
      opacity:item.approved?0.58:1,
      border:`1.5px solid ${item.approved?C.secondaryLight:C.border}`,
      animation:`fadeUp 0.3s ${delay}s ease both`, transition:"box-shadow 0.2s",
    }}>
      <button className="hov" onClick={()=>onToggle(item.id)} style={{
        width:27, height:27, borderRadius:8,
        background:item.approved?C.secondary:"transparent",
        border:`2px solid ${item.approved?C.secondary:C.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontSize:13, flexShrink:0, cursor:"pointer",
      }}>{item.approved?"✓":""}</button>
      <div style={{ flex:1 }}>
        <span style={{ fontWeight:600, fontSize:15, color:C.text,
          textDecoration:item.approved?"line-through":"none" }}>{item.item}</span>
        <span style={{ color:C.textMuted, fontSize:12, marginRight:8 }}>{item.qty}</span>
      </div>
      <button className="hov" onClick={()=>onRemove(item.id)} style={{
        background:"none", color:C.textMuted, fontSize:20, padding:4, border:"none", cursor:"pointer",
      }}>×</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR
═══════════════════════════════════════════════════════════ */
function CalendarTab({ events, setEvents, calendarDate, setCalendarDate, calView, setCalView,
  today, showAddE, setShowAddE, newE, setNewE, notify }) {

  function addEvent() {
    if (!newE.title.trim() || !newE.date) return;
    const [y,m,d] = newE.date.split("-").map(Number);
    const ev = { id:Date.now(), title:newE.title, date:new Date(y,m-1,d), category:newE.category };
    setEvents(prev => [...prev, ev]);
    notify("אירוע חדש נוסף 📅", `${ev.title} — ${formatDate(ev.date)}`, "event");
    setNewE({ title:"", date:"", category:"משפחה" });
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
            {["משפחה","עבודה","אחר"].map(c=><option key={c}>{c}</option>)}
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

      {calView==="monthly"  && <MonthlyCalendar calendarDate={calendarDate} setCalendarDate={setCalendarDate} events={events} today={today} setEvents={setEvents} />}
      {calView==="upcoming" && <UpcomingList events={upcoming} setEvents={setEvents} />}
    </div>
  );
}

function MonthlyCalendar({ calendarDate, setCalendarDate, events, today, setEvents }) {
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
            : selEvs.map(e=><EventCard key={e.id} event={e} onRemove={id=>setEvents(p=>p.filter(ev=>ev.id!==id))} />)
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

function UpcomingList({ events, setEvents }) {
  if (!events.length) return <EmptyState text="אין אירועים קרובים 📭" />;
  return <div>{events.map(e=><EventCard key={e.id} event={e} showDate onRemove={id=>setEvents(p=>p.filter(ev=>ev.id!==id))} />)}</div>;
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
function SectionHeader({ title, icon, count, label, onAdd }) {
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
        <span style={{ fontSize:17 }}>+</span> הוסף
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

const IS = { width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:14, color:C.text, background:C.bg, direction:"rtl" };
const NBS = { background:C.border, border:"none", width:32, height:32, borderRadius:8, fontSize:17, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" };
