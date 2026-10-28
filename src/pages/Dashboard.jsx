import React, { useState, useRef, useEffect } from "react";

import {
  Activity,
  CheckCheck,
  MessageSquare,
  Send,
  RefreshCw,
  CircleAlert,
  Layers,
  FileUp,
  PlusCircle,
  Rocket,
  Cloud,
  X,
} from "lucide-react";

/* ---------------- HELPERS ---------------- */

const TEMPLATES = ["welcome_offer", "order_update", "festival_greeting"];

// CSV parser (quotes, BOM, \r\n sab handle karta hai)
const parseCSV = (text) => {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    cur = "",
    q = false;

  const pushRow = () => {
    row.push(cur);
    cur = "";
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else cur += c;
  }
  pushRow();
  return rows;
};

const normalizePhone = (raw) => {
  let d = (raw || "").replace(/\D/g, "");
  if (d.length === 10) d = "91" + d; // India default
  return d.length >= 11 && d.length <= 15 ? d : null;
};

const processCSV = (text, existing) => {
  const rows = parseCSV(text);
  if (!rows.length) return { valid: [], invalid: 0, duplicates: 0 };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const phoneIdx = header.findIndex((h) =>
    /phone|mobile|number|whatsapp/.test(h)
  );
  const nameIdx = header.findIndex((h) => /name/.test(h));
  const hasHeader = phoneIdx !== -1;
  const pIdx = hasHeader ? phoneIdx : 1;
  const nIdx = hasHeader ? nameIdx : 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const seen = new Set(existing.map((c) => c.phone));
  const valid = [];
  let invalid = 0,
    duplicates = 0;

  dataRows.forEach((r) => {
    const phone = normalizePhone(r[pIdx]);
    if (!phone) return void invalid++;
    if (seen.has(phone)) return void duplicates++;
    seen.add(phone);
    valid.push({
      name: (nIdx >= 0 ? r[nIdx] : "")?.trim() || "—",
      phone,
    });
  });

  return { valid, invalid, duplicates };
};

