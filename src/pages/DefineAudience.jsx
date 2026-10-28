import React, { useMemo, useRef, useState } from "react";

import {
  Users,
  FileSpreadsheet,
  Upload,
  Download,
  Search,
  Filter,
  Columns3,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Send,
  RefreshCw,
  ShieldCheck,
  Settings2,
  Check,
  X,
} from "lucide-react";

const initialContacts = [
  {
    id: 1,
    initials: "SJ",
    name: "Sarah Jenkins",
    company: "VIP Retail - US",
    phone: "+1 415 555 0132",
    email: "sarah.jenkins@example.com",
    country: "United States",
    status: "Valid",
    selected: true,
  },
  {
    id: 2,
    initials: "MC",
    name: "Michael Chen",
    company: "Enterprise",
    phone: "+86 138 0013 8000",
    email: "michael.chen@example.com",
    country: "China",
    status: "Valid",
    selected: true,
  },
  {
    id: 3,
    initials: "DM",
    name: "David Miller",
    company: "Growth Retail",
    phone: "INVALID_PHONE",
    email: "david.miller@example.com",
    country: "United States",
    status: "Invalid",
    selected: false,
  },
  {
    id: 4,
    initials: "ER",
    name: "Elena Rodriguez",
    company: "Enterprise",
    phone: "+34 612 345 678",
    email: "elena.rodriguez@example.com",
    country: "Spain",
    status: "Duplicate",
    selected: false,
  },
  {
    id: 5,
    initials: "PP",
    name: "Priya Patel",
    company: "VIP Retail - India",
    phone: "+91 98765 43210",
    email: "priya.patel@example.com",
    country: "India",
    status: "Valid",
    selected: true,
  },
  {
    id: 6,
    initials: "JW",
    name: "James Wilson",
    company: "Retail",
    phone: "+44 7700 900123",
    email: "james.wilson@example.com",
    country: "United Kingdom",
    status: "Valid",
    selected: false,
  },
  {
    id: 7,
    initials: "AK",
    name: "Aarav Kumar",
    company: "Growth Retail",
    phone: "+91 98765 12345",
    email: "aarav.kumar@example.com",
    country: "India",
    status: "Valid",
    selected: false,
  },
];

const statusStyles = {
  Valid: "bg-emerald-100 text-emerald-700",
  Invalid: "bg-rose-100 text-rose-700",
  Duplicate: "bg-amber-100 text-amber-700",
};

