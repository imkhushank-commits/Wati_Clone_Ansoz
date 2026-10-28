import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  FileText,
  Copy,
  Pencil,
  MoreVertical,
  ExternalLink,
  Phone,
  Code2,
  X,
  CheckCheck,
  Send,
  MessageSquareText,
  CalendarDays,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  UploadCloud,
  Loader2,
} from "lucide-react";

/* ================= MEDIA STORAGE (IndexedDB) =================
   Files localStorage me nahi jaati (size limit ~5MB), isliye
   image / video / document IndexedDB me save hoti hai.
   Page refresh ke baad bhi preview wapas dikhega.
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

async function getBlob(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* ================= MEDIA HELPERS ================= */

const MEDIA_RULES = {
  image: {
    label: "Image",
    accept: "image/jpeg,image/png,image/webp",
    maxMB: 5,
    hint: "JPG, PNG, WEBP (max 5 MB)",
  },
  video: {
    label: "Video",
    accept: "video/mp4,video/3gpp",
    maxMB: 16,
    hint: "MP4, 3GP (max 16 MB)",
  },
  document: {
    label: "Document",
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
    maxMB: 100,
    hint: "PDF, DOC, XLS, PPT, TXT, CSV (max 100 MB)",
  },
};

const DOC_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];

const getExt = (name = "") =>
  name.includes(".") ? name.split(".").pop().toLowerCase() : "";

const formatSize = (bytes) => {
  if (!bytes) return "";
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

function validateFile(kind, file) {
  const rule = MEDIA_RULES[kind];
  const ext = getExt(file.name);

  const typeOk =
    kind === "image"
      ? file.type.startsWith("image/")
      : kind === "video"
      ? file.type.startsWith("video/")
      : DOC_EXTENSIONS.includes(ext);

  if (!typeOk) return `Galat file type. Allowed: ${rule.hint}`;
  if (file.size > rule.maxMB * 1024 * 1024) {
    return `File bahut badi hai. ${rule.label} ka max size ${rule.maxMB} MB hai.`;
  }
  return "";
}

// Purane templates (jinme sirf `image` URL tha) bhi chalte rahein
function getMedia(template) {
  if (template.media) return template.media;
  if (template.image) {
    return { kind: "image", source: "url", url: template.image, name: "image" };
  }
  return null;
}

// Stored media se displayable src nikalta hai.
// Save ke turant baad media.src (memory ka link) milta hai -> preview instantly dikhta hai.
// Refresh ke baad media.src nahi hota, tab file IndexedDB se wapas padhi jaati hai.
function useMediaSrc(media) {
  const [state, setState] = useState({ src: "", missing: false });
  const key = media
    ? media.src || (media.source === "url" ? media.url : media.mediaId)
    : "";

  useEffect(() => {
    if (!media || media.src || media.source === "url") return undefined;

    let cancelled = false;
    let objectUrl = "";
    setState({ src: "", missing: false });

    getBlob(media.mediaId)
      .then((blob) => {
        if (cancelled) return;
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setState({ src: objectUrl, missing: false });
        } else {
          setState({ src: "", missing: true });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ src: "", missing: true });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!media) return { src: "", missing: false };
  if (media.src) return { src: media.src, missing: false };
  if (media.source === "url") return { src: media.url, missing: false };
  return state;
}

/* ================= MEDIA VIEW (image / video / document) ================= */

function MediaView({ kind, src, name, size, alt, missing }) {
  if (missing) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center gap-1 bg-slate-100 px-4 text-center text-[11px] text-slate-500">
        <FileText size={18} />
        {name || "Media"} ka preview nahi mil raha. Template edit karke file dobara upload karo.
      </div>
    );
  }

  if (!src) {
    return (
      <div className="flex h-32 w-full items-center justify-center gap-2 bg-slate-100 text-[11px] text-slate-400">
        <Loader2 size={14} className="animate-spin" />
        Loading media...
      </div>
    );
  }

  if (kind === "image") {
    return (
      <img
        src={src}
        alt={alt || name || "Template header"}
        className="max-h-56 w-full bg-slate-100 object-cover"
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        preload="metadata"
        className="max-h-56 w-full bg-black object-contain"
      />
    );
  }

  // document
  const ext = getExt(name).toUpperCase() || "DOC";

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      download={name}
      className="flex items-center gap-3 bg-slate-100 p-3 hover:bg-slate-200/70"
      title="Open / download document"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
        <FileText size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-800">
          {name || "Document"}
        </p>
        <p className="text-[10px] text-slate-500">
          {ext}
          {size ? ` • ${formatSize(size)}` : ""}
        </p>
      </div>

      <ExternalLink size={14} className="shrink-0 text-slate-400" />
    </a>
  );
}

