// Tipos del dominio — Seagate Mundial 2026

export type Phase =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchStatus = "upcoming" | "live" | "finished";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  predictions_count: number;
  correct_results: number;
  exact_scores: number;
  created_at: string;
};

export type Team = {
  id: number;
  name: string;
  flag_emoji: string;
  group_name: string;
  confederation: string;
};

export type Match = {
  id: number;
  home_team_id: number | null;
  away_team_id: number | null;
  home_team: Team | null;
  away_team: Team | null;
  match_date: string;
  venue: string;
  city: string;
  phase: Phase;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  bracket_code?: string | null;
  home_source?: string | null;
  away_source?: string | null;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: number;
  pred_home: number;
  pred_away: number;
  pred_winner_team_id: number | null;
  points_earned: number | null;
  created_at: string;
  updated_at: string;
  match?: Match;
  profile?: Profile;
};

export type LeaderboardEntry = {
  rank: number;
  profile: Profile;
};

// Etiquetas legibles de cada fase
export const PHASE_LABELS: Record<Phase, string> = {
  group: "Grupos",
  round_of_32: "Dieciseisavos",
  round_of_16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinal",
  third_place: "3er puesto",
  final: "Final",
};

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;
