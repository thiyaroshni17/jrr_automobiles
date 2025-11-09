// BodyShopPage.jsx
import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/context";
import assets from "../assets/assets";

const emptyEntry = () => ({
  name: "",
  regNo: "",
  mobileNo: "",
  vehicleName: "",
  serviceType: "",     // "bodyshop" | "mechanic"
  modeOfPayment: "",   // "gpay" | "cash" | "card"
  jobcardNo: "",
  amount: ""
});

// Local-safe date -> YYYY-MM-DD for <input type="date">
const toInputYMD = (dateLike) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

// Convert YYYY-MM-DD -> DD-MM-YYYY for API payload
const toDMY = (ymd) => {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}-${m}-${y}`;
};
const isYMD = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function BodyShopPage() {
  const { id } = useParams(); // undefined at /bodyshop/create
  const isCreate = !id;
  const navigate = useNavigate();
  const { backendurl } = useContext(AppContent);

 

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [invalidRows, setInvalidRows] = useState([]); // rows missing requireds

  const [form, setForm] = useState({
    date: toInputYMD(new Date()),
    entries: [emptyEntry()],
    totalDailyAmount: 0
  });

  const computedTotal = useMemo(
    () => (form.entries || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [form.entries]
  );

  // Load existing day by id
  useEffect(() => {
    const load = async () => {
      if (isCreate) return;
      setLoading(true);
      setErr("");
      try {
        const res = await axios.get(backendurl + `/bodyshop/${id}`);
        const d = res.data?.data || {};
        setForm({
          date: d.date ? toInputYMD(d.date) : "",
          entries:
            Array.isArray(d.entries) && d.entries.length
              ? d.entries.map((e) => ({
                  name: e.name || "",
                  regNo: e.regNo || e.regno || "",
                  mobileNo: e.mobileNo || e.mobileno || "",
                  vehicleName: e.vehicleName || e["vehicle name"] || "",
                  serviceType: e.serviceType || e["service type"] || "",
                  modeOfPayment: e.modeOfPayment || e["mode of payment"] || "",
                  jobcardNo: e.jobcardNo || e.Jobcardno || "",
                  amount: e.amount ?? ""
                }))
              : [emptyEntry()],
          totalDailyAmount: Number(d.totalDailyAmount || 0)
        });
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate, backendurl]);

  // Duplicate date check -> redirect to edit if exists (optional safeguard)
  const checkingRef = useRef(false);
  const checkExistingByDate = async (yyyy_mm_dd, opts = { prompt: true }) => {
    if (checkingRef.current || !isCreate || !isYMD(yyyy_mm_dd)) return false;
    checkingRef.current = true;
    try {
      const dmy = toDMY(yyyy_mm_dd);
      const url = `${backendurl}/bodyshop/list?start=${dmy}&end=${dmy}`;
      const res = await axios.get(url);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (list.length > 0 && list[0]?._id) {
        if (!opts.prompt || window.confirm("Entry for this date already exists.\nOpen it to edit?")) {
          navigate(`/bodyshop/${list[0]._id}`, { replace: true });
        } else {
          setMsg("Entry for this date exists; creation cancelled");
        }
        return true;
      }
      return false;
    } catch (e) {
      // silent/log
      console.error("Date check failed", e?.response?.data || e.message);
      return false;
    } finally {
      checkingRef.current = false;
    }
  };

  // Handlers
  const onDateChange = async (e) => {
    const value = e.target.value; // YYYY-MM-DD
    setForm((f) => ({ ...f, date: value }));
    if (isCreate && isYMD(value)) {
      await checkExistingByDate(value, { prompt: true });
    }
  };

  const onEntryChange = (idx, key, value) => {
    setForm((f) => {
      const next = [...(f.entries || [])];
      next[idx] = { ...next[idx], [key]: value };
      return { ...f, entries: next };
    });
  };

  const addEntry = () =>
    setForm((f) => ({ ...f, entries: [...(f.entries || []), emptyEntry()] }));

  const removeEntry = (idx) =>
    setForm((f) => ({
      ...f,
      entries: (f.entries || []).filter((_, i) => i !== idx)
    }));

  // Validation: require date, and for each row: serviceType, vehicleName, amount > 0
  const validate = () => {
    const issues = [];
    if (!form.date || !isYMD(form.date)) {
      setErr("Date is required");
      return { ok: false, invalidRows: issues };
    }
    (form.entries || []).forEach((e, i) => {
      const serviceMissing = !String(e.serviceType || "").trim();
      const vehicleMissing = !String(e.vehicleName || "").trim();
      const amountMissing = !(Number(e.amount) > 0);
      if (serviceMissing || vehicleMissing || amountMissing) issues.push(i);
    });
    if (issues.length > 0) {
      setErr("Service Type, Vehicle Name, and Amount are required for all entries");
      setInvalidRows(issues);
      return { ok: false, invalidRows: issues };
    }
    setErr("");
    setInvalidRows([]);
    return { ok: true, invalidRows: [] };
  };

  // Payload mapping (controller expects DD-MM-YYYY)
  const toPayload = () => ({
    date: toDMY(form.date),
    entries: (form.entries || []).map((e) => ({
      name: String(e.name || "").trim(),
      regno: String(e.regNo || "").trim(),
      mobileno: String(e.mobileNo || "").trim(),
      "service type": String(e.serviceType || "").trim(),
      "mode of payment": String(e.modeOfPayment || "").trim(),
      "vehicle name": String(e.vehicleName || "").trim(),
      Jobcardno: String(e.jobcardNo || "").trim(),
      amount: Number(e.amount || 0)
    }))
    // sno auto-filled server-side; totals recomputed server-side
  });

  const onSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      const v = validate();
      if (!v.ok) return;

      // Prevent duplicate date on create
      if (isCreate) {
        const exists = await checkExistingByDate(form.date, { prompt: true });
        if (exists) return;
      }

      const payload = toPayload();
      if (isCreate) {
        const res = await axios.post(backendurl + "/bodyshop/create", payload);
        const newId = res?.data?.data?._id;
        setMsg("Created");
        if (newId) navigate(`/bodyshop/${newId}`, { replace: true });
      } else {
        await axios.put(backendurl + `/bodyshop/update/${id}`, payload);
        setMsg("Saved");
      }
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          (isCreate ? "Create failed" : "Save failed")
      );
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isCreate) {
      navigate("/bodyshophome");
      return;
    }
    if (!window.confirm("Delete this body shop day?")) return;
    try {
      await axios.delete(backendurl + `/bodyshop/delete/${id}`);
      navigate("/bodyshophome", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const invalidStyle = (idx, key) =>
    invalidRows.includes(idx) &&
    (key === "serviceType" || key === "vehicleName" || key === "amount")
      ? { borderColor: "#ef4444" }
      : {};

  return (
    <div className="bodyshop-page">
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
        .bodyshop-page { min-height: 100vh; background: var(--bg); color: var(--text); padding: 16px 20px 32px; }
        .topbar { display: grid; grid-template-columns: 1fr auto; align-items: center; margin-bottom: 12px; gap: 12px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .logo { display: block;
  height: 44px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.25));
  user-select: none; }
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
        .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 14px; box-shadow: var(--shadow); margin-bottom: 14px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .row { display: flex; flex-direction: column; gap: 6px; }
        .row label { font-size: 12px; color: var(--muted); }
        .row input, .row select {
          height: 40px; border: 1px solid var(--border); border-radius: 10px;
          background: var(--bg); color: var(--text); padding: 0 12px; outline: none; width: 100%;
        }

        /* Responsive table: no horizontal scroll; stack as cards on narrow screens */
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid var(--border); padding: 8px; text-align: left; vertical-align: top; word-wrap: break-word; }
        tfoot td { font-weight: 700; }

        @media (max-width: 980px) {
          .grid-2 { grid-template-columns: 1fr; }
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tbody tr {
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 10px;
            margin-bottom: 12px;
            box-shadow: var(--shadow);
            background: var(--bg);
          }
          tbody td { border: none; padding: 6px 0; }
          tbody td > input, tbody td > select { width: 100%; }
          tfoot tr { display: grid; grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="topbar">
        <div className="brand">
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
            <div className="subtitle">{isCreate ? "New Body Shop" : "Edit Body Shop"}</div>
          </div>
        </div>
        <div className="actions">
          <button className="btn-ghost" onClick={() => navigate("/bodyshophome")}>← Back</button>
          
          <button className="btn" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="btn-danger" onClick={onDelete}>{isCreate ? "Cancel" : "Delete"}</button>
        </div>
      </div>

      {err && <div className="panel" style={{ color: "#ef4444" }}>{err}</div>}
      {msg && <div className="panel" style={{ color: "#16a34a" }}>{msg}</div>}

      <div className="panel">
        <div className="grid-2">
          <div className="row">
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={onDateChange} />
          </div>
          <div className="row">
            <label>Total (preview)</label>
            <input value={new Intl.NumberFormat("en-IN").format(computedTotal)} readOnly />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label>Entries</label>
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.No</th>
                <th>Name</th>
                <th>Reg No</th>
                <th>Mobile No</th>
                <th>Vehicle</th>
                <th>Service Type</th>
                <th>Payment</th>
                <th>JobCard No</th>
                <th>Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(form.entries || []).map((e, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      value={e.name}
                      onChange={(ev) => onEntryChange(idx, "name", ev.target.value)}
                      placeholder="Name"
                    />
                  </td>
                  <td>
                    <input
                      value={e.regNo}
                      onChange={(ev) => onEntryChange(idx, "regNo", ev.target.value.toUpperCase())}
                      placeholder="TN00AB1234"
                    />
                  </td>
                  <td>
                    <input
                      value={e.mobileNo}
                      onChange={(ev) => onEntryChange(idx, "mobileNo", ev.target.value)}
                      placeholder="Mobile No"
                    />
                  </td>
                  <td>
                    <input
                      value={e.vehicleName}
                      onChange={(ev) => onEntryChange(idx, "vehicleName", ev.target.value)}
                      placeholder="Vehicle"
                      required
                      style={invalidStyle(idx, "vehicleName")}
                    />
                  </td>
                  <td>
                    <select
                      value={e.serviceType}
                      onChange={(ev) => onEntryChange(idx, "serviceType", ev.target.value)}
                      required
                      style={invalidStyle(idx, "serviceType")}
                    >
                      <option value="">Select</option>
                      <option value="mechanic">Mechanic</option>
                      <option value="bodyshop">Body Shop</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={e.modeOfPayment}
                      onChange={(ev) => onEntryChange(idx, "modeOfPayment", ev.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="cash">Cash</option>
                      <option value="gpay">GPay</option>
                      <option value="card">Card</option>
                    </select>
                  </td>
                  <td>
                    <input
                      value={e.jobcardNo}
                      onChange={(ev) => onEntryChange(idx, "jobcardNo", ev.target.value.toUpperCase())}
                      placeholder="JRR-2025-00001"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={e.amount}
                      onChange={(ev) => onEntryChange(idx, "amount", ev.target.value)}
                      placeholder="0"
                      required
                      style={invalidStyle(idx, "amount")}
                      min={1}
                    />
                  </td>
                  <td>
                    <button className="btn-ghost" onClick={() => removeEntry(idx)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8}>Total</td>
                <td colSpan={2}>₹ {computedTotal.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ marginTop: 8 }}>
            <button className="btn-ghost" onClick={addEntry}>+ Add Entry</button>
          </div>
        </div>
      </div>
    </div>
  );
}
