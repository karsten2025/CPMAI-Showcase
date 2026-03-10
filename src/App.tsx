import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Database,
  RefreshCw,
  BarChart3,
  Shield,
  Zap,
  Leaf,
  Info,
  Layers,
  Clock,
  FileJson,
  ShieldCheck,
  ChevronRight,
  Activity,
  Printer,
  Linkedin,
  ExternalLink,
  Award,
  Cpu,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { DashboardData, PipelineSpec } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STRUCTURED_PIPELINE_SPEC: PipelineSpec = {
  volume:
    "Mittel (MB bis GB). Wir ziehen meist tägliche Zusammenfassungen der Buchhaltung.",
  velocity:
    "Batch-Betrieb. Einmal am Tag oder pro Stunde. Keine Echtzeit-Sekunden-Updates nötig.",
  variety:
    "Sehr gering. Die Daten kommen in festen Tabellen (CSV/SQL). Jede Spalte hat ihren festen Platz.",
  veracity:
    "Sehr hoch. Da es aus dem Hauptsystem (SAP) kommt, vertrauen wir den Zahlen blind, prüfen aber, ob das Format stimmt.",
  description_short:
    "Direkter, automatisierter Abgriff aus dem ERP-System (SAP, Oracle). Mathematisch eindeutig.",
  tech_stack: ["Python", "SQLAlchemy", "Pandas", "Airflow"],
  implementation_steps: [
    {
      step: "Ingestion",
      action: "Pull via REST API (requests) oder ODBC/SQL (SQLAlchemy).",
      tools: "requests, pyodbc",
    },
    {
      step: "Staging",
      action: "Forensische Sicherung in Rohdaten-Quarantäne (Beweiskette).",
      tools: "SQLite, AWS S3",
    },
    {
      step: "Transformation",
      action: "Schema-Enforcement (Datentyp-Zwang), Null-Handling.",
      tools: "Pandas (df.astype, df.fillna)",
    },
    {
      step: "Modeling",
      action: "Statisches Mapping der Ist-Konten auf S6-Maßnahmen-Matrix.",
      tools: "Pandas (df.merge, df.map)",
    },
    {
      step: "Serving",
      action: "Aggregation & Injektion in den ISTreal-Vektor des Dashboards.",
      tools: "SQLAlchemy (to_sql)",
    },
  ],
};

const HIERARCHICAL_PIPELINE_SPEC: PipelineSpec = {
  volume: "Gering (KB bis MB). Einzelne Nachrichten oder API-Antworten.",
  velocity:
    "Hoch (Echtzeit-nah). Daten fließen oft per 'Push' (Webhook), sobald etwas passiert.",
  variety:
    "Mittel. Verschachtelte Strukturen (JSON/XML). Erfordert 'Flattening' (Abflachung).",
  veracity:
    "Sehr hoch. Maschinen-zu-Maschinen Kommunikation ist präzise, solange das Schema stabil ist.",
  description_short:
    "Moderne Web-APIs und Maschinenkommunikation (M2M). Flexibel aber strukturiert.",
  tech_stack: ["Python", "FastAPI", "MongoDB", "json_normalize"],
  implementation_steps: [
    {
      step: "Ingestion",
      action: "Push-Empfang via Webhook oder zyklischer API-Pull (REST).",
      tools: "FastAPI, requests",
    },
    {
      step: "Staging",
      action: "Ablage der nativen Payloads (JSON/XML) in Dokumenten-Speicher.",
      tools: "MongoDB, AWS S3",
    },
    {
      step: "Transformation",
      action: "Maschinelle Entschachtelung (Flattening) der Hierarchien.",
      tools: "Pandas (json_normalize)",
    },
    {
      step: "Modeling",
      action: "Dynamisches Key-Value Mapping auf die S6-Matrix.",
      tools: "Python Dictionary Mapping",
    },
    {
      step: "Serving",
      action: "Injektion der bereinigten Kennzahlen in das Dashboard.",
      tools: "Dashboard API",
    },
  ],
};

const SEMI_STRUCTURED_PIPELINE_SPEC: PipelineSpec = {
  volume:
    "Mittel. Logfiles können groß werden, Excel-Dateien sind meist klein (KB bis MB).",
  velocity:
    "Batch oder On-Demand. Oft manueller Upload oder skriptbasierter Abgriff von File-Servern.",
  variety:
    "Mittel bis Hoch. Jedes Logfile oder Excel-Template hat sein eigenes Muster (Regex/Zellen).",
  veracity:
    "Mittel. Erfordert Validierung, da manuelle Fehler in Excel-Eingaben häufig sind.",
  description_short:
    "Musterbasierte Extraktion aus IT-Logs, HTML-Scraping oder manuellen Controlling-Excels.",
  tech_stack: ["Python", "Openpyxl", "Regex", "BeautifulSoup"],
  implementation_steps: [
    {
      step: "Ingestion",
      action: "File Drop (Watchdog) oder Log Forwarding via API/Syslog.",
      tools: "Watchdog, ELK-Stack",
    },
    {
      step: "Staging",
      action: "Quarantäne der nativen Rohdateien auf gesichertem File-Server.",
      tools: "Local FS, AWS S3",
    },
    {
      step: "Transformation",
      action:
        "Auslesen fixer Zellenkoordinaten oder Mustererkennung via Regex.",
      tools: "Openpyxl, re (Regex)",
    },
    {
      step: "Modeling",
      action: "Aggregation der extrahierten Werte auf Zeitreihen (Tidy Data).",
      tools: "Pandas",
    },
    {
      step: "Serving",
      action: "Load in den ISTreal-Vektor des Dashboards.",
      tools: "SQLAlchemy",
    },
  ],
};

