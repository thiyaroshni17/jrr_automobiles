// JobcardHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AppContent } from "../context/context";
import assets from "../assets/assets";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "",
  withCredentials: true,
});

function JobcardHome() {
  const navigate = useNavigate();
    const { backendurl } = useContext(AppContent);



  // Search filters
  const [regNo, setRegNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [date, setDate] = useState("");

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get(backendurl + "/jobcard/list");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utils
  const yyyy_mm_dd = (isoLike) => {
    if (!isoLike) return "";
    const d = new Date(isoLike);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const dd = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const formatDate = (isoLike) => {
    if (!isoLike) return "-";
    const d = new Date(isoLike);
    return Number.isNaN(d.getTime()) ? String(isoLike) : d.toLocaleDateString();
  };

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));

  // Client-side filter
  const filtered = useMemo(() => {
    const dFilter = date?.trim();
    const rFilter = regNo.trim().toLowerCase();
    const mFilter = mobile.trim();
    return rows.filter((r) => {
      const matchDate = dFilter ? yyyy_mm_dd(r?.date) === dFilter : true;
      const matchReg = rFilter
        ? String(r?.RegNo || "").toLowerCase().includes(rFilter)
        : true;
      const matchMob = mFilter
        ? String(r?.mobileno || "").includes(mFilter)
        : true;
      return matchDate && matchReg && matchMob;
    });
  }, [rows, date, regNo, mobile]);

  const onClear = () => {
    setDate("");
    setRegNo("");
    setMobile("");
  };

  const onEdit = (id) => navigate(`/jobcard/${id}`);
  const onCreate = () => navigate("/jobcard/create");
  const onDashboard = () => navigate("/home");

  return (
    <div className="jobcard-page">
      <style>{`
        :root {
          --bg: #ffffff;
          --panel: #f6f7f9;
          --text: #0f172a;
          --muted: #475569;
          --border: #e5e7eb;
          --brand: #0ea5e9;
          --btn: #0ea5e9;
          --btn-contrast: #ffffff;
          --shadow: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
        }
        [data-theme="dark"] {
          --bg: #0b1220;
          --panel: #0f172a;
          --text: #e5e7eb;
          --muted: #94a3b8;
          --border: #1f2937;
          --brand: #22d3ee;
          --btn: #22d3ee;
          --btn-contrast: #0b1220;
          --shadow: 0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5);
        }
        .jobcard-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          padding: 16px 20px 32px;
        }
        .topbar {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          margin-bottom: 12px;
          gap: 12px;
        }
        .brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .logo {
  display: block;
  height: 44px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.25));
  user-select: none;
}
        .company { font-size: 18px; font-weight: 800; }
        .subtitle { font-size: 12px; color: var(--muted); }
        .actions { display: flex; align-items: center; gap: 10px; }
        .btn, .btn-ghost {
          border: 1px solid transparent; border-radius: 10px;
          padding: 10px 14px; font-weight: 600; cursor: pointer; transition: 0.15s ease;
        }
        .btn { background: var(--btn); color: var(--btn-contrast); }
        .btn:hover { filter: brightness(0.95); }
        .btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
        .btn-ghost:hover { background: rgba(148,163,184,0.12); }
        .search {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 14px; padding: 14px; margin-bottom: 14px; box-shadow: var(--shadow);
        }
        .search-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr auto auto auto; gap: 10px;
        }
        .search-grid input {
          height: 40px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--bg); color: var(--text); padding: 0 12px; outline: none;
        }
        .table-wrap {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: var(--shadow);
          overflow: auto;
        }
        table { width: 100%; border-collapse: collapse; min-width: 960px; }
        thead th {
          text-align: left; font-size: 12px; color: var(--muted);
          padding: 10px 12px; border-bottom: 1px solid var(--border); background: rgba(148,163,184,0.12);
        }
        tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
        tbody tr:hover { background: rgba(148,163,184,0.07); cursor: pointer; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .muted { color: var(--muted); }
        .right { text-align: right; }
        .row-actions { display: flex; gap: 8px; }
        @media (max-width: 920px) { .search-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="topbar">
        <div className="brand" onClick={onDashboard} title="Back to Dashboard">
         <img
    src={assets.logo}
    alt="JRR Automobiles"
    className="logo"
    height="56"
    width="auto"
    draggable="false"
  />
          <div>
            <div className="company">JRR Automobiles</div>
            <div className="subtitle">Job Cards</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn-ghost" onClick={onDashboard}>← Dashboard</button>
          <button className="btn" onClick={onCreate}>Create New Job Card</button>
        </div>
      </div>

      <div className="search">
        <div className="search-grid">
          <input
            type="text"
            placeholder="Search by Reg No"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value.toUpperCase())}
          />
          <input
            type="tel"
            placeholder="Search by Mobile No"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn" onClick={() => null}>Search</button>
          <button className="btn-ghost" onClick={onClear}>Clear</button>
          <button className="btn-ghost" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Jobcard No</th>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Vehicle Reg No</th>
              <th>Contact No</th>
              <th>Vehicle Model</th>
              <th>Brand</th>
              <th className="right">Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="muted">Loading job cards…</td>
              </tr>
            )}
            {err && !loading && (
              <tr>
                <td colSpan={9} className="muted">Error: {err}</td>
              </tr>
            )}
            {!loading && !err && filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="muted">No job cards found</td>
              </tr>
            )}
            {!loading && !err && filtered.map((r) => (
              <tr key={r?._id} onClick={() => onEdit(r?._id)}>
                <td className="mono">{r?.jobcardID || "-"}</td>
                <td>{formatDate(r?.date)}</td>
                <td>{r?.customerName}</td>
                <td className="mono">{r?.RegNo}</td>
                <td className="mono">{r?.mobileno}</td>
                <td>{r?.vehicleModel}</td>
                <td>{r?.brand || "-"}</td>
                <td className="right">{formatINR(r?.totalamount)}</td>
                <td>
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-ghost" onClick={() => onEdit(r?._id)}>Edit</button>
                    {/* You can add a delete here if desired, but primary edit is via detail page */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default JobcardHome;
