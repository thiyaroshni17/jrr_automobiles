// src/pages/jobcardhome.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/context";
import assets from "../assets/assets";

export default function JobcardHome() {
  const navigate = useNavigate();
  const { backendurl } = useContext(AppContent);

  // Separate search fields
  const [date, setDate] = useState("");      // YYYY-MM-DD from input[type="date"]
  const [regNo, setRegNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [jobNo, setJobNo] = useState("");

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Helpers
  const dmyToYmd = (dmy) => {
    if (!dmy || typeof dmy !== "string") return "";
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dmy.trim());
    if (!m) return "";
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatINR = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val || 0));

  const sumTotal = (r) => {
    const sp = Array.isArray(r?.spares) ? r.spares : [];
    const lb = Array.isArray(r?.labours) ? r.labours : [];
    const sum = (arr) =>
      arr.reduce(
        (acc, it) =>
          acc +
          Math.max(
            0,
            Number(it?.amount || 0) *
              Number(typeof it?.quantity === "number" ? it.quantity : (it?.quantity ?? 1))
          ),
        0
      );
    return sum(sp) + sum(lb);
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      // GET {backendurl}/jobcard/list -> { success, data: [...] }
      const res = await axios.get(`${backendurl}/jobcard/list`, { withCredentials: true });
      const arr = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
      setRows(arr);
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

  // Apply separate filters
  const filtered = useMemo(() => {
    const dFilter = String(date || "").trim();             // YYYY-MM-DD
    const rFilter = String(regNo || "").trim().toLowerCase();
    const mFilter = String(mobile || "").trim();
    const jFilter = String(jobNo || "").trim().toLowerCase();

    return (rows || []).filter((r) => {
      // Date equals (convert stored DD-MM-YYYY to YYYY-MM-DD)
      const matchDate = dFilter ? dmyToYmd(r?.date) === dFilter : true;

      const reg = String(r?.regno || r?.RegNo || "").toLowerCase();
      const jc = String(r?.jobcardNo || "").toLowerCase();
      const mob = String(r?.mobileno || "");

      const matchReg = rFilter ? reg.includes(rFilter) : true;
      const matchMob = mFilter ? mob.includes(mFilter) : true;
      const matchJob = jFilter ? jc.includes(jFilter) : true;

      return matchDate && matchReg && matchMob && matchJob;
    });
  }, [rows, date, regNo, mobile, jobNo]);

  const onClear = () => {
    setDate("");
    setRegNo("");
    setMobile("");
    setJobNo("");
  };

  const onEdit = (id) => navigate(`/jobcard/${id}`);
  const onCreate = () => navigate("/jobcard/create");
  const onDashboard = () => navigate("/home");

  return (
    <div className="jobcardhome-page" style={{ padding: 16 }}>
      <style>{`
        .header-row-1 {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          display: block;
  height: 44px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.25));
  user-select: none;
        }
        .company { font-size: 18px; font-weight: 800; color: #0f172a; }
        .subtitle { font-size: 12px; color: #64748b; }
        .actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .btn {
          height: 40px; padding: 0 14px; border-radius: 10px; font-weight: 600;
          border: 1px solid #e5e7eb; background: #0ea5e9; color: #fff; cursor: pointer;
        }
        .btn-outline { background: transparent; color: #0f172a; }

        .header-row-2 {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
        }
        .filters {
          display: grid;
          grid-template-columns: repeat(4, minmax(180px, 1fr));
          gap: 10px;
        }
        .input {
          height: 40px; padding: 0 12px;
          border: 1px solid #e5e7eb; border-radius: 10px; outline: none;
          background: #fff; color: #0f172a;
        }
        .table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        thead th { background: #f8fafc; font-weight: 700; }
        tr.clickable { cursor: pointer; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid #e5e7eb; }
        .badge-amber { background: #fbbf24; color: #1f2937; }
        .badge-green { background: #22c55e; color: #052e16; }
        .badge-gray  { background: #cbd5e1; color: #0f172a; }
        .empty { padding: 16px; color: #64748b; }

        @media (max-width: 920px) {
          .filters { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
        }
        @media (max-width: 520px) {
          .header-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Row 1: Logo + Company (left) / Buttons (right) */}
      <div className="header-row-1" style={{ paddingBottom:"20px",paddingTop:"10px" }}>
        <div className="brand">
          <img
    src={assets.logo}
    alt="JRR Automobiles"
    className="logo"
    height="56"
    width="auto"
    draggable="false"
  />
          <div >
            <div className="company">JRR Automobiles</div>
            <div className="subtitle">Job Cards</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={onDashboard}>← Dashboard</button>
          <button className="btn" onClick={onCreate}>+ New Job Card</button>
        </div>
      </div>

      {/* Row 2: Separate search fields + Clear/Refresh */}
      <div className="header-row-2" style={{paddingBottom: "20px"}}>
        <div className="filters">
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            title="Search by Date"
          />
          <input
            className="input"
            placeholder="Search Reg No"
            value={regNo}
            onChange={(e) => setRegNo(e.target.value)}
          />
          <input
            className="input"
            placeholder="Search Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <input
            className="input"
            placeholder="Search Job Card No"
            value={jobNo}
            onChange={(e) => setJobNo(e.target.value)}
          />
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={onClear}>Clear</button>
          <button className="btn btn-outline" onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Job Card No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Reg No</th>
              <th>Mobile</th>
              <th>Model</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="empty">Loading job cards…</td></tr>
            )}
            {!loading && err && (
              <tr><td colSpan={9} className="empty">Error: {err}</td></tr>
            )}
            {!loading && !err && filtered.length === 0 && (
              <tr><td colSpan={9} className="empty">No job cards found</td></tr>
            )}
            {!loading && !err && filtered.map((r) => {
              const id = String(r?._id || "");
              const total = sumTotal(r);
              const status = String(r?.status || r?.jobStatus || "pending").toLowerCase();
              const statusClass =
                status === "completed" ? "badge badge-green" :
                status === "closed" ? "badge badge-gray" : "badge badge-amber";
              return (
                <tr key={id} className="clickable" onClick={() => onEdit(id)}>
                  <td>{r?.jobcardNo || "-"}</td>
                  <td>{r?.date || "-"}</td>
                  <td>{r?.name || r?.customerName || "-"}</td>
                  <td>{r?.regno || r?.RegNo || "-"}</td>
                  <td>{r?.mobileno || "-"}</td>
                  <td>{r?.vehicleModel || "-"}</td>
                  <td>{r?.brand || "-"}</td>
                  <td><span className={statusClass}>{status.toUpperCase()}</span></td>
                  <td>{formatINR(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
