import { useEffect, useMemo, useState } from "react";
import "../styles/theme.css";
import "../styles/index.css";
import assets from "../assets/assets";

const Logo = () => (
  <img
    src={assets.logo}
    alt="JRR Automobiles"
    className="logo"
    height="56"
    width="auto"
    draggable="false"
  />
);

export default function App() {
  

  

  return (
    <div className="page">
      {/* Background layers */}
      <div className="hero-bg" />
      <div className="hero-overlay" />

      {/* Decorative animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <Logo />
          <div className="brand-text">
            <span className="brand-title">JRR Automobiles</span>
            <span className="brand-sub">Internal Software Portal</span>
          </div>
        </div>
        <div className="actions">
         
          <a className="btn solid" href="/login" aria-label="Login">
            Login
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="hero">
        <section className="glass card">
          <h1>
            Service Intelligence, Streamlined.
          </h1>
          <p className="lead">
            Personalized workflow software for JRR technicians, service advisors, and management—fast, focused, and private.
          </p>
          <div className="cta-row">
            <a className="btn solid big" href="/login">Enter workspace</a>
            
          </div>

          <ul className="highlights">
            <li>Role-based access, logs, and audit-ready actions</li>
            <li>Smart job cards, inventory insights, and service history</li>
            <li>Optimized for speed on your in-shop devices</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>© {new Date().getFullYear()} JRR Automobiles — Internal Use Only</span>
      </footer>
    </div>
  );
}
