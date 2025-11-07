import { useEffect, useMemo, useState } from "react";
import "../styles/theme.css";
import "../styles/index.css";
import assets from "../assets/assets";

export default function Reset() {
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

  // step control
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // form data
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  const API = import.meta.env.VITE_API_BASE || "";

  const sendOtp = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!email) {
      setMsg({ type: "error", text: "Please enter your email." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/resetotp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data?.success) {
        setMsg({ type: "success", text: data.message || "OTP sent to your email." });
        setStep(2);
      } else {
        setMsg({ type: "error", text: data?.message || "Failed to send OTP." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!email || !otp || !password) {
      setMsg({ type: "error", text: "All fields are required." });
      return;
    }
    if (password !== confirm) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/resetpassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (data?.success) {
        setMsg({ type: "success", text: data.message || "Password reset successful." });
        setTimeout(() => (window.location.href = "/login"), 800);
      } else {
        setMsg({ type: "error", text: data?.message || "Password reset failed." });
      }
    } catch {
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
          <h1>Reset your password</h1>
          <p className="lead">Receive an OTP by email, then set a new password in the next step.</p>

          {step === 1 && (
            <form className="form" onSubmit={sendOtp}>
              <label className="field">
                <span className="label">Email</span>
                <div className="control">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              {msg.text ? <div className={`alert ${msg.type}`}>{msg.text}</div> : null}

              <div className="actions-row">
                <button type="submit" className="btn solid big" disabled={loading}>
                  {loading ? "Sending..." : "Send OTP"}
                </button>
                <a href="/login" className="btn ghost big">Back to Login</a>
              </div>
            </form>
          )}

          {step === 2 && (
            <form className="form" onSubmit={resetPassword}>
              <label className="field">
                <span className="label">Email</span>
                <div className="control">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span className="label">OTP</span>
                <div className="control">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    required
                  />
                </div>
              </label>

              <label className="field">
                <span className="label">New password</span>
                <div className="control password">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
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

              <label className="field">
                <span className="label">Confirm password</span>
                <div className="control">
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </label>

              {msg.text ? <div className={`alert ${msg.type}`}>{msg.text}</div> : null}

              <div className="actions-row">
                <button type="submit" className="btn solid big" disabled={loading}>
                  {loading ? "Resetting..." : "Reset password"}
                </button>
                <button type="button" className="btn ghost big" onClick={() => setStep(1)}>
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <ul className="highlights">
            <li>Two-step reset with OTP and 24h expiry</li>
            <li>Email + OTP + new password validation</li>
            <li>Theme toggle, car backdrop, and glass UI</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} JRR Automobiles — Internal Use Only</span>
      </footer>
    </div>
  );
}
