export interface BaselineEntry {
  id?: number;
  datum: string;
  kategorie: string;
  sub_kategorie: string;
  massnahme_id: string;
  metrik_typ: string;
  soll_wert: number;
  beschreibung: string;
  system_ist_quelle: string;
}

export interface ActualEntry {
  id?: number;
  baseline_id: number;
  datum: string;
  ist_wert: number;
  timestamp: string;
}

export interface PipelineSpec {
  volume: string;
  velocity: string;
  variety: string;
  veracity: string;
  description_short: string;
  tech_stack: string[];
  implementation_steps: {
    step: string;
    action: string;
    tools: string;
  }[];
}

export interface DashboardData extends BaselineEntry {
  ist_wert: number | null;
  last_update: string | null;
  status: "ok" | "warning" | "critical" | "pending";
  confidence?: number; // 0 to 1
  reasoning?: string;
}
