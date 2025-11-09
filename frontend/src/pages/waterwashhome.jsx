// WaterWashHome.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/context";
import assets from "../assets/assets";

export default function WaterWashHome() {
  const navigate = useNavigate();
  const { backendurl } = useContext(AppContent);

  

  // Search inputs (date, name, reg no, mobile no)
  const [date, setDate] = useState("");       // YYYY-MM-DD
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [mobile, setMobile] = useState("");

  // Data state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onDashboard = () => navigate("/home");
  const onCreate = () => navigate("/waterwash/create");
  const onEdit = (id) => navigate(`/waterwash/${id}`);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get(backendurl + "/waterwash/list");
      const list = res.data?.data || [];
      setRows(Array.isArray(list) ? list : []);
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

  // Client-side filter: AND across provided fields (date exact, name/reg/mobile substring)
  const filtered = useMemo(() => {
    const dFilter = date.trim();
    const nFilter = name.trim().toLowerCase();
    const rFilter = regNo.trim().toLowerCase();
    const mFilter = mobile.trim();

    return rows.filter((r) => {
      const matchDate = dFilter ? yyyy_mm_dd(r?.date) === dFilter : true;

      const entries = Array.isArray(r?.entries) ? r.entries : [];

      const matchName = nFilter
        ? entries.some((e) =>
            String(e?.name || "").toLowerCase().includes(nFilter)
          )
        : true;

      const matchReg = rFilter
        ? entries.some((e) =>
            String(e?.regNo || "").toLowerCase().includes(rFilter)
          )
        : true;

      const matchMobile = mFilter
        ? entries.some((e) => String(e?.mobileNo || "").includes(mFilter))
        : true;

      return matchDate && matchName && matchReg && matchMobile;
    });
  }, [rows, date, name, regNo, mobile]);

  const onDelete = async (id) => {
    if (!window.confirm("Delete this water wash day?")) return;
    try {
      await axios.delete(backendurl + `/waterwash/delete/${id}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  return (
    <div className="waterwash-page">
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
          --danger: #ef4444;
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
          --danger: #f87171;
          --shadow: 0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5);
        }
        .waterwash-page { min-height: 100vh; background: var(--bg); color: var(--text); padding: 16px 20px 32px; }
        .topbar { display: grid; grid-template-columns: 1fr auto; align-items: center; margin-bottom: 12px; gap: 12px; }
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
        .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .btn, .btn-ghost, .btn-danger {
          border: 1px solid transparent; border-radius: 10px; padding: 10px 14px; font-weight: 600; cursor: pointer; transition: 0.15s ease;
        }
        .btn { background: var(--btn); color: var(--btn-contrast); }
        .btn:hover { filter: brightness(0.95); }
        .btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
        .btn-ghost:hover { background: rgba(148,163,184,0.12); }
        .btn-danger { background: var(--danger); color: #fff; }

        .search {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 14px; padding: 14px; margin-bottom: 14px; box-shadow: var(--shadow);
        }
        .search-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr auto auto auto;
          gap: 10px;
        }
        .search-grid input {
          height: 40px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--bg); color: var(--text); padding: 0 12px; outline: none; width: 100%;
        }
        .table-wrap {
          background: var(--panel); border: 1px solid var(--border);
          border-radius: 14px; box-shadow: var(--shadow); overflow: hidden;
        }

        /* Make table wrap/resize; avoid horizontal scroll */
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        thead th {
          text-align: left; font-size: 12px; color: var(--muted);
          padding: 10px 12px; border-bottom: 1px solid var(--border); background: rgba(148,163,184,0.12);
        }
        tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 14px; word-wrap: break-word; overflow-wrap: anywhere; }
        tbody tr:hover { background: rgba(148,163,184,0.07); cursor: pointer; }
        .right { text-align: right; }
        .muted { color: var(--muted); }
        .row-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* Stack content on small screens to prevent horizontal scroll */
        @media (max-width: 900px) {
          .search-grid { grid-template-columns: 1fr 1fr; }
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tbody tr {
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 10px;
            margin: 10px;
            background: var(--bg);
            box-shadow: var(--shadow);
          }
          tbody td { border: none; padding: 6px 0; }
          .right { text-align: left; }
        }
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
            <div className="subtitle">Water Wash Register</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn-ghost" onClick={onDashboard}>← Dashboard</button>
          
          <button className="btn" onClick={onCreate}>Create New</button>
        </div>
      </div>

      <div className="search">
        <div className="search-grid">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search name"
          />
          <input
            type="text"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
            placeholder="Search reg no"
          />
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Search mobile no"
          />
          <button className="btn" onClick={() => null}>Search</button>
          <button
            className="btn-ghost"
            onClick={() => {
              setDate("");
              setName("");
              setRegNo("");
              setMobile("");
            }}
          >
            Clear
          </button>
          <button className="btn-ghost" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th className="right">Total Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} className="muted">Loading water wash…</td>
              </tr>
            )}
            {err && !loading && (
              <tr>
                <td colSpan={3} className="muted">Error: {err}</td>
              </tr>
            )}
            {!loading && !err && filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">No records found</td>
              </tr>
            )}
            {!loading && !err && filtered.map((r) => (
              <tr key={r?._id} onClick={() => onEdit(r?._id)}>
                <td>{formatDate(r?.date)}</td>
                <td className="right">{formatINR(r?.totalDailyAmount)}</td>
                <td>
                  <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-ghost" onClick={() => onEdit(r?._id)}>Edit</button>
                    <button className="btn-danger" onClick={() => onDelete(r?._id)}>Delete</button>
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
