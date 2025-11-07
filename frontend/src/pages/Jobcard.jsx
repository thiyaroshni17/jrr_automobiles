// JobcardPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AppContent } from "../context/context";
import assets from "../assets/assets";




const emptyService = () => ({ description: "", amount: "" });

export default function JobcardPage() {
  const { id } = useParams(); // undefined for /jobcard/new
  const isCreate = !id;
  const navigate = useNavigate();
  const printRef = useRef(null);

  const {backendurl} = useContext(AppContent)
  // Theme (no localStorage)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    jobcardID: "",
    customerName: "",
    email: "",
    mobileno: "",
    address: "",
    date: new Date().toISOString().slice(0, 10),
    RegNo: "",
    vehicleModel: "",
    brand: "",
    dieselOrPetrol: "",
    kilometers: "",
    services: [emptyService()],
    remarks: "",
    totalamount: 0,
  });

  // Derived: compute total client-side for display
  const computedTotal = useMemo(() => {
    const sum = (form.services || []).reduce(
      (acc, s) => acc + (Number(s.amount) || 0),
      0
    );
    return sum;
  }, [form.services]);

  const loadById = async () => {
    if (isCreate) return;
    setLoading(true);
    setErr("");
    try {
      const res = await axios.get( backendurl + `/jobcard/${id}`);
      const d = res.data || {};
      setForm({
        jobcardID: d.jobcardID || "",
        customerName: d.customerName || "",
        email: d.email || "",
        mobileno: d.mobileno || "",
        address: d.address || "",
        date: d.date ? new Date(d.date).toISOString().slice(0, 10) : "",
        RegNo: d.RegNo || "",
        vehicleModel: d.vehicleModel || "",
        brand: d.brand || "",
        dieselOrPetrol: d.dieselOrPetrol || "",
        kilometers: d.kilometers || "",
        services:
          Array.isArray(d.services) && d.services.length
            ? d.services.map((s) => ({
                description: s.description || "",
                amount: s.amount ?? "",
              }))
            : [emptyService()],
        remarks: d.remarks || "",
        totalamount: d.totalamount || 0,
      });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onServiceChange = (idx, key, value) => {
    setForm((f) => {
      const next = [...(f.services || [])];
      next[idx] = { ...next[idx], [key]: key === "amount" ? value : value };
      return { ...f, services: next };
    });
  };

  const addService = () =>
    setForm((f) => ({ ...f, services: [...(f.services || []), emptyService()] }));

  const removeService = (idx) =>
    setForm((f) => ({
      ...f,
      services: (f.services || []).filter((_, i) => i !== idx),
    }));

  const toPayload = () => {
    const p = {
      customerName: form.customerName,
      email: form.email || undefined,
      mobileno: form.mobileno,
      address: form.address || undefined,
      date: form.date || undefined,
      RegNo: form.RegNo,
      vehicleModel: form.vehicleModel,
      brand: form.brand || undefined,
      dieselOrPetrol: form.dieselOrPetrol || undefined,
      kilometers: form.kilometers || undefined,
      remarks: form.remarks || undefined,
      services: (form.services || []).map((s) => ({
        description: String(s.description || "").trim(),
        amount: Number(s.amount || 0),
      })),
    };
    return p;
  };

  const onSave = async () => {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      if (isCreate) {
        const res = await axios.post(backendurl + "/jobcard/create", toPayload());
        setMsg("Created");
        const newId = res?.data?._id;
        if (newId) navigate(`/jobcard/${newId}`, { replace: true });
      } else {
        const res = await axios.put(backendurl + `/jobcard/update/${id}`, toPayload());
        setMsg("Saved");
        // Refresh from server to reflect backend-calculated totalamount/jobcardID updates
        if (res?.data?._id) await loadById();
      }
    } catch (e) {
      const m =
        e?.response?.data?.message ||
        e?.message ||
        (isCreate ? "Create failed" : "Save failed");
      setErr(m);
      if (m.toLowerCase().includes("regno")) {
        // Specific duplicate RegNo feedback
        setErr("RegNo already exists");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isCreate) {
      navigate("/jobcardhome");
      return;
    }
    if (!window.confirm("Delete this job card?")) return;
    try {
      await axios.delete(backendurl + `/jobcard/delete/${id}`);
      navigate("/jobcardhome", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const printContent = () => {
    window.print();
  };

  const downloadHtml = () => {
    // Create a minimal HTML snapshot of the printable area
    const content = printRef.current?.innerHTML || "";
    const full = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${form.jobcardID || "Jobcard"}</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
  h1 { margin: 0 0 8px; }
  .muted { color: #6b7280; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
  tfoot td { font-weight: 700; }
</style>
</head>
<body>
${content}
</body>
</html>`;
    const blob = new Blob([full], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${form.jobcardID || "jobcard"}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const onBack = () => navigate("/jobcardhome");

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
        .jobcard-page { min-height: 100vh; background: var(--bg); color: var(--text); padding: 16px 20px 32px; }
        .topbar { display: grid; grid-template-columns: 1fr auto; align-items: center; margin-bottom: 12px; gap: 12px; }
        .brand { display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .logo { display: block;
  height: 44px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.25));
  user-select: none;}
        .company { font-size: 18px; font-weight: 800; }
        .subtitle { font-size: 12px; color: var(--muted); }
        .actions { display: flex; align-items: center; gap: 10px; }
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
        .row input, .row textarea, .row select {
          height: 40px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--bg); color: var(--text); padding: 0 12px; outline: none;
        }
        .row textarea { height: 80px; padding: 8px 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid var(--border); padding: 8px; text-align: left; }
        tfoot td { font-weight: 700; }
        @media (max-width: 920px) { .grid-2 { grid-template-columns: 1fr; } }
        @media print {
          .no-print { display: none !important; }
          .printable { box-shadow: none; border: none; }
          body { background: #fff; }
        }
      `}</style>

      <div className="topbar">
        <div className="brand" onClick={() => navigate("/home")} title="Back to Dashboard">
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
            <div className="subtitle">{isCreate ? "New Job Card" : "Edit Job Card"}</div>
          </div>
        </div>
        <div className="actions no-print">
          <button className="btn-ghost" onClick={onBack}>← Jobcards</button>
          <button className="btn-ghost" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            {theme === "dark" ? "Light Theme" : "Dark Theme"}
          </button>
          <button className="btn" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-ghost" onClick={downloadHtml}>Download</button>
          <button className="btn-ghost" onClick={printContent}>Print</button>
          <button className="btn-danger" onClick={onDelete}>{isCreate ? "Cancel" : "Delete"}</button>
        </div>
      </div>

      {err && <div className="panel" style={{ color: "#ef4444" }}>{err}</div>}
      {msg && <div className="panel" style={{ color: "#16a34a" }}>{msg}</div>}

      <div className="panel printable" ref={printRef}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>
          {form.jobcardID ? `Jobcard ${form.jobcardID}` : "Jobcard"}
        </h2>
        <div className="grid-2">
          <div className="row">
            <label>Customer Name</label>
            <input name="customerName" value={form.customerName} onChange={onChange} placeholder="Customer Name" />
          </div>
          <div className="row">
            <label>Mobile No</label>
            <input name="mobileno" value={form.mobileno} onChange={onChange} placeholder="10-digit number" />
          </div>
          <div className="row">
            <label>Email</label>
            <input name="email" value={form.email} onChange={onChange} placeholder="Email" />
          </div>
          <div className="row">
            <label>Address</label>
            <input name="address" value={form.address} onChange={onChange} placeholder="Address" />
          </div>
          <div className="row">
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={onChange} />
          </div>
          <div className="row">
            <label>Vehicle Reg No</label>
            <input
              name="RegNo"
              value={form.RegNo}
              onChange={(e) => onChange({ target: { name: "RegNo", value: e.target.value.toUpperCase() } })}
              placeholder="TN01AB1234"
            />
          </div>
          <div className="row">
            <label>Vehicle Model</label>
            <input name="vehicleModel" value={form.vehicleModel} onChange={onChange} placeholder="Model" />
          </div>
          <div className="row">
            <label>Brand</label>
            <input name="brand" value={form.brand} onChange={onChange} placeholder="Brand" />
          </div>
          <div className="row">
            <label>Fuel</label>
            <select name="dieselOrPetrol" value={form.dieselOrPetrol} onChange={onChange}>
              <option value="">Select</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="EV">EV</option>
            </select>
          </div>
          <div className="row">
            <label>Kilometers</label>
            <input name="kilometers" value={form.kilometers} onChange={onChange} placeholder="e.g., 34500" />
          </div>
          <div className="row" style={{ gridColumn: "1 / -1" }}>
            <label>Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={onChange} placeholder="Remarks or notes" />
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <label>Services</label>
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>S.No</th>
                <th>Description</th>
                <th style={{ width: 180 }}>Amount (₹)</th>
                <th className="no-print" style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(form.services || []).map((s, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <input
                      value={s.description}
                      onChange={(e) => onServiceChange(idx, "description", e.target.value)}
                      placeholder="Service description"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={s.amount}
                      onChange={(e) => onServiceChange(idx, "amount", e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="no-print">
                    <button className="btn-ghost" onClick={() => removeService(idx)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td>
                <td colSpan={2}>₹ {computedTotal.toLocaleString("en-IN")}</td>
              </tr>
            </tfoot>
          </table>
          <div className="no-print" style={{ marginTop: 8 }}>
            <button className="btn-ghost" onClick={addService}>+ Add Service</button>
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Note: Total shown is computed on the client for preview; the server also normalizes services and recalculates totalamount on save. 
        </div>
      </div>
    </div>
  );
}