const UNSTRUCTURED_TEXT_PIPELINE_SPEC: PipelineSpec = {
  volume: "Hoch (GB bis TB). Ganze Archive von PDFs, E-Mails und Verträgen.",
  velocity:
    "On-Demand oder Event-basiert. Sobald ein neues Dokument im DMS landet.",
  variety:
    "Sehr Hoch. Freitext, unterschiedliche Sprachen, unstrukturierte Layouts.",
  veracity:
    "Gering bis Mittel (KI-gestützt). Erfordert 'Human-in-the-loop' oder Confidence-Scores zur Absicherung.",
  description_short:
    "KI-gestützte Extraktion (NLP/LLM) von Entitäten aus Gutachten, Verträgen und Berichten.",
  tech_stack: ["Python", "Ollama/OpenAI", "spaCy", "ChromaDB"],
  implementation_steps: [
    {
      step: "Ingestion",
      action: "API-Abgriff von Postfächern (IMAP/Graph) oder DMS-Systemen.",
      tools: "Microsoft Graph API",
    },
    {
      step: "Staging",
      action:
        "Speicherung der Original-Dokumente in Blob-Storage (Audit-Trail).",
      tools: "AWS S3, Azure Blobs",
    },
    {
      step: "Transformation",
      action: "Rohtext-Extraktion (OCR falls nötig) & NLP/LLM Analyse.",
      tools: "PyMuPDF, LangChain",
    },
    {
      step: "Modeling",
      action: "Übersetzung von Text-Entitäten in numerische KPI-Variablen.",
      tools: "LLM Prompt Engineering",
    },
    {
      step: "Serving",
      action:
        "Injektion inkl. Quellen-Link und Confidence-Score ins Dashboard.",
      tools: "Dashboard API",
    },
  ],
};

const UNSTRUCTURED_VISUAL_PIPELINE_SPEC: PipelineSpec = {
  volume:
    "Mittel (GB). Scans von Lieferscheinen, Fotos von Whiteboards, TIFFs.",
  velocity: "Event-basiert. Sobald ein Scan im Drop-Folder landet.",
  variety:
    "Hoch. Handschrift, unterschiedliche Scan-Qualitäten, komplexe Tabellen-Layouts.",
  veracity:
    "Gering (KI-gestützt). Erfordert visuelle Verifikation durch den Nutzer (Forensik).",
  description_short:
    "OCR und Vision-KI (VLM) zur Extraktion von Daten aus Bildern und Scans.",
  tech_stack: ["Python", "Tesseract", "OpenCV", "LLaVA/GPT-4o"],
  implementation_steps: [
    {
      step: "Ingestion",
      action: "Watchdog für Drop-Folder oder API-Upload von Scannern.",
      tools: "Python Watchdog",
    },
    {
      step: "Staging",
      action: "Forensische Sicherung des Originalbildes (unverändert).",
      tools: "Local Storage, S3",
    },
    {
      step: "Transformation",
      action: "Bildvorverarbeitung (Denoising, Deskewing) & OCR/VLM.",
      tools: "OpenCV, Tesseract",
    },
    {
      step: "Modeling",
      action: "Spatial Mapping: Zuordnung von Bildregionen zu KPIs.",
      tools: "Custom Geometry Logic",
    },
    {
      step: "Serving",
      action: "Injektion inkl. Bild-Snippet (Beweisstück) ins Dashboard.",
      tools: "Dashboard API",
    },
  ],
};

const STREAMING_PIPELINE_SPEC: PipelineSpec = {
  volume: "Sehr Hoch (TB). Millionen kleiner Nachrichten pro Stunde.",
  velocity: "Echtzeit (Millisekunden). Daten werden 'im Flug' verarbeitet.",
  variety:
    "Gering bis Mittel. Meist standardisierte Protokolle (MQTT, Kafka, WebSockets).",
  veracity:
    "Mittel. Sensoren können 'rauschen' oder temporär ausfallen (Ausreißer-Erkennung nötig).",
  description_short:
    "Hochgeschwindigkeits-Verarbeitung von IoT-Sensoren, Live-Börsendaten oder Klickströmen.",
  tech_stack: ["Python", "Apache Kafka", "Spark Streaming", "InfluxDB"],
  implementation_steps: [
    {
      step: "Ingestion",
      action: "Abonnement von Message-Queues oder Live-Socket-Streams.",
      tools: "Kafka, MQTT Broker",
    },
    {
      step: "Staging",
      action: "Kurzzeit-Pufferung im Arbeitsspeicher (In-Memory Buffer).",
      tools: "Redis, Apache Flink",
    },
    {
      step: "Transformation",
      action: "Echtzeit-Aggregation über Zeitfenster (Sliding Windows).",
      tools: "Spark Streaming",
    },
    {
      step: "Modeling",
      action: "Statistische Glättung und Erkennung von Anomalien.",
      tools: "SciPy, Isolation Forest",
    },
    {
      step: "Serving",
      action: "Push-Update an das Dashboard via WebSockets.",
      tools: "Socket.io",
    },
  ],
};

const CPMAI_PHASES = [
  {
    id: "01",
    title: "Business Interest",
    desc: "Definition der S6-Maßnahmen & Stakeholder-Ziele.",
  },
  {
    id: "02",
    title: "Data Interest",
    desc: "Identifikation der ERP-, API- & Dokumentenquellen.",
  },
  {
    id: "03",
    title: "Data Prep",
    desc: "Automatisierte ETL-Pipelines & Schema-Enforcement.",
  },
  {
    id: "04",
    title: "Model Dev",
    desc: "Mapping-Logik & KI-gestützte Extraktion (NLP/VLM).",
  },
  {
    id: "05",
    title: "Evaluation",
    desc: "Validierung der Ist-Werte & Confidence-Scoring.",
  },
  {
    id: "06",
    title: "Operationalization",
    desc: "Live-Dashboard & Kontinuierliches Monitoring.",
  },
];