function MediaPreview({ media, alt }) {
  const { src, missing } = useMediaSrc(media);

  return (
    <MediaView
      kind={media.kind}
      src={src}
      missing={missing}
      name={media.name}
      size={media.size}
      alt={alt}
    />
  );
}

/* ================= DATA ================= */

const initialTemplates = [
  {
    id: 1,
    name: "diwali_festival_offer_2026",
    category: "Marketing",
    language: "English (US)",
    status: "Approved",
    header: "Diwali Festival Offer",
    image:
      "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
    body: "Hello {{1}}, celebrate this festive season with an exclusive 20% discount on our collection! Light up your home with our festive hampers. Valid until November 30. Use promo code FESTIVE20 at checkout.",
    footer: "Limited period offer",
    buttons: ["Shop Collection", "Call Our Store"],
    broadcasts: "14,200",
    delivery: "98.4%",
    health: "High",
    created: "Nov 24, 2026",
    modified: "Nov 25, 2026",
  },
  {
    id: 2,
    name: "order_delivery_update_v2",
    category: "Utility",
    language: "English (US)",
    status: "Approved",
    header: "Shipment Update",
    image: "",
    body: "Your order {{1}} has been shipped! Hi {{2}}, your order is on its way. Track your delivery and view the latest status using the link below.",
    footer: "Thank you for shopping with us.",
    buttons: ["Track Order Link"],
    broadcasts: "8,430",
    delivery: "98.6%",
    health: "High",
    created: "Nov 24, 2026",
    modified: "Nov 25, 2026",
  },
  {
    id: 3,
    name: "vip_loyalty_invitation",
    category: "Marketing",
    language: "English (US)",
    status: "Approved",
    header: "VIP Membership Invitation",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
    body: "Dear {{1}}, you are invited to join our exclusive VIP membership with complimentary concierge access and premium benefits. Activate your membership today to unlock special rewards.",
    footer: "Exclusive member benefits",
    buttons: ["Activate VIP Pass"],
    broadcasts: "2,900",
    delivery: "88.4%",
    health: "High",
    created: "Nov 23, 2026",
    modified: "Nov 24, 2026",
  },
  {
    id: 4,
    name: "otp_verification_secure",
    category: "Authentication",
    language: "English (US)",
    status: "Approved",
    header: "",
    image: "",
    body: "Your verification code is {{1}}. Please do not share this code with anyone. It is valid for 5 minutes.",
    footer: "Keep your account secure.",
    buttons: ["Copy Code"],
    broadcasts: "5,200",
    delivery: "99.9%",
    health: "High",
    created: "Nov 23, 2026",
    modified: "Nov 24, 2026",
  },
];

const badgeStyles = {
  Marketing: "bg-emerald-50 text-emerald-700",
  Utility: "bg-blue-50 text-blue-700",
  Authentication: "bg-violet-50 text-violet-700",
  Approved: "bg-green-100 text-green-800",
  Pending: "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-700",
  Paused: "bg-slate-100 text-slate-600",
};

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

