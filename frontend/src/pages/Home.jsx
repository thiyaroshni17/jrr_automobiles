import { useEffect, useMemo, useState } from "react";
import "../styles/theme.css";
import "../styles/index.css";
import assets from "../assets/assets";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { useContext } from "react";
import { AppContent } from "../context/context";

const MenuLink = ({ href, label, icon }) => (
  <a className="nav-link" href={href}>
    <span className="nav-ico">{icon}</span>
    <span>{label}</span>
  </a>
);

export default function Dashboard() {
  // theme
  const systemPrefersDark = useMemo(
    () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
    []
  );
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || (systemPrefersDark ? "dark" : "light")
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const API = import.meta.env.VITE_API_BASE || "";
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const {backendurl, setuserdata,setisloggedin} = useContext(AppContent)

  // helpers to handle varied field names
  const getAmount = (j) => {
    const keys = ["grandTotal","netTotal","netAmount","total","amount","billAmount","finalAmount"];
    for (const k of keys) if (typeof j?.[k] === "number") return j[k];
    const maybe = keys.find(k => j?.[k] != null);
    return maybe ? Number(j[maybe]) || 0 : 0;
  };
  const getDate = (j) => new Date(j?.serviceDate || j?.date || j?.createdAt || Date.now());
  const isCompleted = (j) => {
    const s = String(j?.status || j?.jobStatus || "").toLowerCase();
    return ["closed","completed","delivered","done","billed"].some(x => s.includes(x)) || !!j?.delivered;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/jobcard/list`, { credentials: "include" });
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data?.jobcards) || Array.isArray(data)) {
          setJobs(Array.isArray(data?.jobcards) ? data.jobcards : data);
        } else {
          setErr(data?.message || "Unable to load job cards");
        }
      } catch (e) {
        setErr("Network error while loading job cards");
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [API]);

  const logout=async(req,res)=>{
        try{
            axios.defaults.withCredentials = true
          const {data} =  await axios.post(backendurl+'/logout')
          
          if(data.success){
        setuserdata('')
        setisloggedin(false)
        navigate('/login')
        toast.warning(data.message)
          }else{
            toast.error(data.message)
          }
        }catch(e){
            console.log(e.message)
        }
    }

  // aggregates
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sameMonth = (d) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const isToday = (d) => d.toDateString() === now.toDateString();

  const monthJobs = jobs.filter(j => sameMonth(getDate(j)));
  const completedMonth = monthJobs.filter(isCompleted);
  const revenueMonth = monthJobs.reduce((s, j) => s + getAmount(j), 0);
  const carsServicedMonth = completedMonth.length;
  const avgTicketMonth = carsServicedMonth ? revenueMonth / carsServicedMonth : 0;

  const revenueToday = jobs.filter(j => isToday(getDate(j))).reduce((s,j)=> s + getAmount(j), 0);
  const pendingJobs = monthJobs.length - carsServicedMonth;

  return (
    <div className="page">
      {/* background layers from your design system */}
      <div className="hero-bg" />
      <div className="hero-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <header className="topbar">
        <div className="brand">
          <img src={assets.logo} alt="JRR Automobiles" className="logo" />
          <div className="brand-text">
            <span className="brand-title">JRR Automobiles</span>
            <span className="brand-sub">Dashboard</span>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            <span className="icon">{theme === "dark" ? "🌙" : "🌞"}</span>
            <span className="hide-sm">{theme === "dark" ? "Dark" : "Light"} mode</span>
          </button>
          <button className="btn solid"  onClick={logout} >Logout</button>
        </div>
      </header>

      <div className="dash-shell">
        {/* left menu */}
        <aside className="sidebar glass">
          <nav className="nav">
            <MenuLink href="/jobcardhome" label="Jobcard" icon="🧾" />
            <MenuLink href="/pettycashhome" label="Petty Cash" icon="💵" />
            <MenuLink href="/waterwashhome" label="Collection Register W/W" icon="📒" />
            <MenuLink href="/bodyshophome" label="Collection Register B/S" icon="📒" />
             <MenuLink href="/billcopy" label="Bill copy" icon="📒" />
            <MenuLink href="/report" label="Report" icon="📊" />
            <MenuLink href="/enquiry" label="Enquiry" icon="📨" />
          </nav>
        </aside>

        {/* main content */}
        <main className="dash-main">
          <section className="kpi-grid">
            <div className="kpi glass">
              <div className="kpi-top">
                <span className="kpi-title">Revenue (Month)</span>
                <span className="kpi-ico">₹</span>
              </div>
              <div className="kpi-value">₹ {revenueMonth.toLocaleString()}</div>
              <div className="kpi-sub">From {monthJobs.length} jobcards</div>
            </div>

            <div className="kpi glass">
              <div className="kpi-top">
                <span className="kpi-title">Cars Serviced</span>
                <span className="kpi-ico">🚗</span>
              </div>
              <div className="kpi-value">{carsServicedMonth}</div>
              <div className="kpi-sub">Completed this month</div>
            </div>

            <div className="kpi glass">
              <div className="kpi-top">
                <span className="kpi-title">Avg Ticket</span>
                <span className="kpi-ico">📈</span>
              </div>
              <div className="kpi-value">₹ {avgTicketMonth.toFixed(0)}</div>
              <div className="kpi-sub">Revenue / serviced</div>
            </div>

            <div className="kpi glass">
              <div className="kpi-top">
                <span className="kpi-title">Revenue (Today)</span>
                <span className="kpi-ico">🕑</span>
              </div>
              <div className="kpi-value">₹ {revenueToday.toLocaleString()}</div>
              <div className="kpi-sub">From today’s jobs</div>
            </div>

            <div className="kpi glass">
              <div className="kpi-top">
                <span className="kpi-title">Pending Jobs</span>
                <span className="kpi-ico">⏳</span>
              </div>
              <div className="kpi-value">{pendingJobs}</div>
              <div className="kpi-sub">In-progress this month</div>
            </div>
          </section>

          <section className="glass card recent">
            <h2>Recent jobcards</h2>
            {loading ? (
              <p className="lead">Loading…</p>
            ) : err ? (
              <p className="lead" style={{ color: "#b00" }}>{err}</p>
            ) : (
              <div className="table">
                <div className="row head">
                  <div>Date</div>
                  <div>Vehicle</div>
                  <div>Status</div>
                  <div>Amount</div>
                </div>
                {monthJobs.slice(0, 8).map((j, idx) => (
                  <div key={idx} className="row">
                    <div>{getDate(j).toLocaleDateString()}</div>
                    <div>{j?.vehicleNo || j?.regNo || j?.vehicle || "—"}</div>
                    <div>{j?.status || j?.jobStatus || (isCompleted(j) ? "Completed" : "Pending")}</div>
                    <div>₹ {getAmount(j).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <footer className="footer">
        <span>© {new Date().getFullYear()} JRR Automobiles — Internal Use Only</span>
      </footer>
    </div>
  );
}