// --- LOGO KONFIGURATION ---
// Hier können Sie das Logo anpassen:
const LOGO_CONFIG = {
  top: "5mm", // Abstand vom oberen Rand (z.B. "5mm", "20px", "1rem")
  sizeMobile: "w-24", // Breite mobil (Tailwind Klasse, z.B. w-20, w-24, w-32)
  sizeDesktop: "md:w-20", // Breite Desktop (Tailwind Klasse, z.B. md:w-40, md:w-48)
};

export default function App() {
  const [data, setData] = useState<DashboardData[]>([]);
  const [view, setView] = useState<"portal" | "dashboard">("portal");
  const [persona, setPersona] = useState<"stakeholder" | "developer">(
    "stakeholder"
  );
  const [loading, setLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [showBlueprint, setShowBlueprint] = useState(true);
  const [selectedPipeline, setSelectedPipeline] = useState<
    | "structured"
    | "hierarchical"
    | "semi-structured"
    | "unstructured-text"
    | "unstructured-visual"
    | "streaming"
  >("structured");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    setExportError(null);
    const element = document.getElementById("dashboard-root");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#E4E3E0",
        logging: false,
        onclone: (clonedDoc) => {
          // Hide elements in the cloned document only
          const noPrintElements = clonedDoc.querySelectorAll(".no-print");
          noPrintElements.forEach(
            (el) => ((el as HTMLElement).style.display = "none")
          );

          // Ensure the cloned root has the right background
          const root = clonedDoc.getElementById("dashboard-root");
          if (root) {
            root.style.backgroundColor = "#E4E3E0";
            root.style.padding = "1cm";
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(
        `S6-Baseline-Control-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("PDF Export failed:", error);
      setExportError(
        "PDF-Export fehlgeschlagen. Bitte nutzen Sie die manuelle Druckfunktion (Strg+P)."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const currentSpec =
    selectedPipeline === "structured"
      ? STRUCTURED_PIPELINE_SPEC
      : selectedPipeline === "hierarchical"
      ? HIERARCHICAL_PIPELINE_SPEC
      : selectedPipeline === "semi-structured"
      ? SEMI_STRUCTURED_PIPELINE_SPEC
      : selectedPipeline === "unstructured-text"
      ? UNSTRUCTURED_TEXT_PIPELINE_SPEC
      : selectedPipeline === "unstructured-visual"
      ? UNSTRUCTURED_VISUAL_PIPELINE_SPEC
      : STREAMING_PIPELINE_SPEC;

  const fetchData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulateIngestion = async () => {
    setIsIngesting(true);
    const updates = [
      { massnahme_id: "BASE", ist_wert: 12450000 + Math.random() * 100000 },
      { massnahme_id: "M-FIN-01", ist_wert: -315000 - Math.random() * 10000 },
      { massnahme_id: "COV-01", ist_wert: 4600000 + Math.random() * 50000 },
      { massnahme_id: "M-OP-02", ist_wert: 448 },
      { massnahme_id: "M-CYB-02", ist_wert: 99.95 },
      { massnahme_id: "M-ESG-01", ist_wert: 118 },
      { massnahme_id: "M-ESG-02", ist_wert: 1 },
    ];

    for (const update of updates) {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
    }

    await fetchData();
    setIsIngesting(false);
  };

  const getStatusColor = (item: DashboardData) => {
    if (item.ist_wert === null) return "text-slate-400";
    if (
      item.kategorie === "Finanzen" &&
      item.sub_kategorie === "Personalaufwand"
    ) {
      return item.ist_wert <= item.soll_wert
        ? "text-emerald-500"
        : "text-rose-500";
    }
    if (item.metrik_typ === "Prozent" || item.metrik_typ === "EUR") {
      if (item.soll_wert > 0) {
        return item.ist_wert >= item.soll_wert
          ? "text-emerald-500"
          : "text-rose-500";
      } else {
        return item.ist_wert <= item.soll_wert
          ? "text-emerald-500"
          : "text-rose-500";
      }
    }
    return "text-emerald-500";
  };

  const formatValue = (val: number | null, type: string) => {
    if (val === null) return "---";
    if (type === "EUR")
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(val);
    if (type === "Prozent") return `${val.toFixed(1)}%`;
    if (type === "Boolean") return val === 1 ? "JA" : "NEIN";
    return val.toString();
  };

  const categories = Array.from(new Set(data.map((d) => d.kategorie)));

  const Portal = () => (
    <div className="min-h-screen bg-[#E4E3E0] flex flex-col items-center p-4 md:p-6 lg:p-12 font-sans text-[#141414]">
      <div className="max-w-6xl w-full space-y-12 md:space-y-20">
        {/* Hero Section */}
        <div className="text-center space-y-6 pt-10 md:pt-12">
          <div className="inline-flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-4 py-1 font-mono text-[10px] uppercase tracking-widest mb-4">
            <Award size={12} className="text-rose-500" />
            CPMAI BUREAUCRACY-IMMUNE AGILITY Showcase
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif italic tracking-tighter leading-tight">
            S6 Baseline{" "}
            <span className="font-sans not-italic font-bold">Portal</span>
          </h1>
            <p className="font-mono text-xs uppercase tracking-widest opacity-60 max-w-xl mx-auto leading-relaxed">
            Ein Showcase für KI-gestütztes Sanierungscontrolling basierend auf
            der <span className="font-bold opacity-100">CPMAI Methodik</span>.
          </p>
        </div>

        {/* Persona Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Stakeholder Card */}
          <button
            onClick={() => {
              setPersona("stakeholder");
              setView("dashboard");
              setShowBlueprint(true);
            }}
            className="group relative bg-white border-2 border-[#141414] p-6 md:p-10 text-left transition-all hover:shadow-[16px_16px_0px_0px_rgba(20,20,20,1)] hover:-translate-x-1 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-10 md:mb-16">
              <ShieldCheck size={40} className="text-rose-600" />
              <div className="flex flex-col items-end">
                <ChevronRight
                  size={24}
                  className="opacity-20 group-hover:opacity-100 transition-opacity"
                />
                <span className="font-mono text-[8px] opacity-40 mt-2 uppercase">
                  Management Level
                </span>
              </div>
            </div>
            <h2 className="text-4xl font-serif italic mb-6">
              Stakeholder View
            </h2>
            <p className="text-base opacity-60 leading-relaxed mb-10">
              Fokus auf KPIs, Covenants und ESG-Ziele. Strategische Übersicht
              für Banken, Investoren und Geschäftsführung.
            </p>
            <div className="font-mono text-[10px] uppercase tracking-widest font-bold border-t border-[#141414] border-opacity-10 pt-6 flex justify-between items-center">
              <span>01 Strategisch & Kompakt</span>
              <span className="text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Enter Dashboard →
              </span>
            </div>
          </button>

          {/* Developer Card */}
          <button
            onClick={() => {
              setPersona("developer");
              setView("dashboard");
              setShowBlueprint(true);
            }}
            className="group relative bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-6 md:p-10 text-left transition-all hover:shadow-[16px_16px_0px_0px_rgba(228,227,224,0.2)] hover:-translate-x-1 hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-10 md:mb-16">
              <Database size={40} className="text-rose-600" />
              <div className="flex flex-col items-end">
                <ChevronRight
                  size={24}
                  className="opacity-20 group-hover:opacity-100 transition-opacity"
                />
                <span className="font-mono text-[8px] opacity-40 mt-2 uppercase">
                  Engineering Level
                </span>
              </div>
            </div>
            <h2 className="text-4xl font-serif italic mb-6">Developer View</h2>
            <p className="text-base opacity-60 leading-relaxed mb-10">
              Technische Details der Datenpipelines, ETL-Prozesse und
              Veracity-Scores. Für Data Scientists & IT-Controlling.
            </p>
            <div className="font-mono text-[10px] uppercase tracking-widest font-bold border-t border-white border-opacity-10 pt-6 flex justify-between items-center">
              <span>02 Technisch & Detailliert</span>
              <span className="text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Inspect Blueprint →
              </span>
            </div>
          </button>
        </div>

        {/* CPMAI Methodology Section */}
        <div className="space-y-10 md:space-y-12 py-12 md:py-20 border-t border-[#141414] border-opacity-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif italic">
                The CPMAI Methodology
              </h3>
              <p className="font-mono text-xs uppercase tracking-widest opacity-60">
                Cognitive Project Management for AI — Der Goldstandard für
                KI-Projekte
              </p>
            </div>
            <a
              href="https://www.linkedin.com/in/karsten-zenk/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0077B5] text-white px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-[#005a8a] transition-colors"
            >
              <Linkedin size={16} />
              Connect on LinkedIn
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#141414] border border-[#141414]">
            {CPMAI_PHASES.map((phase) => (
              <div
                key={phase.id}
                className="bg-white p-8 space-y-4 hover:bg-[#E4E3E0] transition-colors"
              >
                <div className="font-mono text-[10px] text-rose-600 font-bold">
                  {phase.id}
                </div>
                <h4 className="text-xl font-serif italic">{phase.title}</h4>
                <p className="text-sm opacity-60 leading-relaxed">
                  {phase.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Showcase / About Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 py-12 md:py-20 border-t border-[#141414] border-opacity-10">
          <div className="space-y-8">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif italic">
              Über diesen Showcase
            </h3>
            <div className="space-y-6 text-lg leading-relaxed opacity-80">
              <p>
                Dieses Projekt demonstriert die Verschmelzung von klassischem
                Sanierungscontrolling (S6-Gutachten) mit modernsten
                KI-Technologien. Als{" "}
                <span className="font-bold text-[#141414]">
                  CPMAI-zertifizierter Experte
                </span>{" "}
                stelle ich sicher, dass KI-Lösungen nicht nur technisch
                brillant, sondern vor allem geschäftlich relevant und nachhaltig
                operationalisierbar sind.
              </p>
              <p>
                Von der automatisierten Extraktion unstrukturierter Daten bis
                hin zum Echtzeit-Monitoring von Covenants — dieser Showcase
                bildet den gesamten Lebenszyklus eines kognitiven Projekts ab.
              </p>
            </div>
          </div>

          <div className="bg-[#141414] text-[#E4E3E0] p-8 md:p-12 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center text-2xl font-serif italic">
                  ZK
                </div>
                <div>
                  <h4 className="text-2xl font-serif italic">Karsten Zenk</h4>
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                    CPMAI Expert & AI Architect
                  </p>
                </div>
              </div>
              <div className="space-y-4 font-mono text-xs opacity-80">
                <div className="flex items-center gap-3">
                  <Cpu size={16} className="text-rose-500" />
                  <span>Spezialist für KI-Operationalisierung</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-rose-500" />
                  <span>Fokus auf Daten-Veracity & Forensik</span>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink size={16} className="text-rose-500" />
                  <a
                    href="https://zenk-pm-now.de"
                    className="underline hover:text-rose-400 transition-colors"
                  >
                    zenk-pm-now.de
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                window.open(
                  "https://www.linkedin.com/sharing/share-offsite/?url=" +
                    encodeURIComponent(window.location.href),
                  "_blank"
                )
              }
              className="w-full bg-[#0077B5] text-white py-4 font-mono text-[10px] uppercase tracking-widest hover:bg-[#005a8a] transition-colors flex items-center justify-center gap-3"
            >
              <Linkedin size={16} />
              Share on LinkedIn
            </button>

            <button
              onClick={copyLink}
              className="w-full border border-white/20 py-4 font-mono text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
            >
              {copySuccess ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Link Copied!
                </>
              ) : (
                <>
                  <ExternalLink size={16} />
                  Copy Showcase Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center py-12 border-t border-[#141414] border-opacity-10 gap-6">
          <div className="flex items-center gap-4 opacity-40 grayscale">
            <img
              src="/value-engine-logo.jpeg"
              alt="Logo"
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-mono text-[10px] uppercase tracking-tighter">
              The Symbiotic Value Engine
            </span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">
            &copy; 2026 Karsten Zenk. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-slate-800" size={32} />
          <p className="text-xs uppercase tracking-widest">
            Initialisiere S6-Baseline...
          </p>
        </div>
      </div>
    );
  }

  if (view === "portal") {
    return <Portal />;
  }

  return (
    <div
      id="dashboard-root"
      className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-4 md:p-6 lg:p-12 relative"
    >
      {/* Export Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-[#E4E3E0] no-print">
          <RefreshCw className="animate-spin mb-4" size={48} />
          <h2 className="text-2xl font-serif italic mb-2">Exportiere PDF...</h2>
          <p className="font-mono text-xs opacity-60 uppercase tracking-widest">
            Bitte warten Sie einen Moment
          </p>
          <button
            onClick={() => setIsExporting(false)}
            className="mt-8 border border-white/20 px-4 py-2 font-mono text-[10px] uppercase hover:bg-white/10"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* Export Error Toast */}
      {exportError && (
        <div className="fixed bottom-6 right-6 bg-rose-600 text-white p-4 font-mono text-xs z-[100] shadow-xl flex items-center gap-4 no-print">
          <AlertCircle size={16} />
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} className="underline">
            Schließen
          </button>
        </div>
      )}
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 border-b border-[#141414] pb-6 md:pb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 no-print">
            <button
              onClick={() => setView("portal")}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-4"
            >
              <ChevronRight size={12} className="rotate-180" />
              Zurück zum Portal
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2 no-print">
            <div className="w-3 h-3 bg-rose-600 animate-pulse rounded-full" />
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              Live Data Pipeline Active
            </span>
            <div className="ml-4 flex items-center gap-2 bg-[#141414] text-[#E4E3E0] px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest">
              <Award size={10} className="text-rose-500" />
              CPMAI Methodology Applied
            </div>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif italic tracking-tighter leading-tight">
            S6 Baseline{" "}
            <span className="font-sans not-italic font-bold">Control</span>
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest opacity-60 max-w-md">
            Kontinuierlicher Soll-Ist-Abgleich operativer Unternehmensdaten
            gemäß Sanierungsgutachten.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-end gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 no-print w-full md:w-auto">
            <div className="flex flex-col gap-2">
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className={cn(
                  "group flex items-center justify-center gap-3 border border-[#141414] px-4 sm:px-6 py-3 sm:py-4 rounded-none hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors duration-300 min-h-[44px]",
                  isExporting && "opacity-50 cursor-not-allowed"
                )}
                title="Automatischer PDF-Download"
              >
                <Printer
                  size={18}
                  className={cn(isExporting && "animate-spin")}
                />
                <span className="font-mono text-xs uppercase tracking-widest font-bold">
                  {isExporting ? "Exporting..." : "Export PDF"}
                </span>
              </button>
              <button
                onClick={() => {
                  window.focus();
                  setTimeout(() => window.print(), 200);
                }}
                className="font-mono text-[9px] uppercase tracking-tighter opacity-40 hover:opacity-100 underline text-right mt-1"
              >
                Alternative: Manueller Druck (Strg+P)
              </button>
            </div>

            <button
              onClick={() => setShowBlueprint(!showBlueprint)}
              className="group flex items-center justify-center gap-3 border border-[#141414] px-4 sm:px-6 py-3 sm:py-4 rounded-none hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors duration-300 min-h-[44px]"
            >
              <Info size={18} />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                {showBlueprint ? "Hide Blueprint" : "Show Blueprint"}
              </span>
            </button>

            <button
              onClick={simulateIngestion}
              disabled={isIngesting}
              className="group flex items-center justify-center gap-3 bg-[#141414] text-[#E4E3E0] px-4 sm:px-6 py-3 sm:py-4 rounded-none hover:bg-rose-600 transition-colors duration-300 disabled:opacity-50 no-print min-h-[44px]"
            >
              <Database
                size={18}
                className={cn(isIngesting && "animate-bounce")}
              />
              <span className="font-mono text-xs uppercase tracking-widest font-bold">
                {isIngesting ? "Ingesting SAP_FI..." : "Trigger SAP Pipeline"}
              </span>
            </button>
          </div>

          {/* Logo Section - Absolute Positioned for precision */}
          <div
          className="absolute right-4 sm:right-6 lg:right-12 flex flex-col items-end transition-all duration-500 z-10"
            style={{ top: LOGO_CONFIG.top }}
          >
            <div
              className={cn(
                LOGO_CONFIG.sizeMobile,
                LOGO_CONFIG.sizeDesktop,
                "overflow-hidden flex items-center justify-center min-h-[40px]"
              )}
            >
              <img
                src="/value-engine-logo.jpeg"
                alt="The Symbiotic Value Engine"
                className="w-full h-auto object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  // Show a placeholder if the image fails
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent && !parent.querySelector(".logo-placeholder")) {
                    const placeholder = document.createElement("div");
                    placeholder.className =
                      "logo-placeholder w-full h-full bg-[#141414] rounded-sm flex items-center justify-center text-[8px] text-white font-mono text-center p-2";
                    placeholder.innerText = "LOGO";
                    parent.appendChild(placeholder);
                  }
                }}
              />
            </div>
            <span className="font-mono text-[8px] uppercase tracking-tighter opacity-40 mt-1">
              The Symbiotic Value Engine
            </span>
          </div>
        </div>
      </header>

      {/* Pipeline Blueprint Section (The "Container" for Stakeholders & Data Scientists) */}
      {showBlueprint && (
        <section className="mb-10 md:mb-12 border-2 border-[#141414] p-4 sm:p-6 lg:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Layers className="text-rose-600" />
                <h2 className="text-3xl font-serif italic">
                  Pipeline Blueprint:{" "}
                  <span className="font-sans not-italic font-bold">
                    {selectedPipeline === "structured"
                      ? "Strukturiert (SAP/ERP)"
                      : "Hierarchisch (JSON/API)"}
                  </span>
                </h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => setSelectedPipeline("structured")}
                  className={cn(
                    "px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-[#141414] whitespace-nowrap",
                    selectedPipeline === "structured"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-transparent text-[#141414]"
                  )}
                >
                  01 Structured
                </button>
                <button
                  onClick={() => setSelectedPipeline("hierarchical")}
                  className={cn(
                    "px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-[#141414] whitespace-nowrap",
                    selectedPipeline === "hierarchical"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-transparent text-[#141414]"
                  )}
                >
                  02 Hierarchical
                </button>
                <button
                  onClick={() => setSelectedPipeline("semi-structured")}
                  className={cn(
                    "px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-[#141414] whitespace-nowrap",
                    selectedPipeline === "semi-structured"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-transparent text-[#141414]"
                  )}
                >
                  03 Semi-Structured
                </button>
                <button
                  onClick={() => setSelectedPipeline("unstructured-text")}
                  className={cn(
                    "px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-[#141414] whitespace-nowrap",
                    selectedPipeline === "unstructured-text"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-transparent text-[#141414]"
                  )}
                >
                  04 Unstructured (Text)
                </button>
                <button
                  onClick={() => setSelectedPipeline("unstructured-visual")}
                  className={cn(
                    "px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-[#141414] whitespace-nowrap",
                    selectedPipeline === "unstructured-visual"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-transparent text-[#141414]"
                  )}
                >
                  05 Unstructured (Visual)
                </button>
                <button
                  onClick={() => setSelectedPipeline("streaming")}
                  className={cn(
                    "px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-[#141414] whitespace-nowrap",
                    selectedPipeline === "streaming"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-transparent text-[#141414]"
                  )}
                >
                  06 Streaming
                </button>
              </div>
            </div>

            <div className="flex bg-[#E4E3E0] p-1 rounded-none border border-[#141414] no-print">
              <button
                onClick={() => setPersona("stakeholder")}
                className={cn(
                  "px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all",
                  persona === "stakeholder"
                    ? "bg-[#141414] text-[#E4E3E0]"
                    : "text-[#141414] hover:bg-black/5"
                )}
              >
                Stakeholder View
              </button>
              <button
                onClick={() => setPersona("developer")}
                className={cn(
                  "px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all",
                  persona === "developer"
                    ? "bg-[#141414] text-[#E4E3E0]"
                    : "text-[#141414] hover:bg-black/5"
                )}
              >
                Data Scientist View
              </button>
            </div>
          </div>

          {persona === "stakeholder" ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-4 border-l border-[#141414] pl-6">
                  <div className="flex items-center gap-2 text-rose-600">
                    <BarChart3 size={16} />
                    <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold">
                      Volume (Menge)
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {currentSpec.volume}
                  </p>
                </div>

                <div className="space-y-4 border-l border-[#141414] pl-6">
                  <div className="flex items-center gap-2 text-rose-600">
                    <Clock size={16} />
                    <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold">
                      Velocity (Tempo)
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {currentSpec.velocity}
                  </p>
                </div>

                <div className="space-y-4 border-l border-[#141414] pl-6">
                  <div className="flex items-center gap-2 text-rose-600">
                    <FileJson size={16} />
                    <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold">
                      Variety (Vielfalt)
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {currentSpec.variety}
                  </p>
                </div>

                <div className="space-y-4 border-l border-[#141414] pl-6">
                  <div className="flex items-center gap-2 text-rose-600">
                    <ShieldCheck size={16} />
                    <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold">
                      Veracity (Wahrheit)
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed">
                    {currentSpec.veracity}
                  </p>
                </div>
              </div>

              {selectedPipeline === "unstructured-text" && (
                <div className="bg-[#E4E3E0] p-6 border border-[#141414] border-opacity-10">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-rose-600" />
                    AI Sensemaking Preview (Transparenzbildner)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono opacity-50 uppercase">
                        Input: Rohtext aus PDF
                      </p>
                      <div className="bg-white p-3 text-[11px] font-serif italic leading-relaxed border border-[#141414] border-opacity-5">
                        "...der CO2-Ausstoß des Standorts betrug im
                        Berichtszeitraum insgesamt{" "}
                        <span className="bg-rose-100 px-1">118 Tonnen</span>.
                        Das Audit zum Lieferkettengesetz wurde am 15.03.{" "}
                        <span className="bg-rose-100 px-1">
                          erfolgreich abgeschlossen
                        </span>
                        ..."
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono opacity-50 uppercase">
                        Output: Strukturierte KPIs
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-[#141414] text-white p-2 font-mono text-[10px]">
                          <span>Umwelt (M-ESG-01)</span>
                          <span className="text-emerald-400">
                            118 t CO2 (94% Conf.)
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-[#141414] text-white p-2 font-mono text-[10px]">
                          <span>Governance (M-ESG-02)</span>
                          <span className="text-emerald-400">
                            JA (98% Conf.)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPipeline === "unstructured-visual" && (
                <div className="bg-[#E4E3E0] p-6 border border-[#141414] border-opacity-10">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <Shield size={14} className="text-rose-600" />
                    Visual Audit Trail (Forensik-Transparenzbildner)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono opacity-50 uppercase">
                        Source: Scan Lieferschein #8821
                      </p>
                      <div className="relative bg-white border border-[#141414] border-opacity-10 overflow-hidden aspect-video flex items-center justify-center">
                        <img
                          src="https://picsum.photos/seed/document/400/200?grayscale"
                          alt="Document Scan"
                          className="opacity-40"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-8 border-2 border-rose-600 flex items-center justify-center">
                          <span className="text-rose-600 font-mono text-[8px] font-bold absolute -top-4 left-0">
                            REGION: QTY_TOTAL
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono opacity-50 uppercase">
                        Extraction: Vision-KI Result
                      </p>
                      <div className="bg-[#141414] text-[#E4E3E0] p-4 font-mono space-y-3">
                        <div className="flex justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] opacity-60">
                            Detected Value:
                          </span>
                          <span className="text-emerald-400 font-bold">
                            15.000 Stk.
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                          <span className="text-[10px] opacity-60">
                            Confidence:
                          </span>
                          <span className="text-emerald-400">89%</span>
                        </div>
                        <div className="text-[9px] italic opacity-50 leading-tight">
                          "Die Zahl wurde in der unteren rechten Ecke des
                          Dokuments (Feld 'Gesamtmenge') identifiziert.
                          Handschriftliche Korrektur wurde ignoriert."
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPipeline === "streaming" && (
                <div className="bg-[#E4E3E0] p-6 border border-[#141414] border-opacity-10">
                  <h4 className="font-mono text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <Activity size={14} className="text-rose-600" />
                    Live Stream Decipher (Echtzeit-Transparenzbildner)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono opacity-50 uppercase">
                        Raw Stream: MQTT Payload (IoT)
                      </p>
                      <div className="bg-[#141414] p-3 font-mono text-[9px] text-emerald-500 h-24 overflow-hidden relative">
                        <div className="animate-pulse">
                          {`{"sensor_id": "IOT-44", "val": 121.4, "ts": 1709112344}`}{" "}
                          <br />
                          {`{"sensor_id": "IOT-44", "val": 119.8, "ts": 1709112345}`}{" "}
                          <br />
                          {`{"sensor_id": "IOT-44", "val": 122.1, "ts": 1709112346}`}{" "}
                          <br />
                          {`{"sensor_id": "IOT-44", "val": 118.9, "ts": 1709112347}`}{" "}
                          <br />
                          {`{"sensor_id": "IOT-44", "val": 120.5, "ts": 1709112348}`}{" "}
                          <br />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono opacity-50 uppercase">
                        Aggregation: Sliding Window (5min)
                      </p>
                      <div className="bg-white p-3 border border-[#141414] border-opacity-10 h-24 flex flex-col justify-center">
                        <div className="flex justify-between items-end">
                          <div className="flex gap-1 items-end h-12">
                            {[40, 60, 45, 70, 55, 80, 65, 75].map((h, i) => (
                              <div
                                key={i}
                                className="w-2 bg-rose-600"
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-serif italic text-rose-600">
                              120.2
                            </div>
                            <div className="text-[8px] font-mono uppercase opacity-50">
                              Avg. CO2 Level
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] mt-2 opacity-60 leading-tight">
                          "1.240 Einzelmessungen pro Minute werden geglättet, um
                          kurzfristige Sensor-Ausreißer zu eliminieren."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#141414] border-opacity-20">
                    <th className="text-left py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                      ETL-Phase
                    </th>
                    <th className="text-left py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                      Technische Aktion
                    </th>
                    <th className="text-left py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                      Werkzeuge / Bibliotheken
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentSpec.implementation_steps.map((step, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#141414] border-opacity-10"
                    >
                      <td className="py-4 font-mono text-xs font-bold text-rose-600">
                        {step.step}
                      </td>
                      <td className="py-4 text-sm">{step.action}</td>
                      <td className="py-4">
                        <code className="bg-[#E4E3E0] px-2 py-1 font-mono text-[10px] text-[#141414]">
                          {step.tools}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-[#141414] border-opacity-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                Tech Stack:
              </div>
              <div className="flex gap-2">
                {currentSpec.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="bg-[#141414] text-white text-[9px] font-mono px-2 py-1"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="opacity-50">Status:</span>
              <span className="text-emerald-600 font-bold">
                READY FOR AUTOMATION
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#141414] border border-[#141414] mb-10 md:mb-12">
        {categories.slice(0, 4).map((cat) => {
          const catData = data.filter((d) => d.kategorie === cat);
          const Icon =
            cat === "Finanzen"
              ? BarChart3
              : cat === "Covenant"
              ? Shield
              : cat === "ESG"
              ? Leaf
              : Zap;
          return (
            <div
              key={cat}
              className="bg-[#E4E3E0] p-6 flex flex-col justify-between h-48"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                  {cat}
                </span>
                <Icon size={16} className="opacity-40" />
              </div>
              <div>
                <div className="text-3xl font-serif italic">
                  {catData.length}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest opacity-50">
                  Aktive Maßnahmen
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Detailed Table */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <h2 className="font-serif italic text-2xl">Maßnahmen-Matrix</h2>
            <div className="h-px flex-1 bg-[#141414] opacity-20" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#141414]">
                  <th className="text-left py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    ID
                  </th>
                  <th className="text-left py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    Kategorie
                  </th>
                  <th className="text-left py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    Beschreibung
                  </th>
                  <th className="text-right py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    Soll
                  </th>
                  <th className="text-right py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    Ist
                  </th>
                  <th className="text-right py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    Veracity
                  </th>
                  <th className="text-right py-4 font-mono text-[10px] uppercase tracking-widest opacity-50">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#141414] border-opacity-10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-default"
                  >
                    <td className="py-4 font-mono text-[11px]">
                      {item.massnahme_id}
                    </td>
                    <td className="py-4">
                      <span className="font-mono text-[10px] uppercase px-2 py-1 border border-[#141414] group-hover:border-[#E4E3E0]">
                        {item.kategorie}
                      </span>
                    </td>
                    <td className="py-4 text-sm font-medium">
                      {item.beschreibung}
                    </td>
                    <td className="py-4 text-right font-mono text-xs opacity-60">
                      {formatValue(item.soll_wert, item.metrik_typ)}
                    </td>
                    <td
                      className={cn(
                        "py-4 text-right font-mono text-xs font-bold",
                        getStatusColor(item)
                      )}
                    >
                      {formatValue(item.ist_wert, item.metrik_typ)}
                    </td>
                    <td className="py-4 text-right">
                      {item.confidence ? (
                        <div
                          className="flex items-center justify-end gap-2"
                          title={item.reasoning}
                        >
                          <div className="w-12 h-1.5 bg-slate-200 group-hover:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000",
                                item.confidence > 0.9
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              )}
                              style={{ width: `${item.confidence * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] opacity-60">
                            {(item.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : item.ist_wert !== null ? (
                        <span className="font-mono text-[9px] opacity-30">
                          100% (DET)
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] opacity-10">
                          ---
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {item.ist_wert !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          {item.ist_wert >= item.soll_wert ? (
                            <TrendingUp
                              size={12}
                              className="text-emerald-500"
                            />
                          ) : (
                            <TrendingDown size={12} className="text-rose-500" />
                          )}
                          <span className="font-mono text-[10px]">
                            {Math.abs(
                              ((item.ist_wert - item.soll_wert) /
                                item.soll_wert) *
                                100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] opacity-30">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar / Visualization */}
        <div className="space-y-10 md:space-y-12">
          <section>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="font-serif italic text-2xl">Finanz-Performance</h2>
              <div className="h-px flex-1 bg-[#141414] opacity-20" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.filter(
                    (d) => d.kategorie === "Finanzen" && d.ist_wert !== null
                  )}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#141414"
                    opacity={0.1}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="massnahme_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontFamily: "monospace" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      border: "none",
                      color: "#E4E3E0",
                      fontFamily: "monospace",
                      fontSize: "10px",
                    }}
                    itemStyle={{ color: "#E4E3E0" }}
                  />
                  <Bar dataKey="ist_wert" fill="#141414">
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.ist_wert && entry.ist_wert < entry.soll_wert
                            ? "#E11D48"
                            : "#141414"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-[#141414] text-[#E4E3E0] p-6 md:p-8">
            <h3 className="font-mono text-[10px] uppercase tracking-widest mb-6 opacity-60">
              Pipeline Status
            </h3>
            <div className="space-y-6">
              {[
                {
                  label: "SAP_FI (Strukturiert)",
                  status: "Online",
                  color: "bg-emerald-500",
                },
                {
                  label: "Bank_API (Hierarchisch)",
                  status: "Syncing",
                  color: "bg-amber-500",
                },
                {
                  label: "IoT_Sensors (Semi-Strukturiert)",
                  status: "Offline",
                  color: "bg-rose-500",
                },
                {
                  label: "NLP_Contracts (Unstrukturiert)",
                  status: "Standby",
                  color: "bg-slate-500",
                },
              ].map((pipe) => (
                <div
                  key={pipe.label}
                  className="flex justify-between items-center border-b border-white border-opacity-10 pb-4"
                >
                  <span className="font-mono text-[11px]">{pipe.label}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("w-1.5 h-1.5 rounded-full", pipe.color)}
                    />
                    <span className="font-mono text-[9px] uppercase tracking-tighter opacity-60">
                      {pipe.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="mt-24 pt-8 border-t border-[#141414] border-opacity-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="font-mono text-[10px] uppercase tracking-widest opacity-40">
          S6 Baseline Control Dashboard &copy; 2026
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://www.linkedin.com/in/karsten-zenk/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 flex items-center gap-2"
          >
            <Linkedin size={12} />
            LinkedIn Profile
          </a>
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-60 bg-[#141414] text-[#E4E3E0] px-3 py-1">
            Konzept entwickelt von Karsten Zenk (zenk-pm-now.de)
          </div>
        </div>
      </footer>
    </div>
  );
}
