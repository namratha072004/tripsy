export type TripStatus = "collecting" | "locked";

export interface Trip {
  id: string;
  name: string;
  coordinator_name: string;
  coordinator_token_hash: string;
  share_code: string;
  base_currency: string;
  deadline: string;
  status: TripStatus;
  created_at: string;
}

export interface Participant {
  id: string;
  trip_id: string;
  name: string;
  home_city: string;
  home_airport: string | null;
}

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;
}

export interface Preference {
  id: string;
  participant_id: string;
  trip_id: string;
  budget_amount: number;
  budget_currency: string;
  available_date_ranges: DateRange[];
  destination_type_preferences: string[];
  hard_no_list: string[];
  open_to_abroad: boolean;
  submitted_at: string;
}

export type Fit = "good" | "stretch" | "no";
export type BudgetStatus = "ok" | "stretch" | "over" | "unknown";

export interface FareEstimate {
  status: "ok" | "unavailable";
  amount: number | null; // round trip, in `currency`
  currency: string;
  note?: string;
}

export interface PersonBreakdown {
  participantId: string;
  name: string;
  fit: Fit;
  score: number; // 0–100
  dates: boolean | null; // null = no common window to check against
  typeMatch: boolean;
  hardNo: string | null; // the hard-no entry that matched, if any
  abroadBlocked?: boolean; // international trip, but they said India only
  budget: BudgetStatus;
  flightCost: number | null;
  budgetAmount: number;
  reasons: string[];
}

export interface ScoreBreakdown {
  window: { start: string; end: string; available: number; total: number } | null;
  people: PersonBreakdown[];
  weights: { dates: number; type: number; budget: number };
}

export interface Candidate {
  id: string;
  trip_id: string;
  destination_name: string;
  destination_airport: string | null;
  destination_type: string | null;
  est_flight_cost_by_participant: Record<string, FareEstimate>;
  fits_dates_by_participant: Record<string, boolean | null>;
  score_breakdown: ScoreBreakdown;
  overall_score: number;
  generated_at: string;
}

export interface Decision {
  id: string;
  trip_id: string;
  locked_destination_id: string;
  locked_at: string;
  locked_by: string;
}

export interface DecisionEvent {
  id: string;
  trip_id: string;
  event: "locked" | "reopened" | "deadline_changed";
  destination_name: string | null;
  actor: string;
  reason: string | null;
  created_at: string;
}