/* ================= TEMPLATE CARD ================= */

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onPreview,
  onDelete,
  onCampaign,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const media = getMedia(template);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText("{{1}}");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-4">
      {/* CARD HEADER */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-all text-xs font-bold text-slate-800 sm:text-sm">
            {template.name}
          </h3>

          <div className="mt-2 flex flex-wrap gap-1">
            <Badge className={badgeStyles[template.category]}>
              {template.category}
            </Badge>

            <Badge className="bg-slate-100 text-slate-600">
              {template.language}
            </Badge>

            <Badge className={badgeStyles[template.status]}>
              <CheckCircle2 className="mr-1" size={11} />
              {template.status}
            </Badge>

            {media && (
              <Badge className="gap-1 bg-slate-100 text-slate-600">
                {media.kind === "image" && <ImageIcon size={11} />}
                {media.kind === "video" && <VideoIcon size={11} />}
                {media.kind === "document" && <FileText size={11} />}
                {MEDIA_RULES[media.kind].label}
              </Badge>
            )}
          </div>
        </div>

        <div className="relative flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(template)}
            title="Edit template"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={() => onDuplicate(template)}
            title="Duplicate template"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
          >
            <Copy size={15} />
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            title="More options"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
              <button
                onClick={() => {
                  onPreview(template);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-slate-50"
              >
                <Code2 size={14} /> Preview JSON
              </button>

              <button
                onClick={() => {
                  onDuplicate(template);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-slate-50"
              >
                <Copy size={14} /> Duplicate
              </button>

              <button
                onClick={() => {
                  onDelete(template);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete draft
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WHATSAPP MESSAGE PREVIEW */}
      <div className="rounded-xl border border-emerald-100 bg-[#f0f7f1] p-2.5 sm:p-3">
        <div className="mx-auto max-w-[340px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-3 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageSquareText size={13} />
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-800">
                Your Business
              </p>
              <p className="text-[9px] text-slate-400">
                WhatsApp message preview
              </p>
            </div>
          </div>

          {media && (
            <MediaPreview
              media={media}
              alt={`${template.name} template header`}
            />
          )}

          <div className="p-3">
            {template.header && (
              <h4 className="mb-2 text-xs font-bold text-slate-800">
                {template.header}
              </h4>
            )}

            <p className="whitespace-pre-wrap break-words text-[11px] leading-[1.65] text-slate-700">
              {template.body}
            </p>

            {template.footer && (
              <p className="mt-2 text-[9px] text-slate-400">
                {template.footer}
              </p>
            )}

            <p className="mt-2 text-right text-[9px] text-slate-400">
              10:42 AM
            </p>
          </div>

          <div className="border-t border-slate-100 p-2">
            {template.buttons.map((button, index) => (
              <button
                key={`${button}-${index}`}
                onClick={
                  button.toLowerCase().includes("copy")
                    ? copyCode
                    : undefined
                }
                className="mb-1 flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-100 py-2 text-[10px] font-semibold text-emerald-700 last:mb-0 hover:bg-emerald-50"
              >
                {button.toLowerCase().includes("call") ? (
                  <Phone size={12} />
                ) : button.toLowerCase().includes("track") ||
                  button.toLowerCase().includes("shop") ? (
                  <ExternalLink size={12} />
                ) : button.toLowerCase().includes("copy") ? (
                  <Copy size={12} />
                ) : (
                  <CheckCheck size={12} />
                )}

                {button.toLowerCase().includes("copy") && copied
                  ? "Copied!"
                  : button}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ANALYTICS */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-md bg-[#f2f4ff] p-2">
          <p className="text-[9px] leading-3 text-slate-500">
            Total Broadcasts
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {template.broadcasts}
          </p>
          <p className="text-[9px] text-emerald-700">All campaigns</p>
        </div>

        <div className="rounded-md bg-[#f2f4ff] p-2">
          <p className="text-[9px] leading-3 text-slate-500">
            Delivery Rate
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {template.delivery}
          </p>
          <p className="text-[9px] text-emerald-700">Delivery metric</p>
        </div>

        <div className="rounded-md bg-[#f2f4ff] p-2">
          <p className="text-[9px] leading-3 text-slate-500">
            Health Rating
          </p>
          <p className="mt-1 text-sm font-bold text-emerald-700">
            {template.health}
          </p>
          <p className="text-[9px] text-slate-500">Template health</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] text-slate-500">
          <span>Created: {template.created}</span>
          <span>Modified: {template.modified}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPreview(template)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Code2 size={13} />
            Preview JSON
          </button>

          <button
            onClick={() => onCampaign(template)}
            disabled={template.status !== "Approved"}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-700 px-2 py-2 text-[10px] font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Send size={13} />
            Send Campaign
          </button>
        </div>
      </div>
    </article>
  );
}

/* ================= CREATE / EDIT MODAL ================= */

function TemplateModal({ template, onClose, onSave }) {
  const initialMedia = template ? getMedia(template) : null;

  const [form, setForm] = useState(() => ({
    name: template?.name || "",
    category: template?.category || "Marketing",
    language: template?.language || "English (US)",
    header: template?.header || "",
    body: template?.body || "",
    footer: template?.footer || "",
    buttons: template?.buttons?.join(", ") || "",
  }));

  // media state
  const [mediaKind, setMediaKind] = useState(initialMedia?.kind || "none");
  const [existing, setExisting] = useState(initialMedia); // already saved media
  const [file, setFile] = useState(null); // newly picked file
  const [localUrl, setLocalUrl] = useState("");
  const [urlInput, setUrlInput] = useState(
    initialMedia?.source === "url" ? initialMedia.url : ""
  );
  const [saving, setSaving] = useState(false);

  const { src: existingSrc } = useMediaSrc(existing);

  // Naya file select hote hi turant preview ke liye object URL
  useEffect(() => {
    if (!file) {
      setLocalUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  function changeKind(kind) {
    setMediaKind(kind);
    setFile(null);
    setUrlInput("");
    if (kind === "none" || (existing && existing.kind !== kind)) {
      setExisting(null);
    }
  }

  function handlePick(event) {
    const picked = event.target.files?.[0];
    event.target.value = ""; // same file dobara select ho sake
    if (!picked) return;

    const error = validateFile(mediaKind, picked);
    if (error) {
      alert(error);
      return;
    }

    setFile(picked);
    setUrlInput("");
    setExisting(null);
  }

  function removeMedia() {
    setFile(null);
    setUrlInput("");
    setExisting(null);
  }

  // Jo preview abhi dikhana hai
  const preview = (() => {
    if (mediaKind === "none") return null;
    if (file) {
      return { src: localUrl, name: file.name, size: file.size };
    }
    if (urlInput.trim()) {
      return {
        src: urlInput.trim(),
        name: urlInput.trim().split("?")[0].split("/").pop() || "media",
        size: 0,
      };
    }
    if (existing) {
      return { src: existingSrc, name: existing.name, size: existing.size };
    }
    return null;
  })();

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.body.trim()) {
      alert("Please enter a template name and message body.");
      return;
    }

    setSaving(true);

    try {
      let media = null;

      if (mediaKind !== "none") {
        if (file) {
          const mediaId = `m_${Date.now()}`;
          try {
            await putBlob(mediaId, file); // refresh ke baad ke liye backup
          } catch {
            console.warn("IndexedDB save fail hua; preview sirf is session me dikhega.");
          }
          media = {
            kind: mediaKind,
            source: "file",
            mediaId,
            src: URL.createObjectURL(file), // turant preview ke liye
            name: file.name,
            size: file.size,
            mime: file.type,
          };
        } else if (urlInput.trim()) {
          media = {
            kind: mediaKind,
            source: "url",
            url: urlInput.trim(),
            name: urlInput.trim().split("?")[0].split("/").pop() || "media",
          };
        } else if (existing) {
          media = existing;
        }
      }

      onSave({
        ...template,
        ...form,
        id: template?.id || Date.now(),
        status: "Draft",
        image: "", // purana field, ab `media` use hota hai
        media,
        buttons: form.buttons
          .split(",")
          .map((button) => button.trim())
          .filter(Boolean),
        broadcasts: template?.broadcasts || "0",
        delivery: template?.delivery || "—",
        health: template?.health || "Not rated",
        created: template?.created || new Date().toLocaleDateString(),
        modified: new Date().toLocaleDateString(),
      });
    } catch {
      alert("Media save nahi ho paya. Dobara try karo.");
    } finally {
      setSaving(false);
    }
  }

  const rule = MEDIA_RULES[mediaKind];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {template ? "Edit Template" : "Create New Template"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Create a WhatsApp message template draft.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-700">
              Template Name *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="welcome_message"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Category
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
              >
                <option>Marketing</option>
                <option>Utility</option>
                <option>Authentication</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Language
              <select
                name="language"
                value={form.language}
                onChange={updateField}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Hindi</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-700">
              Header
              <input
                name="header"
                value={form.header}
                onChange={updateField}
                placeholder="Optional header"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
              />
            </label>
          </div>

          {/* MEDIA UPLOAD */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Header media (optional)
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { value: "none", label: "None", icon: null },
                { value: "image", label: "Image", icon: ImageIcon },
                { value: "video", label: "Video", icon: VideoIcon },
                { value: "document", label: "Document", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => changeKind(item.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      mediaKind === item.value
                        ? "bg-emerald-700 text-white"
                        : "bg-[#f2f4ff] text-slate-600 hover:bg-indigo-100"
                    }`}
                  >
                    {Icon && <Icon size={14} />}
                    {item.label}
                  </button>
                );
              })}
            </div>

            {mediaKind !== "none" && (
              <div className="mt-3 space-y-3">
                {/* LIVE PREVIEW */}
                {preview ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <MediaView
                      kind={mediaKind}
                      src={preview.src}
                      name={preview.name}
                      size={preview.size}
                      alt="Selected media preview"
                    />

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-3 py-2">
                      <p className="min-w-0 truncate text-[11px] text-slate-600">
                        {preview.name}
                        {preview.size ? ` • ${formatSize(preview.size)}` : ""}
                      </p>

                      <button
                        type="button"
                        onClick={removeMedia}
                        className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/50">
                    <UploadCloud size={24} className="text-emerald-700" />
                    <span className="text-xs font-semibold text-slate-700">
                      Click karke {rule.label.toLowerCase()} select karo
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {rule.hint}
                    </span>

                    <input
                      type="file"
                      accept={rule.accept}
                      onChange={handlePick}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Replace file button jab preview ho */}
                {preview && (
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                    <UploadCloud size={13} />
                    Change file
                    <input
                      type="file"
                      accept={rule.accept}
                      onChange={handlePick}
                      className="hidden"
                    />
                  </label>
                )}

                {/* URL option */}
                <label className="block text-[11px] font-medium text-slate-500">
                  Ya {rule.label.toLowerCase()} ka URL paste karo
                  <input
                    value={urlInput}
                    onChange={(event) => {
                      setUrlInput(event.target.value);
                      setFile(null);
                      setExisting(null);
                    }}
                    placeholder="https://example.com/file"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            )}
          </div>

          <label className="block text-xs font-semibold text-slate-700">
            Message Body *
            <textarea
              name="body"
              value={form.body}
              onChange={updateField}
              rows={5}
              placeholder="Hello {{1}}, welcome to our business..."
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm font-normal leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
            <span className="mt-1 block font-normal text-slate-400">
              Use {"{{1}}"}, {"{{2}}"} for dynamic variables.
            </span>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Footer
            <input
              name="footer"
              value={form.footer}
              onChange={updateField}
              placeholder="Optional footer"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-700">
            Buttons
            <input
              name="buttons"
              value={form.buttons}
              onChange={updateField}
              placeholder="Visit Us, Call Us, Quick Reply"
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-500"
            />
            <span className="mt-1 block font-normal text-slate-400">
              Separate button labels with commas.
            </span>
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= JSON MODAL ================= */

function JsonModal({ template, onClose }) {
  const media = getMedia(template);

  const headerComponent = media
    ? {
        type: "HEADER",
        format: media.kind.toUpperCase(),
        example: {
          header_handle: [media.source === "url" ? media.url : media.name],
        },
      }
    : template.header
    ? { type: "HEADER", format: "TEXT", text: template.header }
    : null;

  const json = {
    name: template.name,
    category: template.category.toLowerCase(),
    language: template.language,
    status: template.status,
    components: [
      ...(headerComponent ? [headerComponent] : []),
      {
        type: "BODY",
        text: template.body,
      },
      ...(template.footer
        ? [{ type: "FOOTER", text: template.footer }]
        : []),
      ...(template.buttons?.length
        ? [
            {
              type: "BUTTONS",
              buttons: template.buttons.map((text) => ({
                type: "QUICK_REPLY",
                text,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Template JSON Preview
            </h2>
            <p className="mt-1 text-xs text-slate-500">{template.name}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Close JSON preview"
          >
            <X size={19} />
          </button>
        </div>

        <pre className="max-h-[65vh] overflow-auto bg-slate-950 p-5 text-xs leading-6 text-emerald-300">
          {JSON.stringify(json, null, 2)}
        </pre>

        <div className="flex justify-end p-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function Templates() {
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("reachpulse_templates");
      return saved ? JSON.parse(saved) : initialTemplates;
    } catch {
      return initialTemplates;
    }
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [editor, setEditor] = useState(null);
  const [jsonTemplate, setJsonTemplate] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(
        "reachpulse_templates",
        JSON.stringify(templates, (key, value) =>
          key === "src" ? undefined : value
        )
      );
    } catch {
      // storage full ho to app crash na ho
    }
  }, [templates]);

  function notify(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  }

  const filteredTemplates = useMemo(() => {
    let result = templates.filter((template) => {
      const matchesSearch = [
        template.name,
        template.category,
        template.language,
        template.body,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || template.category === category;

      const matchesStatus =
        status === "All" || template.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);

      if (sort === "delivery") {
        return parseFloat(b.delivery) - parseFloat(a.delivery);
      }

      const aDate = new Date(a.modified).getTime() || 0;
      const bDate = new Date(b.modified).getTime() || 0;

      return sort === "oldest" ? aDate - bDate : bDate - aDate;
    });

    return result;
  }, [templates, search, category, status, sort]);

  const approvedCount = templates.filter(
    (template) => template.status === "Approved"
  ).length;

  function saveTemplate(template) {
    setTemplates((previous) => {
      const exists = previous.some((item) => item.id === template.id);

      return exists
        ? previous.map((item) =>
            item.id === template.id ? template : item
          )
        : [template, ...previous];
    });

    setEditor(null);
    notify("Template draft saved successfully.");
  }

  function duplicateTemplate(template) {
    const copy = {
      ...template,
      id: Date.now(),
      name: `${template.name}_copy`,
      status: "Draft",
      broadcasts: "0",
      delivery: "—",
      health: "Not rated",
      created: new Date().toLocaleDateString(),
      modified: new Date().toLocaleDateString(),
    };

    setTemplates((previous) => [copy, ...previous]);
    notify("Template duplicated as a draft.");
  }

  function deleteTemplate(template) {
    if (template.status !== "Draft") {
      notify("Only drafts can be deleted in this demo.");
      return;
    }

    if (!window.confirm(`Delete draft "${template.name}"?`)) return;

    setTemplates((previous) =>
      previous.filter((item) => item.id !== template.id)
    );

    notify("Draft deleted.");
  }

  function sendCampaign(template) {
    if (template.status !== "Approved") {
      notify("Only approved templates can be used for campaigns.");
      return;
    }

    sessionStorage.setItem(
      "reachpulse_selected_template",
      JSON.stringify(template)
    );

    window.location.href = "/campaigns";
  }

  function syncMeta() {
    notify("Demo mode: connect Meta API to sync real template status.");
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setStatus("All");
    setSort("newest");
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#f8f9ff] p-4 sm:p-5 lg:p-6">
      {/* NOTIFICATION */}
      {notice && (
        <div
          role="status"
          className="fixed right-5 top-20 z-[120] max-w-sm rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl"
        >
          {notice}
        </div>
      )}

      {/* HEADER */}
      <section className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-start">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-600" />
              WhatsApp Business Platform
            </Badge>

            <span className="text-[11px] text-slate-500">
              Operations Console
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Your Templates
          </h1>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
            Manage approved Meta WhatsApp templates, monitor
            delivery performance, and initiate targeted broadcast
            campaigns with confidence.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="gap-1 bg-white text-emerald-700 ring-1 ring-slate-200">
              <CheckCircle2 size={12} />
              {approvedCount} Approved Templates
            </Badge>

            <Badge className="gap-1 bg-white text-slate-600 ring-1 ring-slate-200">
              <CheckCheck size={12} />
              Demo performance metrics
            </Badge>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={syncMeta}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Sync Meta Status
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold ${
              showFilters
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filter View
          </button>

          <button
            onClick={() => setEditor({ mode: "create" })}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
          >
            <Plus size={16} />
            Create New Template
          </button>
        </div>
      </section>

      {/* FILTER TOOLBAR */}
      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 lg:w-56">
              <Search size={15} className="shrink-0 text-slate-400" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by name"
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {["All", "Marketing", "Utility", "Authentication"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`rounded-lg px-2.5 py-2 text-[10px] font-semibold transition sm:text-xs ${
                      category === item
                        ? "bg-emerald-700 text-white"
                        : "bg-[#f2f4ff] text-slate-600 hover:bg-indigo-100"
                    }`}
                  >
                    {item === "All" ? "All Templates" : item}
                  </button>
                )
              )}
            </div>
          </div>

          <label className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={14} />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="max-w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="newest">Last Modified (Newest First)</option>
              <option value="oldest">Last Modified (Oldest First)</option>
              <option value="name">Template Name (A-Z)</option>
              <option value="delivery">Highest Delivery Rate</option>
            </select>
          </label>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <span className="text-xs font-semibold text-slate-600">
              Approval Status:
            </span>

            {["All", "Approved", "Pending", "Rejected", "Paused", "Draft"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${
                    status === item
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              onClick={resetFilters}
              className="ml-auto text-xs font-semibold text-emerald-700 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* TEMPLATE COUNT */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-bold text-slate-800">
            {filteredTemplates.length}
          </span>{" "}
          templates
        </p>

        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <FileText size={13} />
          Template Library
        </div>
      </div>

      {/* TEMPLATE GRID */}
      {filteredTemplates.length > 0 ? (
        <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={(item) => setEditor(item)}
              onDuplicate={duplicateTemplate}
              onPreview={setJsonTemplate}
              onDelete={deleteTemplate}
              onCampaign={sendCampaign}
            />
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Search size={22} />
          </div>

          <h3 className="mt-4 text-base font-bold text-slate-800">
            No templates found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Try another search term or clear your filters.
          </p>

          <button
            onClick={resetFilters}
            className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* MODALS */}
      {editor && (
        <TemplateModal
          template={editor.mode === "create" ? null : editor}
          onClose={() => setEditor(null)}
          onSave={saveTemplate}
        />
      )}

      {jsonTemplate && (
        <JsonModal
          template={jsonTemplate}
          onClose={() => setJsonTemplate(null)}
        />
      )}
    </div>
  );
}
