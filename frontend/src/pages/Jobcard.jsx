// src/pages/Jobcard.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/context";

// Row factories
const emptySpare = () => ({ description: "", quantity: 1, amount: "", done: false });
const emptyLabour = () => ({ description: "", quantity: 1, amount: "", done: false });

// YYYY-MM-DD -> DD-MM-YYYY
const toDMY = (ymd) => {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}-${m}-${y}`;
};

// any date-like -> YYYY-MM-DD
const toInputYMD = (dateLike) => {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};
const isYMD = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

// Currency
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

// Renumber helpers
const renumber = (rows = []) => rows.map((r, idx) => ({ ...r, sno: idx + 1 }));

// jsPDF lazy load
const ensureJsPdf = async () => {
  if (window.jspdf && window.jspdf.jsPDF && window.jspdfAutoTable) return window.jspdf;
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js";
    s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  return window.jspdf;
};

// Build PDF (no work-done/status)
const buildJobcardPdf = (doc, form, totals, financials) => {
  const margin = 36;
  let y = margin;

  const dmy = toDMY(form.date) || "-";
  const jobno = String(form.jobcardNo || "-");
  const name = String(form.name || "-");
  const mobile = String(form.mobileno || "-");
  const regno = String(form.regno || "-");
  const address = String(form.address || "-");
  const email = String(form.email || "-");
  const model = String(form.vehicleModel || "-");
  const brand = String(form.brand || "-");
  const fuel = String(form.fuelType || "-");
  const km = String(form.kilometer || "0");
  const remarks = String(form.remarks || "-");

  const spares = Array.isArray(form.spares) ? form.spares : [];
  const labours = Array.isArray(form.labours) ? form.labours : [];

  doc.setFont("helvetica", "bold"); doc.setFontSize(16);
  doc.text("JRR Automobiles - Job Card", margin, y);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.text(`Job Card No: ${jobno}`, 420, y, { align: "left" });
  y += 16;
  doc.text(`Date: ${dmy}`, 420, y, { align: "left" });
  y += 10;

  doc.setFont("helvetica", "bold"); doc.text("Customer", margin, y);
  doc.setFont("helvetica", "normal"); y += 12;
  doc.text(`Name: ${name}`, margin, y); y += 12;
  doc.text(`Mobile: ${mobile}`, margin, y); y += 12;
  doc.text(`Reg No: ${regno}`, margin, y); y += 12;
  doc.text(`Email: ${email}`, margin, y); y += 12;
  doc.text(`Address: ${address}`, margin, y);

  let rightY = margin + 12;
  doc.setFont("helvetica", "bold"); doc.text("Vehicle", 320, margin);
  doc.setFont("helvetica", "normal");
  doc.text(`Model: ${model}`, 320, rightY); rightY += 12;
  doc.text(`Brand: ${brand}`, 320, rightY); rightY += 12;
  doc.text(`Fuel: ${fuel}`, 320, rightY); rightY += 12;
  doc.text(`Kilometers: ${km}`, 320, rightY); rightY += 12;

  const blockEnd = Math.max(y, rightY);
  y = blockEnd + 14;

  doc.setFont("helvetica", "bold"); doc.text("Remarks", margin, y);
  doc.setFont("helvetica", "normal"); y += 12;
  const remarksLines = doc.splitTextToSize(remarks, 540);
  doc.text(remarksLines, margin, y);
  y += remarksLines.length * 12 + 6;

  if (spares.length) {
    doc.setFont("helvetica", "bold"); doc.text("Spares", margin, y); doc.setFont("helvetica", "normal");
    y += 6;
    doc.autoTable({
      startY: y + 6,
      head: [["S.No", "Description", "Amount", "Qty", "Row Total"]],
      body: spares.map((s, i) => {
        const amt = Number(s.amount || 0);
        const qty = Number(s.quantity ?? 1);
        const row = Math.max(0, amt * qty);
        return [String((s.sno ?? i + 1)), String(s.description || "-"), INR.format(amt), String(qty), INR.format(row)];
      }),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
      columnStyles: { 0: { cellWidth: 40 }, 2: { cellWidth: 80, halign: "right" }, 3: { cellWidth: 40, halign: "right" }, 4: { cellWidth: 90, halign: "right" } },
      headStyles: { fillColor: [14, 165, 233] }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (labours.length) {
    doc.setFont("helvetica", "bold"); doc.text("Labour", margin, y); doc.setFont("helvetica", "normal");
    y += 6;
    doc.autoTable({
      startY: y + 6,
      head: [["S.No", "Description", "Amount", "Qty", "Row Total"]],
      body: labours.map((l, i) => {
        const amt = Number(l.amount || 0);
        const qty = Number(l.quantity ?? 1);
        const row = Math.max(0, amt * qty);
        return [String((l.sno ?? i + 1)), String(l.description || "-"), INR.format(amt), String(qty), INR.format(row)];
      }),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
      columnStyles: { 0: { cellWidth: 40 }, 2: { cellWidth: 80, halign: "right" }, 3: { cellWidth: 40, halign: "right" }, 4: { cellWidth: 90, halign: "right" } },
      headStyles: { fillColor: [14, 165, 233] }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  doc.setFont("helvetica", "bold"); doc.text("Summary", margin, y);
  doc.setFont("helvetica", "normal"); y += 12;
  doc.text(`Spares Total: ${INR.format(totals.spares)}`, margin, y); y += 12;
  doc.text(`Labour Total: ${INR.format(totals.labours)}`, margin, y); y += 12;
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total: ${INR.format(totals.grand)}`, margin, y); y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(`Advance Paid: ${INR.format(financials.advance)}`, margin, y); y += 12;
  doc.text(`Balance: ${INR.format(financials.balance)}`, margin, y);
};

