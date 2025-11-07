import { useEffect, useMemo, useState  } from "react";
import "../styles/theme.css";
import "../styles/index.css";
import assets from "../assets/assets";
import { useContext } from "react";
import { AppContent } from "../context/context";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'

export default function Login() {
  const {backendurl , setisloggedin,getuserdata,isauthenticated} = useContext(AppContent)
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

  // form state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();



  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!identifier || !password) {
      setMsg({ type: "error", text: "Please enter identifier and password." });
      return;
    }
    setLoading(true);
    try {
      const {data} = await axios.post(backendurl + '/login', {
        identifier,
        password
      }, { withCredentials: true });
 if(data.success){
        setisloggedin(true)
        getuserdata()
        navigate('/home')
        toast.success(data.message)
      }else{
        toast.error(data.message)
      }
    } catch (err) {
      setMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
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
            <span className="brand-sub">Internal Software</span>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            <span className="icon">{theme === "dark" ? "🌙" : "🌞"}</span>
            <span className="hide-sm">{theme === "dark" ? "Dark" : "Light"} mode</span>
          </button>
        </div>
      </header>

      <main className="auth-main">
        <section className="auth-card glass card">
          <h1>Welcome back</h1>
          <p className="lead">Sign in with your email or user ID to access the workspace.</p>

          <form className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="label">Email or User ID</span>
              <div className="control">
                <input
                  type="text"
                  inputMode="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@company.com or JRR1234"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="label">Password</span>
              <div className="control password">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="peek"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            {msg.text ? (
              <div className={`alert ${msg.type}`}>
                {msg.text}
              </div>
            ) : null}

            <div className="actions-row">
              <button className="btn solid big" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
              <a className="btn ghost big" href="/resetpass">Forgot password?</a>
            </div>
          </form>

          <ul className="highlights">
            <li>Cookie-based auth, no token in localStorage</li>
            <li>System-aware theming with persistent toggle</li>
            <li>Optimized for quick desk-side logins</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} JRR Automobiles — Internal Use Only</span>
      </footer>
    </div>
  );
}
