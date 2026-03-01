import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("s6_baseline.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS baseline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    datum TEXT,
    kategorie TEXT,
    sub_kategorie TEXT,
    massnahme_id TEXT,
    metrik_typ TEXT,
    soll_wert REAL,
    beschreibung TEXT,
    system_ist_quelle TEXT
  );

  CREATE TABLE IF NOT EXISTS actual_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    baseline_id INTEGER,
    datum TEXT,
    ist_wert REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(baseline_id) REFERENCES baseline(id)
  );
`);

// Seed Baseline Data if empty
const rowCount = db.prepare("SELECT count(*) as count FROM baseline").get() as {
  count: number;
};
if (rowCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO baseline (datum, kategorie, sub_kategorie, massnahme_id, metrik_typ, soll_wert, beschreibung, system_ist_quelle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialData = [
    [
      "2026-03-01",
      "Finanzen",
      "Umsatz",
      "BASE",
      "EUR",
      12500000,
      "Geplanter Basis-Umsatz",
      "SAP_FI",
    ],
    [
      "2026-03-01",
      "Finanzen",
      "Personalaufwand",
      "M-FIN-01",
      "EUR",
      -320000,
      "Reduktion Personalkosten",
      "SAP_HR",
    ],
    [
      "2026-03-01",
      "Finanzen",
      "Sachkosten",
      "M-FIN-02",
      "EUR",
      -180000,
      "Strikter Einkaufsstopp Berater",
      "SAP_MM",
    ],
    [
      "2026-03-01",
      "Covenant",
      "Liquiditaet",
      "COV-01",
      "EUR",
      4500000,
      "Harte Untergrenze Bankkonto",
      "Bank_API",
    ],
    [
      "2026-03-01",
      "Covenant",
      "Eigenkapitalquote",
      "COV-02",
      "Prozent",
      15.5,
      "Minimales Eigenkapital",
      "SAP_FI",
    ],
    [
      "2026-03-31",
      "Operations",
      "Standort",
      "M-OP-01",
      "Boolean",
      1,
      "Schließung Werk B abgeschlossen",
      "SAP_MM_Obligo",
    ],
    [
      "2026-03-31",
      "Operations",
      "Headcount",
      "M-OP-02",
      "FTE",
      450,
      "Maximaler Personalbestand (Köpfe)",
      "Workday",
    ],
    [
      "2026-03-31",
      "ESG",
      "Umwelt",
      "M-ESG-01",
      "Tonnen_CO2",
      120,
      "Maximaler CO2-Ausstoß Scope 1+2",
      "IoT_Sensors",
    ],
    [
      "2026-03-31",
      "ESG",
      "Governance",
      "M-ESG-02",
      "Boolean",
      1,
      "Lieferkettengesetz-Audit bestanden",
      "Compliance_Tool",
    ],
    [
      "2026-03-31",
      "Cyber_Security",
      "Infrastruktur",
      "M-CYB-01",
      "Boolean",
      1,
      "Penetration-Test IT-Netzwerk extern",
      "Jira_SecOps",
    ],
    [
      "2026-03-31",
      "Cyber_Security",
      "Verfuegbarkeit",
      "M-CYB-02",
      "Prozent",
      99.9,
      "Uptime geschäftskritische Systeme",
      "AWS_CloudWatch",
    ],
    [
      "2026-04-01",
      "Finanzen",
      "Liquiditaet",
      "BASE",
      "EUR",
      4100000,
      "Geplanter Cash-Bestand",
      "SAP_FI",
    ],
    [
      "2026-04-01",
      "Operations",
      "Produktion",
      "M-OP-03",
      "Stueck",
      15000,
      "Mindestproduktionsmenge",
      "MES_System",
    ],
  ];

  for (const row of initialData) {
    insert.run(...row);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/dashboard", (req, res) => {
    const data = db
      .prepare(
        `
      SELECT 
        b.*, 
        a.ist_wert, 
        a.timestamp as last_update
      FROM baseline b
      LEFT JOIN (
        SELECT baseline_id, ist_wert, timestamp
        FROM actual_data
        WHERE id IN (SELECT MAX(id) FROM actual_data GROUP BY baseline_id)
      ) a ON b.id = a.baseline_id
    `
      )
      .all() as any[];

    // Add mock confidence for unstructured/semi-structured categories to simulate NLP/AI veracity
    const enrichedData = data.map((item) => {
      if (["ESG", "Cyber_Security"].includes(item.kategorie)) {
        return {
          ...item,
          confidence:
            item.ist_wert !== null ? 0.85 + Math.random() * 0.1 : undefined,
          reasoning:
            item.ist_wert !== null
              ? "Extrahiert via NLP aus Statusbericht Q1/2026."
              : undefined,
        };
      }
      return item;
    });

    res.json(enrichedData);
  });

  // Simulate Data Ingestion Pipeline
  app.post("/api/ingest", (req, res) => {
    const { massnahme_id, ist_wert, datum } = req.body;

    const baseline = db
      .prepare("SELECT id FROM baseline WHERE massnahme_id = ?")
      .get(massnahme_id) as { id: number } | undefined;

    if (!baseline) {
      return res.status(404).json({ error: "Baseline measure not found" });
    }

    db.prepare(
      `
      INSERT INTO actual_data (baseline_id, datum, ist_wert)
      VALUES (?, ?, ?)
    `
    ).run(
      baseline.id,
      datum || new Date().toISOString().split("T")[0],
      ist_wert
    );

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = parseInt(process.env.PORT || "3000", 10);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
