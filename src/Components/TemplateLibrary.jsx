import { useEffect, useState } from "react";
import {
  Image,
  FileText,
  Video,
  Link,
  Phone,
  Copy,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  MessageCircle,
  UploadCloud,
} from "lucide-react";

/* ================= MEDIA STORAGE (IndexedDB) =================
   Same DB / store name jo "Your Templates" page use karta hai,
   taaki yahan upload ki hui file wahan bhi dikhe.
=============================================================== */

const DB_NAME = "reachpulse_media";
const STORE = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putBlob(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ================= MEDIA HELPERS ================= */

const MEDIA_RULES = {
  Image: {
    kind: "image",
    accept: "image/jpeg,image/png,image/webp",
    maxMB: 5,
    hint: "JPG, PNG, WEBP (max 5 MB)",
  },
  Video: {
    kind: "video",
    accept: "video/mp4,video/3gpp",
    maxMB: 16,
    hint: "MP4, 3GP (max 16 MB)",
  },
  Document: {
    kind: "document",
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
    maxMB: 100,
    hint: "PDF, DOC, XLS, PPT, TXT, CSV (max 100 MB)",
  },
};

const DOC_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
];

const getExt = (name = "") =>
  name.includes(".") ? name.split(".").pop().toLowerCase() : "";

const formatSize = (bytes) => {
  if (!bytes) return "";
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

function validateFile(headerType, file) {
  const rule = MEDIA_RULES[headerType];
  const ext = getExt(file.name);

  const typeOk =
    headerType === "Image"
      ? file.type.startsWith("image/")
      : headerType === "Video"
        ? file.type.startsWith("video/")
        : DOC_EXTENSIONS.includes(ext);

  if (!typeOk) return `Galat file type. Allowed: ${rule.hint}`;

  if (file.size > rule.maxMB * 1024 * 1024) {
    return `File bahut badi hai. ${headerType} ka max size ${rule.maxMB} MB hai.`;
  }

  return "";
}

/* ================= PAGE ================= */

export default function TemplateLibrary() {
  const [templateName, setTemplateName] = useState("diwali_festival_offer");

  const [category, setCategory] = useState("Marketing");
  const [language, setLanguage] = useState("English");

  const [headerType, setHeaderType] = useState("Image");

  const [headerText, setHeaderText] = useState("Festival Special Offer");

  // Uploaded media (image / video / document)
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");

  const [message, setMessage] = useState(
    "Hello {{1}}, celebrate this festive season with an exclusive 20% discount on all premium items! Use your personalized code {{2}} at checkout before {{3}}."
  );

  const [buttons, setButtons] = useState([
    {
      id: 1,
      type: "Website URL",
      text: "Shop Collection",
      value: "https://example.com",
    },
    {
      id: 2,
      type: "Call Phone Number",
      text: "Call Customer Care",
      value: "+911234567890",
    },
    {
      id: 3,
      type: "Copy Offer Code",
      text: "Copy FESTIVE20",
      value: "FESTIVE20",
    },
  ]);

  const [showPreview, setShowPreview] = useState(true);
  const [notification, setNotification] = useState("");

  // File select hote hi preview ke liye object URL banao
  useEffect(() => {
    if (!mediaFile) {
      setMediaUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(mediaFile);
    setMediaUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  const changeHeaderType = (label) => {
    setHeaderType(label);
    // Type badalne par purani file hata do (image -> video etc.)
    setMediaFile(null);
  };

  const handleFilePick = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = ""; // same file dobara select ho sake

    if (!picked) return;

    const error = validateFile(headerType, picked);

    if (error) {
      setNotification(error);
      window.setTimeout(() => setNotification(""), 4000);
      return;
    }

    setMediaFile(picked);
  };

  const updateButton = (id, field, value) => {
    setButtons((current) =>
      current.map((button) =>
        button.id === id ? { ...button, [field]: value } : button
      )
    );
  };

  const addButton = () => {
    if (buttons.length >= 10) {
      setNotification("Maximum 10 buttons allowed in this demo.");
      return;
    }

    setButtons((current) => [
      ...current,
      {
        id: Date.now(),
        type: "Website URL",
        text: "Visit Website",
        value: "https://example.com",
      },
    ]);
  };

  const removeButton = (id) => {
    setButtons((current) => current.filter((button) => button.id !== id));
  };

  const hasMediaHeader = ["Image", "Video", "Document"].includes(headerType);

  const saveTemplate = async (status) => {
    const cleanName = templateName.trim();

    if (!cleanName) {
      setNotification("Please enter a template name before saving.");
      return;
    }

    if (!message.trim()) {
      setNotification("Please enter a message body before saving.");
      return;
    }

    // Media ko IndexedDB me save karo (Your Templates page yahin se padhega)
    let media = null;

    if (hasMediaHeader && mediaFile) {
      const mediaId = `m_${Date.now()}`;

      try {
        await putBlob(mediaId, mediaFile);
      } catch (error) {
        console.warn("Media IndexedDB me save nahi hui:", error);
      }

      media = {
        kind: MEDIA_RULES[headerType].kind,
        source: "file",
        mediaId,
        name: mediaFile.name,
        size: mediaFile.size,
        mime: mediaFile.type,
      };
    }

    const now = new Date().toLocaleDateString();
    const template = {
      id: `template-${cleanName}`,
      name: cleanName,
      category,
      language,
      status: status === "pending" ? "Pending" : "Draft",
      header: headerType === "None" ? "" : headerText,
      image: "",
      media,
      body: message.trim(),
      footer: "",
      buttons: buttons.map((button) => button.text).filter(Boolean),
      buttonDetails: buttons,
      headerType,
      headerText,
      broadcasts: "0",
      delivery: "—",
      health: "Not rated",
      created: now,
      modified: now,
    };

    try {
      const stored = JSON.parse(
        localStorage.getItem("reachpulse_templates") || "[]"
      );
      const current = Array.isArray(stored) ? stored : [];
      const updated = [
        template,
        ...current.filter((item) => item.name !== cleanName),
      ];

      // This is the shared storage key read by the Your Templates page.
      localStorage.setItem("reachpulse_templates", JSON.stringify(updated));
      localStorage.setItem("your_templates", JSON.stringify(updated));

      setNotification(
        status === "pending"
          ? "Template saved as Pending. Meta approval requires a configured WhatsApp API."
          : status === "draft"
            ? "Draft saved. You can find it in Your Templates."
            : "Template saved. You can find it in Your Templates."
      );
    } catch (error) {
      console.error("Template save failed:", error);
      setNotification(
        "Could not save template in this browser. Please try again."
      );
    }

    window.setTimeout(() => setNotification(""), 4000);
  };

  // Ek hi payload preview aur copy dono ke liye
  const buildPayload = () => {
    let headerComponent = null;

    if (headerType === "Text") {
      headerComponent = { type: "HEADER", format: "TEXT", text: headerText };
    } else if (hasMediaHeader) {
      headerComponent = {
        type: "HEADER",
        format: headerType.toUpperCase(),
        example: { header_handle: [mediaFile?.name || "sample_media"] },
      };
    }

    return {
      name: templateName,
      category,
      language: language.toLowerCase(),
      components: [
        ...(headerComponent ? [headerComponent] : []),
        {
          type: "BODY",
          text: message,
        },
        ...(buttons.length
          ? [
              {
                type: "BUTTONS",
                buttons: buttons.map((button) => ({
                  type:
                    button.type === "Website URL"
                      ? "URL"
                      : button.type === "Call Phone Number"
                        ? "PHONE_NUMBER"
                        : "QUICK_REPLY",
                  text: button.text,
                  ...(button.type === "Website URL"
                    ? { url: button.value }
                    : {}),
                  ...(button.type === "Call Phone Number"
                    ? { phone_number: button.value }
                    : {}),
                })),
              },
            ]
          : []),
      ],
    };
  };

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(buildPayload(), null, 2)
      );

      setNotification("Payload copied to clipboard!");
    } catch {
      setNotification(
        "Clipboard unavailable. You can inspect the payload in the preview."
      );
    }

    setTimeout(() => setNotification(""), 3500);
  };

  const previewMessage = message
    .replaceAll("{{1}}", "Rahul")
    .replaceAll("{{2}}", "FESTIVE20")
    .replaceAll("{{3}}", "20 October");

  const rule = MEDIA_RULES[headerType];

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      {/* Page Header */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 text-xs text-slate-400">
            Templates / Template Library / Create
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Template Library & Creator
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Design, validate, and prepare Meta-compliant interactive WhatsApp
            Business API messages.
          </p>
        </div>

        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          <Eye size={16} />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      {/* Main Layout */}

      <div
        className={`grid grid-cols-1 items-start gap-5 ${
          showPreview ? "xl:grid-cols-[minmax(0,1fr)_350px]" : "xl:grid-cols-1"
        }`}
      >
        {/* LEFT: Template Editor */}

        <div className="min-w-0 space-y-4">
          {/* Approval Information */}

          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <MessageCircle size={19} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Meta-Approved Template Workflow
              </h3>

              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Create your template, configure message variables, and prepare
                it for submission through the WhatsApp Business Platform API.
              </p>
            </div>
          </div>

          {/* Section 1: Metadata */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle number="1" title="Meta Metadata & Routing" />

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold">
                Template Name
              </label>

              <input
                value={templateName}
                onChange={(e) =>
                  setTemplateName(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Enter template name"
              />

              <p className="mt-1.5 text-[11px] text-slate-400">
                Use lowercase letters, numbers and underscores.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option>Marketing</option>
                  <option>Utility</option>
                  <option>Authentication</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold">
                  Primary Language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Header */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle number="2" title="Header Section" />

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "None", icon: FileText },
                { label: "Text", icon: FileText },
                { label: "Image", icon: Image },
                { label: "Video", icon: Video },
                { label: "Document", icon: FileText },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => changeHeaderType(label)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    headerType === label
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {headerType !== "None" && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold">
                  {headerType === "Text" ? "Header Text" : "Header Caption"}
                </label>

                <input
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Enter header text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                />

                {hasMediaHeader && (
                  <div className="mt-3">
                    {mediaFile ? (
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-emerald-700 shadow-sm">
                          {headerType === "Image" ? (
                            <Image size={19} />
                          ) : headerType === "Video" ? (
                            <Video size={19} />
                          ) : (
                            <FileText size={19} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {mediaFile.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {formatSize(mediaFile.size)} • Preview me dikh raha
                            hai
                          </p>
                        </div>

                        <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                          Change
                          <input
                            type="file"
                            accept={rule.accept}
                            className="hidden"
                            onChange={handleFilePick}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setMediaFile(null)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="Remove file"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 hover:border-emerald-400">
                        <UploadCloud size={21} className="text-emerald-600" />

                        <div>
                          <p className="text-xs font-semibold">
                            Choose {headerType.toLowerCase()} file
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {rule.hint}
                          </p>
                        </div>

                        <input
                          type="file"
                          accept={rule.accept}
                          className="hidden"
                          onChange={handleFilePick}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Section 3: Message Body */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle number="3" title="Message Body" />

              <span className="text-[11px] text-slate-400">
                {message.length} characters
              </span>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="mt-4 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              placeholder="Write your WhatsApp message here..."
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] text-slate-400">
                Insert variable:
              </span>

              {[1, 2, 3].map((variable) => (
                <button
                  key={variable}
                  onClick={() =>
                    setMessage((current) => current + ` {{${variable}}}`)
                  }
                  className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[11px] font-medium text-emerald-700"
                >
                  + {"{{"}
                  {variable}
                  {"}}"}
                </button>
              ))}
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              Variables allow you to personalize messages using customer
              information. Ensure that each variable has a valid sample value
              before submitting to Meta.
            </p>
          </section>

          {/* Section 4: Interactive Buttons */}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle number="4" title="Interactive Buttons" />

              <button
                onClick={addButton}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <Plus size={14} />
                Add Button
              </button>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Add website links, click-to-call buttons, or quick replies.
            </p>

            <div className="mt-4 space-y-3">
              {buttons.map((button, index) => (
                <div
                  key={button.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                        {button.type === "Website URL" ? (
                          <Link size={15} />
                        ) : button.type === "Call Phone Number" ? (
                          <Phone size={15} />
                        ) : (
                          <Copy size={15} />
                        )}
                      </div>

                      <span className="text-xs font-semibold">
                        Button {index + 1}
                      </span>
                    </div>

                    <button
                      onClick={() => removeButton(button.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
                        Button Type
                      </label>

                      <select
                        value={button.type}
                        onChange={(e) =>
                          updateButton(button.id, "type", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      >
                        <option>Website URL</option>
                        <option>Call Phone Number</option>
                        <option>Quick Reply</option>
                        <option>Copy Offer Code</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
                        Button Text
                      </label>

                      <input
                        value={button.text}
                        onChange={(e) =>
                          updateButton(button.id, "text", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
                        {button.type === "Website URL"
                          ? "Website URL"
                          : button.type === "Call Phone Number"
                            ? "Phone Number"
                            : "Reply or Coupon Value"}
                      </label>

                      <input
                        value={button.value}
                        onChange={(e) =>
                          updateButton(button.id, "value", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {buttons.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                  No buttons added yet.
                </div>
              )}
            </div>
          </section>

          {/* Meta Compliance Notice */}

          <section className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                <MessageCircle size={16} />
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  Meta Pre-Screen Quality Guidelines
                </h3>

                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Review your message content, variables, category, and button
                  configuration before submitting. Final approval is determined
                  by Meta.
                </p>
              </div>
            </div>
          </section>

          {/* Footer Actions */}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <button
              onClick={() => {
                setTemplateName("diwali_festival_offer");
                setCategory("Marketing");
                setLanguage("English");
                setHeaderType("Image");
                setHeaderText("Festival Special Offer");
                setMediaFile(null);
                setMessage(
                  "Hello {{1}}, celebrate this festive season with an exclusive 20% discount on all premium items! Use your personalized code {{2}} at checkout before {{3}}."
                );
                setButtons([]);
                setNotification("");
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Reset
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => saveTemplate("draft")}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold hover:bg-slate-50"
              >
                <Save size={14} />
                Save Draft
              </button>

              <button
                onClick={() => saveTemplate("saved")}
                className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Save size={14} />
                Save Template
              </button>

              <button
                onClick={() => saveTemplate("pending")}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Send size={14} />
                Save & Submit Template
              </button>
            </div>
          </div>

          {notification && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              {notification}
            </div>
          )}
        </div>

        {/* RIGHT: Live Preview */}

        {showPreview && (
          <div className="space-y-4 xl:sticky xl:top-5">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">Live WhatsApp Preview</h2>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Example recipient view
                  </p>
                </div>

                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                  Live
                </span>
              </div>

              {/* Phone */}

              <div className="mx-auto max-w-[290px] overflow-hidden rounded-[28px] border-[5px] border-slate-800 bg-[#efeae2] shadow-xl">
                <div className="flex items-center gap-2 bg-[#075e54] p-3 text-white">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <MessageCircle size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">ReachPulse Business</p>

                    <p className="mt-0.5 text-[10px] text-emerald-100">
                      Business account
                    </p>
                  </div>

                  <Video size={17} />
                </div>

                <div
                  className="min-h-[330px] space-y-3 bg-[#efeae2] p-3"
                  style={{
                    backgroundImage:
                      "radial-gradient(#d7d0c5 0.7px, transparent 0.7px)",
                    backgroundSize: "12px 12px",
                  }}
                >
                  <div className="mx-auto w-fit rounded-md bg-[#e1dace] px-3 py-1 text-[9px] text-slate-500">
                    TODAY
                  </div>

                  <div className="rounded-lg rounded-tl-none bg-white p-3 shadow-sm">
                    {/* IMAGE */}
                    {headerType === "Image" &&
                      (mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt={headerText || "Selected header"}
                          className="mb-3 max-h-48 w-full rounded-md bg-slate-100 object-cover"
                        />
                      ) : (
                        <div className="mb-3 grid h-28 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-orange-100 to-amber-200">
                          <div className="text-center">
                            <Image
                              size={26}
                              className="mx-auto text-orange-600"
                            />
                            <p className="mt-2 text-[10px] font-semibold text-orange-800">
                              {headerText}
                            </p>
                            <p className="mt-1 text-[9px] text-orange-700">
                              Image select karo
                            </p>
                          </div>
                        </div>
                      ))}

                    {/* TEXT */}
                    {headerType === "Text" && (
                      <p className="mb-2 text-xs font-bold text-slate-800">
                        {headerText}
                      </p>
                    )}

                    {/* VIDEO */}
                    {headerType === "Video" &&
                      (mediaUrl ? (
                        <video
                          src={mediaUrl}
                          controls
                          preload="metadata"
                          className="mb-3 max-h-48 w-full rounded-md bg-black object-contain"
                        />
                      ) : (
                        <div className="mb-3 grid h-24 place-items-center rounded-md bg-slate-200 text-slate-500">
                          <div className="text-center">
                            <Video size={26} className="mx-auto" />
                            <p className="mt-1 text-[9px]">Video select karo</p>
                          </div>
                        </div>
                      ))}

                    {/* DOCUMENT */}
                    {headerType === "Document" && (
                      <a
                        href={mediaUrl || undefined}
                        target="_blank"
                        rel="noreferrer"
                        download={mediaFile?.name}
                        className="mb-3 flex items-center gap-2 rounded-md bg-slate-100 p-3"
                      >
                        <FileText
                          size={22}
                          className="shrink-0 text-emerald-700"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="break-all text-[10px] font-semibold text-slate-800">
                            {mediaFile?.name || "Document select karo"}
                          </p>

                          {mediaFile && (
                            <p className="text-[9px] text-slate-500">
                              {getExt(mediaFile.name).toUpperCase()} •{" "}
                              {formatSize(mediaFile.size)}
                            </p>
                          )}
                        </div>
                      </a>
                    )}

                    {/* Media ke saath caption */}
                    {hasMediaHeader && headerText && (
                      <p className="mb-2 text-xs font-bold text-slate-800">
                        {headerText}
                      </p>
                    )}

                    <p className="whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-700">
                      {previewMessage}
                    </p>

                    <p className="mt-2 text-right text-[9px] text-slate-400">
                      10:42 AM ✓✓
                    </p>

                    {buttons.map((button) => (
                      <div
                        key={button.id}
                        className="mt-2 flex items-center justify-center gap-2 border-t border-slate-100 py-2 text-center text-[11px] font-medium text-sky-600"
                      >
                        {button.type === "Website URL" ? (
                          <Link size={12} />
                        ) : button.type === "Call Phone Number" ? (
                          <Phone size={12} />
                        ) : (
                          <Copy size={12} />
                        )}

                        <span className="break-words">{button.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-3">
                  <div className="flex-1 rounded-full bg-slate-100 px-3 py-2 text-[10px] text-slate-400">
                    Type a message
                  </div>

                  <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white">
                    <Send size={13} />
                  </div>
                </div>
              </div>
            </section>

            {/* JSON Preview */}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4">
                <div>
                  <h3 className="text-sm font-bold">
                    Cloud API Payload Preview
                  </h3>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Template configuration
                  </p>
                </div>

                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium hover:bg-slate-50"
                >
                  <Copy size={12} />
                  Copy JSON
                </button>
              </div>

              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words bg-[#111827] p-4 text-[10px] leading-5 text-emerald-300">
                {JSON.stringify(buildPayload(), null, 2)}
              </pre>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ number, title }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
        {number}
      </span>

      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
    </div>
  );
}