export default function DefineAudience() {
  const [contacts, setContacts] = useState(initialContacts);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All");

  const [fileName, setFileName] = useState("vip_customers_q4_contacts.csv");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [showColumns, setShowColumns] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [notification, setNotification] = useState("");

  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    phone: true,
    email: true,
    country: true,
    status: true,
  });

  const fileInputRef = useRef(null);
  const importModeRef = useRef("append"); // "append" ya "replace"
  const notificationTimer = useRef(null);

  const showMessage = (message) => {
    setNotification(message);
    clearTimeout(notificationTimer.current);
    notificationTimer.current = setTimeout(() => setNotification(""), 3000);
  };

  const openFilePicker = (mode = "append") => {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const filteredContacts = useMemo(() => {
    const query = search.toLowerCase();

    return contacts.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || contact.status === statusFilter;

      const matchesCountry =
        countryFilter === "All" || contact.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [contacts, search, statusFilter, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedContacts = filteredContacts.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const selectedCount = contacts.filter(
    (contact) => contact.selected && contact.status === "Valid"
  ).length;

  const validCount = contacts.filter((c) => c.status === "Valid").length;
  const invalidCount = contacts.filter((c) => c.status === "Invalid").length;
  const duplicateCount = contacts.filter((c) => c.status === "Duplicate").length;

  const allVisibleSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((contact) => contact.selected);

  const toggleContact = (id) => {
    setContacts((current) =>
      current.map((contact) =>
        contact.id === id
          ? { ...contact, selected: !contact.selected }
          : contact
      )
    );
  };

  const toggleAllVisible = () => {
    const visibleIds = paginatedContacts.map((contact) => contact.id);

    setContacts((current) =>
      current.map((contact) =>
        visibleIds.includes(contact.id)
          ? { ...contact, selected: !allVisibleSelected }
          : contact
      )
    );
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    const mode = importModeRef.current;

    // reset karo taaki same file dobara upload ho sake
    event.target.value = "";

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showMessage("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (loadEvent) => {
      try {
        // BOM hata do (Excel / hamare export wali file mein hota hai)
        const text = String(loadEvent.target?.result || "").replace(
          /^\uFEFF/,
          ""
        );
        const rows = parseCSV(text);

        if (rows.length < 2) {
          showMessage("The CSV file has no contact rows.");
          return;
        }

        const normalize = (header) =>
          header
            .replace(/^\uFEFF/, "")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

        const headers = rows[0].map(normalize);
        const find = (names) => headers.findIndex((h) => names.includes(h));

        const nameIndex = find([
          "name",
          "full_name",
          "contact_name",
          "customer_name",
        ]);
        const firstIndex = find(["first_name", "firstname"]);
        const lastIndex = find(["last_name", "lastname"]);
        const phoneIndex = find([
          "phone",
          "phone_number",
          "mobile",
          "mobile_number",
          "whatsapp",
          "whatsapp_number",
          "contact_number",
          "number",
        ]);
        const emailIndex = find(["email", "email_address"]);
        const companyIndex = find(["company", "organization", "segment"]);
        const countryIndex = find(["country", "country_name"]);

        if (phoneIndex === -1 || (nameIndex === -1 && firstIndex === -1)) {
          showMessage("CSV needs at least name and phone columns.");
          return;
        }

        const baseContacts = mode === "replace" ? [] : contacts;

        const seen = new Set(
          baseContacts.map((c) => c.phone.replace(/\D/g, "")).filter(Boolean)
        );

        const importedContacts = rows
          .slice(1)
          .filter((row) => row.some((value) => value.trim() !== ""))
          .map((row, index) => {
            const name =
              nameIndex >= 0
                ? row[nameIndex]?.trim()
                : `${row[firstIndex] || ""} ${
                    lastIndex >= 0 ? row[lastIndex] || "" : ""
                  }`.trim();

            const finalName = name || "Unknown Contact";
            const phone = row[phoneIndex]?.trim() || "";
            const digits = phone.replace(/\D/g, "");

            const validPhone =
              /^\+?[\d\s()-]{7,20}$/.test(phone) && digits.length >= 7;

            let status = "Invalid";

            if (validPhone) {
              if (seen.has(digits)) {
                status = "Duplicate";
              } else {
                status = "Valid";
                seen.add(digits);
              }
            }

            return {
              id: Date.now() + index,
              initials: finalName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0] || "")
                .join("")
                .toUpperCase(),
              name: finalName,
              company:
                (companyIndex >= 0 && row[companyIndex]?.trim()) || "Imported",
              phone,
              email: (emailIndex >= 0 && row[emailIndex]?.trim()) || "—",
              country:
                (countryIndex >= 0 && row[countryIndex]?.trim()) || "Unknown",
              status,
              selected: status === "Valid",
            };
          });

        if (!importedContacts.length) {
          showMessage("No contacts found in the CSV.");
          return;
        }

        setFileName(file.name);

        setContacts(
          mode === "replace"
            ? importedContacts
            : [...importedContacts, ...contacts] // naye contacts sabse upar
        );

        // filters clear karo taaki naye contacts turant dikhein
        setSearch("");
        setStatusFilter("All");
        setCountryFilter("All");
        setCurrentPage(1);

        showMessage(`${importedContacts.length} contacts imported successfully.`);
      } catch {
        showMessage("Unable to read the CSV file.");
      }
    };

    reader.readAsText(file);
  };

  const downloadCSV = () => {
    const headers = ["name", "company", "phone", "email", "country", "status"];

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      headers.join(","),
      ...filteredContacts.map((contact) =>
        headers.map((header) => escapeCSV(contact[header])).join(",")
      ),
    ];

    const blob = new Blob(["\uFEFF" + rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "reachpulse_contacts.csv";
    link.click();

    URL.revokeObjectURL(url);

    showMessage("CSV exported successfully.");
  };

  const downloadSampleCSV = () => {
    const sample =
      "name,phone,email,company,country\n" +
      "Rahul Sharma,+91 98765 11111,rahul@example.com,Retail,India\n" +
      "Anita Verma,+91 98765 22222,anita@example.com,Enterprise,India\n";

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sample_contacts.csv";
    link.click();

    URL.revokeObjectURL(url);

    showMessage("Sample CSV downloaded.");
  };

  const deleteSelected = () => {
    const count = contacts.filter((contact) => contact.selected).length;

    if (!count) {
      showMessage("Please select contacts first.");
      return;
    }

    setContacts((current) => current.filter((contact) => !contact.selected));
    setCurrentPage(1);

    showMessage(`${count} contacts removed from this list.`);
  };

  const publishAudience = () => {
    if (!selectedCount) {
      showMessage("Select at least one valid contact.");
      return;
    }

    showMessage(
      `${selectedCount} contacts ready. Connect your backend to publish this audience.`
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] px-4 pb-24 pt-5 text-slate-800 sm:px-6 lg:px-7">
      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
            <span>Campaigns</span>
            <span>/</span>
            <span>People</span>
            <span>/</span>
            <span className="text-emerald-700">Define Audience</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Define Audience
            </h1>

            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              CONTACTS & CSV
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Import, organize, and validate contacts via CSV for
            high-deliverability WhatsApp campaigns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold shadow-sm hover:bg-slate-50"
          >
            <Download size={14} />
            Download Sample CSV
          </button>

          <button
            onClick={() => openFilePicker("append")}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Upload size={14} />
            Import CSV
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => showMessage("Settings panel coming soon.")}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            title="Audience settings"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>

      {/* STATISTICS CARDS */}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        <StatCard
          title="TOTAL LEADS"
          value={contacts.length.toLocaleString()}
          description="contacts in current list"
          icon={Users}
          color="slate"
        />

        <StatCard
          title="VALID & READY"
          value={validCount.toLocaleString()}
          description="Ready for broadcast"
          icon={CheckCircle2}
          color="green"
        />

        <StatCard
          title="INVALID NUMBERS"
          value={invalidCount.toLocaleString()}
          description="Missing or invalid phone"
          icon={XCircle}
          color="red"
        />

        <StatCard
          title="DUPLICATES"
          value={duplicateCount.toLocaleString()}
          description="Repeated contact records"
          icon={AlertCircle}
          color="blue"
        />
      </div>

      {/* CSV FILE CARD */}

      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <FileSpreadsheet size={23} />
            </div>

            <div className="min-w-0">
              <h2 className="break-all text-sm font-bold">{fileName}</h2>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span>CSV File</span>
                <span>•</span>
                <span>{contacts.length} contacts</span>
                <span>•</span>
                <span>UTF-8 encoded</span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Upload a CSV file and review its contacts before using them in
                an audience.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => openFilePicker("replace")}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
            >
              <RefreshCw size={13} />
              Replace File
            </button>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
            >
              <Download size={13} />
              Export CSV
            </button>

            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <Trash2 size={13} />
              Remove Selected
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-2">
            <Tag color="green">
              <Check size={11} />
              {validCount} Valid Rows
            </Tag>

            <Tag color="blue">{duplicateCount} Duplicates</Tag>

            <Tag color="red">{invalidCount} Invalid Rows</Tag>
          </div>

          <span className="text-[10px] text-slate-400">
            Local demo · CSV processing
          </span>
        </div>
      </section>

      {/* CONTACT TABLE */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE TOOLBAR */}

        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="text-sm font-bold">Audience Contacts</h2>

            <p className="mt-1 text-[11px] text-slate-400">
              Review, filter, and select contacts for your audience.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1 sm:flex-none">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search phone or name..."
                className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 sm:w-52"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium ${
                showFilters
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Filter size={13} />
              Filters
              <ChevronDown size={12} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowColumns(!showColumns)}
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium hover:bg-slate-50"
              >
                <Columns3 size={14} />
                Columns
              </button>

              {showColumns && (
                <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                  <p className="mb-2 text-xs font-bold">Visible Columns</p>

                  {Object.entries(visibleColumns).map(([key, visible]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs capitalize hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() =>
                          setVisibleColumns((current) => ({
                            ...current,
                            [key]: !current[key],
                          }))
                        }
                        className="accent-emerald-600"
                      />

                      {key}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}

        {showFilters && (
          <div className="flex flex-wrap gap-4 border-b border-slate-100 bg-slate-50/70 p-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Contact Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Valid">Valid</option>
                <option value="Invalid">Invalid</option>
                <option value="Duplicate">Duplicate</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Country
              </label>

              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
              >
                <option value="All">All Countries</option>
                {[...new Set(contacts.map((c) => c.country))].map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setStatusFilter("All");
                setCountryFilter("All");
                setSearch("");
                setCurrentPage(1);
              }}
              className="self-end rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="accent-emerald-600"
                  />
                </th>

                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Contact Profile
                </th>

                {visibleColumns.phone && (
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Phone Number
                  </th>
                )}

                {visibleColumns.email && (
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Email Address
                  </th>
                )}

                {visibleColumns.country && (
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Country
                  </th>
                )}

                {visibleColumns.status && (
                  <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Validation Status
                  </th>
                )}

                <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Quick Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paginatedContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`border-b border-slate-100 transition hover:bg-slate-50/70 ${
                    contact.selected ? "bg-emerald-50/20" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={contact.selected}
                      onChange={() => toggleContact(contact.id)}
                      className="accent-emerald-600"
                    />
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
                        {contact.initials}
                      </div>

                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-xs font-semibold text-slate-800">
                          {contact.name}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                          {contact.company}
                        </p>
                      </div>
                    </div>
                  </td>

                  {visibleColumns.phone && (
                    <td className="px-3 py-3">
                      <span
                        className={`whitespace-nowrap text-[11px] ${
                          contact.status === "Invalid"
                            ? "font-semibold text-rose-600"
                            : "text-slate-600"
                        }`}
                      >
                        {contact.phone}
                      </span>
                    </td>
                  )}

                  {visibleColumns.email && (
                    <td className="px-3 py-3">
                      <span className="whitespace-nowrap text-[11px] text-slate-500">
                        {contact.email}
                      </span>
                    </td>
                  )}

                  {visibleColumns.country && (
                    <td className="px-3 py-3">
                      <span className="whitespace-nowrap text-[11px] text-slate-500">
                        {contact.country}
                      </span>
                    </td>
                  )}

                  {visibleColumns.status && (
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          statusStyles[contact.status]
                        }`}
                      >
                        {contact.status === "Valid" ? (
                          <CheckCircle2 size={11} />
                        ) : contact.status === "Invalid" ? (
                          <XCircle size={11} />
                        ) : (
                          <AlertCircle size={11} />
                        )}

                        {contact.status}
                      </span>
                    </td>
                  )}

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {contact.status === "Invalid" && (
                        <button
                          onClick={() =>
                            showMessage(
                              `Review the phone number for ${contact.name}.`
                            )
                          }
                          className="rounded-md bg-rose-50 px-2 py-1.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-100"
                        >
                          Fix
                        </button>
                      )}

                      <button
                        onClick={() =>
                          showMessage(`Contact: ${contact.name} · ${contact.phone}`)
                        }
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`More actions for ${contact.name}`}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedContacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users size={26} className="mx-auto mb-3 text-slate-300" />

                    <p className="text-sm font-semibold text-slate-700">
                      No contacts found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center">
          <p className="text-[11px] text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {filteredContacts.length ? (safePage - 1) * pageSize + 1 : 0}–
              {Math.min(safePage * pageSize, filteredContacts.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {filteredContacts.length}
            </span>{" "}
            contacts
            <span className="mx-2 text-slate-300">|</span>
            <span className="font-semibold text-emerald-700">
              {selectedCount} valid selected
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px]"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <button
              disabled={safePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>

            <span className="text-[11px] text-slate-500">
              Page {safePage} of {totalPages}
            </span>

            <button
              disabled={safePage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* WHATSAPP API STATUS */}

      <section className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
            <ShieldCheck size={21} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                WhatsApp Cloud API Pre-Delivery Guarantee
              </h3>

              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                VALIDATION CHECK
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-600">
              Review number formatting, duplicates, and contact quality before
              sending a campaign. Phone validation alone cannot guarantee
              WhatsApp delivery.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-emerald-500 text-[10px] font-bold text-emerald-700">
            {contacts.length
              ? Math.round((validCount / contacts.length) * 100)
              : 0}
            %
          </div>

          <div>
            <p className="text-xs font-bold">Data Quality</p>

            <p className="mt-1 text-[10px] text-slate-400">Valid number ratio</p>
          </div>
        </div>
      </section>

      {/* FIXED BOTTOM ACTION BAR */}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:left-[220px] sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              setContacts(initialContacts);
              setFileName("vip_customers_q4_contacts.csv");
              setSearch("");
              setStatusFilter("All");
              setCountryFilter("All");
              setCurrentPage(1);
              showMessage("Demo audience reset.");
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <X size={13} />
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={deleteSelected}
              className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
            >
              <Trash2 size={13} />
              Remove Selected
            </button>

            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={13} />
              Export Audience
            </button>

            <button
              onClick={publishAudience}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800"
            >
              <Send size={13} />
              Publish Audience ({selectedCount})
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATION */}

      {notification && (
        <div className="fixed right-5 top-20 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-xl">
          <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-700">
            <CheckCircle2 size={16} />
          </div>

          <p className="flex-1 text-xs leading-5 text-slate-700">
            {notification}
          </p>

          <button
            onClick={() => setNotification("")}
            className="text-slate-400 hover:text-slate-700"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/* STATISTICS CARD */

function StatCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    slate: {
      icon: "bg-slate-100 text-slate-600",
      circle: "bg-slate-100",
    },
    green: {
      icon: "bg-emerald-100 text-emerald-700",
      circle: "bg-emerald-100",
    },
    red: {
      icon: "bg-rose-100 text-rose-600",
      circle: "bg-rose-100",
    },
    blue: {
      icon: "bg-blue-100 text-blue-600",
      circle: "bg-blue-100",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h3>

          <p className="mt-1.5 text-[10px] text-slate-500">{description}</p>
        </div>

        <div className={`rounded-lg p-2 ${colors[color].icon}`}>
          <Icon size={17} />
        </div>
      </div>

      <div
        className={`absolute -bottom-8 -right-5 h-16 w-16 rounded-full opacity-70 ${colors[color].circle}`}
      />
    </div>
  );
}

/* SMALL BADGES */

function Tag({ children, color = "green" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold ${styles[color]}`}
    >
      {children}
    </span>
  );
}

/* CSV PARSER */

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i++;

      row.push(field);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);

  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}