export default function Jobcard() {
  const { id } = useParams();
  const isCreate = !id;
  const navigate = useNavigate();
  const { backendurl } = useContext(AppContent);

  // Use absolute backend base including /jrr so calls don’t hit :3000 and 404
  const API = backendurl || "http://localhost:5000/jrr"; // keep /jrr here to match your server mount
  // Your routes: POST /jobcard/create, GET /jobcard/list/:id, PUT /jobcard/update/:id, DELETE /jobcard/delete/:id

  const [theme, setTheme] = useState("light");
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    jobcardNo: "",
    jobStatus: "pending",
    date: toInputYMD(new Date()),
    name: "",
    mobileno: "",
    regno: "",
    address: "",
    email: "",
    vehicleModel: "",
    brand: "",
    fuelType: "",
    kilometer: "",
    remarks: "",
    spares: renumber([emptySpare()]),
    labours: renumber([emptyLabour()]),
    advancePaid: 0
  });

  const totals = useMemo(() => {
    const sumRows = (rows = []) =>
      rows.reduce((sum, r) => sum + Math.max(0, Number(r.amount || 0) * Number(r.quantity ?? 1)), 0);
    const spares = sumRows(form.spares);
    const labours = sumRows(form.labours);
    return { spares, labours, grand: spares + labours };
  }, [form.spares, form.labours]);

  const financials = useMemo(() => {
    const advance = Number(form.advancePaid || 0);
    const balance = Math.max(0, Number(totals.grand || 0) - advance);
    return { advance, balance };
  }, [form.advancePaid, totals]);

  const autoStatus = useMemo(() => {
    const sp = (form.spares || []).every((s) => !!s.done);
    const lb = (form.labours || []).every((l) => !!l.done);
    return sp && lb ? "completed" : "pending";
  }, [form.spares, form.labours]);

  const statusClass = useMemo(() => {
    switch ((form.jobStatus || "").toLowerCase()) {
      case "completed": return "badge badge-green";
      case "closed": return "badge badge-gray";
      default: return "badge badge-amber";
    }
  }, [form.jobStatus]);

  useEffect(() => {
    const load = async () => {
      if (isCreate) {
        setForm((f) => ({ ...f, jobStatus: autoStatus }));
        return;
      }
      setLoading(true); setErr("");
      try {
        // GET /jobcard/list/:id
        const res = await axios.get(`${API}/jobcard/list/${id}`);
        const d = res.data?.data || {};
        const sparesDB = Array.isArray(d.spares)
          ? d.spares.map((s) => ({
              description: s.description || "",
              quantity: s.quantity ?? 1,
              amount: s.amount ?? "",
              done: !!s.done
            }))
          : [];
        const laboursDB = Array.isArray(d.labours)
          ? d.labours.map((l) => ({
              description: l.description || "",
              quantity: l.quantity ?? 1,
              amount: l.amount ?? "",
              done: !!l.done
            }))
          : [];
        setForm({
          jobcardNo: d.jobcardNo || d.jobcardID || "",
          jobStatus: String(d.jobStatus || d.status || autoStatus || "pending"),
          date: d.date ? toInputYMD(d.date) : "",
          name: d.name || d.customerName || "",
          mobileno: d.mobileno || "",
          regno: d.regno || d.RegNo || "",
          address: d.address || "",
          email: d.email || "",
          vehicleModel: d.vehicleModel || "",
          brand: d.brand || "",
          fuelType: d.fuelType || d.dieselOrPetrol || "",
          kilometer: d.kilometer || d.kilometers || "",
          remarks: d.remarks || "",
          spares: renumber(sparesDB.length ? sparesDB : [emptySpare()]),
          labours: renumber(laboursDB.length ? laboursDB : [emptyLabour()]),
          advancePaid: Number(d.advancePaid || 0)
        });
      } catch (e) {
        setErr(e?.response?.data?.message || e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isCreate, API]);

  // Handlers (renumber only on add/remove)
  const onField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const onSpare = (i, k, v) =>
    setForm((f) => {
      const next = [...(f.spares || [])];
      next[i] = { ...next[i], [k]: v };
      return { ...f, spares: next };
    });
  const onLabour = (i, k, v) =>
    setForm((f) => {
      const next = [...(f.labours || [])];
      next[i] = { ...next[i], [k]: v };
      return { ...f, labours: next };
    });

  const addSpareRow = () =>
    setForm((f) => ({ ...f, spares: renumber([...(f.spares || []), emptySpare()]) }));
  const addLabourRow = () =>
    setForm((f) => ({ ...f, labours: renumber([...(f.labours || []), emptyLabour()]) }));
  const removeSpare = (i) =>
    setForm((f) => ({ ...f, spares: renumber((f.spares || []).filter((_, idx) => idx !== i)) }));
  const removeLabour = (i) =>
    setForm((f) => ({ ...f, labours: renumber((f.labours || []).filter((_, idx) => idx !== i)) }));

  // Validation
  const validate = () => {
    if (!form.date || !isYMD(form.date)) return "Date is required";
    if (!String(form.name).trim()) return "Customer Name is required";
    if (!String(form.mobileno).trim()) return "Mobile No is required";
    if (!String(form.regno).trim()) return "Reg No is required";
    if (!String(form.vehicleModel).trim()) return "Vehicle Model is required";
    return "";
  };

  // Payload mapping (align with controller/model)
  const toPayload = () => {
    const uiStatus = String(form.jobStatus || "pending").toLowerCase();
    const status = uiStatus === "closed" ? "completed" : uiStatus; // model enum: pending|completed
    const ft = String(form.fuelType || "").toLowerCase();
    return {
      jobcardNo: String(form.jobcardNo || "").trim(), // backend will set this on create if needed
      status,
      date: toDMY(form.date),
      name: String(form.name || "").trim(),
      mobileno: String(form.mobileno || "").trim(),
      regno: String(form.regno || "").trim(),
      address: String(form.address || "").trim(),
      email: String(form.email || "").trim(),
      vehicleModel: String(form.vehicleModel || "").trim(),
      brand: String(form.brand || "").trim(),
      fuelType: ft,
      kilometers: Number(form.kilometer || 0),
      remarks: String(form.remarks || "").trim(),
      advancePaid: Number(form.advancePaid || 0),
      spares: (form.spares || []).map((s, idx) => ({
        sno: idx + 1,
        description: String(s.description || "").trim(),
        quantity: Number(s.quantity || 0),
        amount: Number(s.amount || 0),
        done: !!s.done
      })),
      labours: (form.labours || []).map((l, idx) => ({
        sno: idx + 1,
        description: String(l.description || "").trim(),
        quantity: Number(l.quantity || 0),
        amount: Number(l.amount || 0),
        done: !!l.done
      }))
    };
  };

  const onSave = async () => {
    setSaving(true); setMsg(""); setErr("");
    try {
      const v = validate();
      if (v) { setErr(v); return; }
      const payload = toPayload();
      if (isCreate) {
        // POST /jobcard/create
        const res = await axios.post(`${API}/jobcard/create`, payload);
        const doc = res?.data?.data;
        setMsg("Created");
        if (doc?._id) {
          if (doc.jobcardNo) setForm((f) => ({ ...f, jobcardNo: doc.jobcardNo }));
          navigate(`/jobcard/${doc._id}`, { replace: true });
        }
      } else {
        // PUT /jobcard/update/:id
        await axios.put(`${API}/jobcard/update/${id}`, payload);
        setMsg("Saved");
        // reload to reflect backend-assigned fields
        const check = await axios.get(`${API}/jobcard/list/${id}`);
        const d = check?.data?.data;
        if (d?.jobcardNo) setForm((f) => ({ ...f, jobcardNo: d.jobcardNo }));
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || (isCreate ? "Create failed" : "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isCreate) { navigate("/jobcardhome"); return; }
    if (!window.confirm("Delete this job card?")) return;
    try {
      // DELETE /jobcard/delete/:id
      await axios.delete(`${API}/jobcard/delete/${id}`);
      navigate("/jobcardhome", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const onDownloadPdf = async () => {
    try {
      const { jsPDF } = await ensureJsPdf();
      const doc = new jsPDF("p", "pt", "a4");
      buildJobcardPdf(doc, form, totals, financials);
      const fname = `${form.jobcardNo || "JobCard"}-${form.regno || ""}.pdf`.replace(/\s+/g, "_");
      doc.save(fname);
    } catch {
      alert("PDF download failed");
    }
  };
  const onPrintPdf = async () => {
    try {
      const { jsPDF } = await ensureJsPdf();
      const doc = new jsPDF("p", "pt", "a4");
      buildJobcardPdf(doc, form, totals, financials);
      doc.autoPrint();
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      setTimeout(() => w && w.focus(), 300);
    } catch {
      alert("PDF print failed");
    }
  };

  return (
    <div className="jobcard-page">
      <style>{`
        :root {
          --bg: #ffffff; --panel: #f6f7f9; --text: #0f172a; --muted: #475569; --border: #e5e7eb;
          --brand: #0ea5e9; --btn: #0ea5e9; --btn-contrast: #ffffff; --danger: #ef4444;
          --shadow: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1);
        }
        [data-theme="dark"] {
          --bg: #0b1220; --panel: #0f172a; --text: #e5e7eb; --muted: #94a3b8; --border: #1f2937;
          --brand: #22d3ee; --btn: #22d3ee; --btn-contrast: #0b1220; --danger: #f87171;
          --shadow: 0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5);
        }
        .jobcard-page { min-height: 100vh; background: var(--bg); color: var(--text); padding: 16px 20px 32px; overflow-x: hidden; }
        .topbar { display: grid; grid-template-columns: 1fr auto; align-items: start; margin-bottom: 12px; gap: 12px; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .logo { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: var(--brand); color: var(--btn-contrast); font-weight: 800; letter-spacing: 0.5px; box-shadow: var(--shadow); }
        .company { font-size: 18px; font-weight: 800; }
        .subtitle { font-size: 12px; color: var(--muted); }

        .status-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1px solid var(--border); }
        .badge-amber { background: #fbbf24; color: #1f2937; }
        .badge-green { background: #22c55e; color: #052e16; }
        .badge-gray  { background: #cbd5e1; color: #0f172a; }

        .actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .btn, .btn-ghost, .btn-danger { border: 1px solid transparent; border-radius: 10px; padding: 10px 14px; font-weight: 600; cursor: pointer; transition: 0.15s ease; }
        .btn { background: var(--btn); color: var(--btn-contrast); }
        .btn:hover { filter: brightness(0.95); }
        .btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
        .btn-ghost:hover { background: rgba(148,163,184,0.12); }
        .btn-danger { background: var(--danger); color: #fff; }

        .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 14px; box-shadow: var(--shadow); margin-bottom: 14px; }
        .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
        .row { display: flex; flex-direction: column; gap: 6px; }
        .row label { font-size: 12px; color: var(--muted); }
        .row input, .row select, .row textarea { height: 40px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg); color: var(--text); padding: 0 12px; outline: none; width: 100%; max-width: 100%; }
        .row textarea { height: 90px; padding-top: 10px; }

        .table-wrap { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; box-shadow: var(--shadow); overflow: hidden; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid var(--border); padding: 8px; text-align: left; vertical-align: top; word-wrap: break-word; overflow-wrap: anywhere; }
        tfoot td { font-weight: 700; }

        @media (max-width: 900px) {
          table, thead, tbody, th, td, tr { display: block; }
          thead { display: none; }
          tbody tr { border: 1px solid var(--border); border-radius: 12px; padding: 10px; margin-bottom: 12px; box-shadow: var(--shadow); background: var(--bg); }
          tbody td { border: none; padding: 6px 0; }
        }
      `}</style>

      <div className="topbar">
        <div>
          <div className="brand">
            <div className="logo">JRR</div>
            <div>
              <div className="company">JRR Automobiles</div>
              <div className="subtitle">{isCreate ? "New Job Card" : "Edit Job Card"}</div>
            </div>
          </div>
          <div className="status-row">
            <span className={statusClass}>{String(form.jobStatus || "pending").toUpperCase()}</span>
            <span className="badge" style={{ background: "transparent" }}>Job Card: {form.jobcardNo || "-"}</span>
            <select value={form.jobStatus} onChange={(e) => onField("jobStatus", e.target.value)} className="btn-ghost" style={{ height: 36 }}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div className="actions">
          <button className="btn-ghost" onClick={() => navigate("/jobcardhome")}>← Back</button>
          
          <button className="btn" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          <button className="btn-ghost" type="button" onClick={onDownloadPdf}>Download PDF</button>
          <button className="btn-ghost" type="button" onClick={onPrintPdf}>Print PDF</button>
          <button className="btn-danger" onClick={onDelete}>{isCreate ? "Cancel" : "Delete"}</button>
        </div>
      </div>

      {err && <div className="panel" style={{ color: "#ef4444" }}>{err}</div>}
      {msg && <div className="panel" style={{ color: "#16a34a" }}>{msg}</div>}

      <div className="panel">
        <div className="grid-3">
          <div className="row">
            <label>Grand Total (auto)</label>
            <input value={`₹ ${Number(totals.grand || 0).toLocaleString("en-IN")}`} readOnly />
          </div>
          <div className="row">
            <label>Advance Paid (edit)</label>
            <input type="number" value={form.advancePaid} onChange={(e) => onField("advancePaid", e.target.value)} min={0} />
          </div>
          <div className="row">
            <label>Balance (auto)</label>
            <input value={`₹ ${Number(financials.balance || 0).toLocaleString("en-IN")}`} readOnly />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="grid-3">
          <div className="row">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(e) => onField("date", e.target.value)} />
          </div>
          <div className="row">
            <label>Customer Name</label>
            <input value={form.name} onChange={(e) => onField("name", e.target.value)} placeholder="Customer name" />
          </div>
          <div className="row">
            <label>Mobile No</label>
            <input value={form.mobileno} onChange={(e) => onField("mobileno", e.target.value)} placeholder="98765 43210" />
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 10 }}>
          <div className="row">
            <label>Email</label>
            <input value={form.email} onChange={(e) => onField("email", e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="row">
            <label>Reg No</label>
            <input value={form.regno} onChange={(e) => onField("regno", e.target.value.toUpperCase())} placeholder="TN00AB1234" />
          </div>
          <div className="row">
            <label>Address</label>
            <input value={form.address} onChange={(e) => onField("address", e.target.value)} placeholder="Address" />
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 10 }}>
          <div className="row">
            <label>Vehicle Model</label>
            <input value={form.vehicleModel} onChange={(e) => onField("vehicleModel", e.target.value)} placeholder="Swift" />
          </div>
          <div className="row">
            <label>Brand</label>
            <input value={form.brand} onChange={(e) => onField("brand", e.target.value)} placeholder="Maruti" />
          </div>
          <div className="row">
            <label>Fuel Type</label>
            <select value={form.fuelType} onChange={(e) => onField("fuelType", e.target.value)}>
              <option value="">Select</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="ev">EV</option>
            </select>
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 10 }}>
          <div className="row">
            <label>Kilometers</label>
            <input type="number" value={form.kilometer} onChange={(e) => onField("kilometer", e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <label>Remarks</label>
          <textarea value={form.remarks} onChange={(e) => onField("remarks", e.target.value)} placeholder="Remarks" />
        </div>
      </div>

      {/* Spares */}
      <div className="panel">
        <div className="row">
          <label>Spares</label>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>S.No</th>
                  <th>Description</th>
                  <th style={{ width: 140 }}>Amount (₹)</th>
                  <th style={{ width: 120 }}>Qty</th>
                  <th style={{ width: 160 }}>Row Total (₹)</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renumber(form.spares || []).map((s, i) => {
                  const amt = Number(s.amount || 0);
                  const qty = Number(s.quantity ?? 1);
                  const row = Math.max(0, amt * qty);
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><input value={s.description} onChange={(e) => onSpare(i, "description", e.target.value)} placeholder="Panel" /></td>
                      <td><input type="number" value={s.amount} onChange={(e) => onSpare(i, "amount", e.target.value)} min={0} /></td>
                      <td><input type="number" value={s.quantity} onChange={(e) => onSpare(i, "quantity", e.target.value)} min={0} /></td>
                      <td><input value={`₹ ${row.toLocaleString("en-IN")}`} readOnly /></td>
                      <td><button className="btn-ghost" onClick={() => removeSpare(i)}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td colSpan={5}>₹ {Number(totals.spares || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn-ghost" onClick={addSpareRow}>+ Add Spare</button>
          </div>
        </div>
      </div>

      {/* Labour */}
      <div className="panel">
        <div className="row">
          <label>Labour</label>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>S.No</th>
                  <th>Description</th>
                  <th style={{ width: 140 }}>Amount (₹)</th>
                  <th style={{ width: 120 }}>Qty</th>
                  <th style={{ width: 160 }}>Row Total (₹)</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {renumber(form.labours || []).map((l, i) => {
                  const amt = Number(l.amount || 0);
                  const qty = Number(l.quantity ?? 1);
                  const row = Math.max(0, amt * qty);
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><input value={l.description} onChange={(e) => onLabour(i, "description", e.target.value)} placeholder="Painting" /></td>
                      <td><input type="number" value={l.amount} onChange={(e) => onLabour(i, "amount", e.target.value)} min={0} /></td>
                      <td><input type="number" value={l.quantity} onChange={(e) => onLabour(i, "quantity", e.target.value)} min={0} /></td>
                      <td><input value={`₹ ${row.toLocaleString("en-IN")}`} readOnly /></td>
                      <td><button className="btn-ghost" onClick={() => removeLabour(i)}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td colSpan={5}>₹ {Number(totals.labours || 0).toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="btn-ghost" onClick={addLabourRow}>+ Add Labour</button>
          </div>
        </div>
      </div>
    </div>
  );
}