/* ---------------- COMPONENT ---------------- */

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("7");

  const fileInputRef = useRef(null);
  const [contacts, setContacts] = useState([]);
  const [importPreview, setImportPreview] = useState(null);

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [form, setForm] = useState({ name: "", template: TEMPLATES[0] });
  const [totals, setTotals] = useState({ sent: 0 });
  const [sending, setSending] = useState(null); // { total, done }

  /* ---------- CSV IMPORT ---------- */

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Sirf .csv file select karo");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = processCSV(String(reader.result), contacts);
      setImportPreview({ fileName: file.name, ...result });
    };
    reader.readAsText(file);
    e.target.value = ""; // same file dobara select ho sake
  };

  const confirmImport = () => {
    setContacts((prev) => [...prev, ...importPreview.valid]);
    setImportPreview(null);
  };

  /* ---------- BROADCAST ---------- */

  const startBroadcast = async () => {
    if (!form.name.trim()) return alert("Campaign name daalo");
    const total = contacts.length;
    setShowBroadcast(false);
    setSending({ total, done: 0 });

    // TODO: yahan apni real API call lagao:
    // await fetch("/api/broadcasts", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ ...form, contacts }),
    // });
  };

  // Demo progress (real API aane par hata dena)
  useEffect(() => {
    if (!sending || sending.done >= sending.total) return;
    const t = setTimeout(() => {
      setSending((s) => ({
        ...s,
        done: Math.min(s.total, s.done + Math.ceil(s.total / 20)),
      }));
    }, 300);
    return () => clearTimeout(t);
  }, [sending]);

  useEffect(() => {
    if (sending && sending.done >= sending.total) {
      setTotals((t) => ({ sent: t.sent + sending.total }));
      setSending(null);
      setForm({ name: "", template: TEMPLATES[0] });
    }
  }, [sending]);

  /* ---------- STATS ---------- */

  const stats = [
    {
      title: "MESSAGES SENT",
      value: String(totals.sent),
      icon: Send,
      iconBg: "bg-indigo-100",
      iconColor: "text-emerald-700",
      badge: "↑ 12.4%",
      badgeBg: "bg-green-200",
      badgeColor: "text-green-800",
      description: "vs previous 7 days",
    },
    {
      title: "MESSAGES READ",
      value: "0",
      icon: CheckCheck,
      iconBg: "bg-indigo-100",
      iconColor: "text-blue-700",
      badge: "89.9% read rate",
      badgeBg: "bg-blue-100",
      badgeColor: "text-blue-800",
      description: "Delivered",
    },
    {
      title: "CONVERSATIONS",
      value: "0",
      icon: MessageSquare,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
      badge: "↑ 28.8%",
      badgeBg: "bg-green-200",
      badgeColor: "text-green-800",
      description: "reply rate",
    },
    {
      title: "SENDING NOW",
      value: String(sending ? sending.total - sending.done : 0),
      icon: RefreshCw,
      iconBg: "bg-green-200",
      iconColor: "text-green-800",
      valueColor: "text-green-700",
      badge: "Batch #182",
      badgeBg: "bg-indigo-100",
      badgeColor: "text-indigo-800",
      description: "Active campaign",
    },
    {
      title: "FAILED / BOUNCE",
      value: "0",
      icon: CircleAlert,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      badge: "0.2% fail rate",
      badgeBg: "bg-red-100",
      badgeColor: "text-red-700",
      description: "Opt-out monitored",
    },
    {
      title: "CLOUD QUEUE",
      value: "0",
      icon: Layers,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-700",
      badge: "Flow engine",
      badgeBg: "bg-indigo-100",
      badgeColor: "text-indigo-800",
      description: "Throughput active",
    },
  ];

  const periods = [
    { label: "Last 7 Days", value: "7" },
    { label: "Last 30 Days", value: "30" },
    { label: "Last 90 Days", value: "90" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] p-5 md:p-6">
      {/* TOP SECTION */}
      <section className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        {/* TITLE */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-200 px-2.5 py-1 text-[11px] font-medium text-green-800">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Direct Cloud API v19.0
            </span>

            <span className="font-mono text-[11px] tracking-wide text-slate-500">
              WABA-ID: 948102377481
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-[32px]">
            Campaign Dashboard
          </h1>

          <p className="mt-1 max-w-lg text-sm leading-5 text-slate-600">
            Real-time WhatsApp transmission intelligence,
            <br className="hidden md:block" />
            audience reach, and conversation conversions.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* hidden CSV input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
          />

          {/* DATE FILTER */}
          <div className="flex rounded-xl bg-[#eef0ff] p-1">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`min-w-[65px] rounded-lg px-3 py-2 text-xs font-medium transition ${
                  selectedPeriod === period.value
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-slate-600 hover:bg-white/60"
                }`}
              >
                {period.label.split(" ").slice(0, 1).join(" ")}
                <br />
                <span className="font-semibold">
                  {period.label.split(" ")[1]} {period.label.split(" ")[2]}
                </span>
              </button>
            ))}
          </div>

          {/* IMPORT CONTACTS */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#eef0ff] px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-indigo-100"
          >
            <FileUp size={16} className="text-emerald-700" />
            <span>
              Import
              <br />
              Contacts
            </span>
          </button>

          {/* CREATE TEMPLATE */}
          <button
            onClick={() => alert("Connect your template creation page here.")}
            className="flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-[#e4e8fc] px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-indigo-200"
          >
            <PlusCircle size={16} className="text-emerald-700" />
            <span>
              Create
              <br />
              Template
            </span>
          </button>

          {/* LAUNCH BROADCAST */}
          <button
            onClick={() => setShowBroadcast(true)}
            className="flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-green-800"
          >
            <Rocket size={18} />
            <span>
              Launch
              <br />
              Broadcast
            </span>
          </button>
        </div>
      </section>

      {/* CONNECTION STATUS BAR */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-700 ring-4 ring-green-100" />
            <span className="font-medium text-slate-700">
              Meta Tier 4 Gateway Connected
            </span>
          </div>

          <span className="hidden text-slate-300 sm:inline">•</span>
          <span>Rate Throttling: 80 msgs/sec</span>

          <span className="hidden text-slate-300 sm:inline">•</span>
          <span>Throughput Latency: 142ms</span>

          <span className="hidden text-slate-300 sm:inline">•</span>
          <span>Contacts: {contacts.length}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
          <RefreshCw size={13} />
          <span>Live Sync: Just now (14:32:04 UTC)</span>
        </div>
      </section>

      {/* ANALYTICS CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="group min-w-0 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* CARD HEADER */}
              <div className="flex min-h-[38px] items-start justify-between gap-2">
                <h3 className="max-w-[125px] text-[11px] font-medium leading-[15px] tracking-wide text-slate-600">
                  {stat.title}
                </h3>

                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
              </div>

              {/* VALUE */}
              <div
                className={`mt-4 whitespace-nowrap text-[29px] font-bold leading-none tracking-tight ${
                  stat.valueColor || "text-slate-950"
                }`}
              >
                {stat.value}
              </div>

              {/* FOOTER */}
              <div className="mt-4 flex min-h-[43px] flex-wrap items-start gap-1.5">
                <span
                  className={`inline-block max-w-full rounded px-1.5 py-1 text-[10px] font-semibold leading-3 ${stat.badgeBg} ${stat.badgeColor}`}
                >
                  {stat.badge}
                </span>

                <span className="min-w-0 flex-1 text-[10px] leading-4 text-slate-500">
                  {stat.description}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* BOTTOM INFORMATION */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
            <Activity size={20} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Gateway Performance
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              API connection and message delivery health monitoring.
            </p>
          </div>

          <span className="ml-auto rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-800">
            Healthy
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <Cloud size={20} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Cloud Queue Status
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Monitor queued messages and active broadcast workloads.
            </p>
          </div>

          <span className="ml-auto rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-800">
            Operational
          </span>
        </div>
      </section>

      {/* IMPORT PREVIEW MODAL */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Import Contacts
              </h2>
              <button onClick={() => setImportPreview(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {importPreview.fileName}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-green-100 p-3 text-green-800">
                <div className="text-xl font-bold">
                  {importPreview.valid.length}
                </div>
                Valid
              </div>
              <div className="rounded-lg bg-amber-100 p-3 text-amber-800">
                <div className="text-xl font-bold">
                  {importPreview.duplicates}
                </div>
                Duplicate
              </div>
              <div className="rounded-lg bg-red-100 p-3 text-red-700">
                <div className="text-xl font-bold">
                  {importPreview.invalid}
                </div>
                Invalid
              </div>
            </div>

            {importPreview.valid.length > 0 && (
              <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-slate-100 text-xs">
                {importPreview.valid.slice(0, 5).map((c) => (
                  <div
                    key={c.phone}
                    className="flex justify-between border-b border-slate-50 px-3 py-2"
                  >
                    <span>{c.name}</span>
                    <span className="font-mono text-slate-500">
                      +{c.phone}
                    </span>
                  </div>
                ))}
                {importPreview.valid.length > 5 && (
                  <div className="px-3 py-2 text-slate-400">
                    +{importPreview.valid.length - 5} aur...
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setImportPreview(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={!importPreview.valid.length}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Import {importPreview.valid.length} contacts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LAUNCH BROADCAST MODAL */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Launch Broadcast
              </h2>
              <button onClick={() => setShowBroadcast(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="mt-4 block text-xs font-medium text-slate-600">
              Campaign name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Diwali Offer"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-600"
            />

            <label className="mt-3 block text-xs font-medium text-slate-600">
              Template
            </label>
            <select
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {TEMPLATES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <div className="mt-3 rounded-lg bg-[#eef0ff] p-3 text-xs text-slate-700">
              Audience: <b>{contacts.length}</b> contacts
              {contacts.length === 0 && (
                <span className="text-red-600">
                  {" "}
                  — pehle CSV import karo
                </span>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowBroadcast(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={startBroadcast}
                disabled={contacts.length === 0}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
