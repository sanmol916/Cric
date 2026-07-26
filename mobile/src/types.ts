// Core domain types. Scoring is event-sourced: the source of truth is the list
// of committed BallEvents per innings; all figures are derived from them.

export type PlayerId = string;
export type TeamId = string;

export interface Player {
  id: PlayerId;
  name: string;
  /** Optional local URI to a player photo; falls back to a generated avatar. */
  photoUri?: string;
}

export interface Team {
  id: TeamId;
  name: string;
  /** Optional 3-4 letter code shown on compact scoreboards, e.g. "RCB". */
  shortName?: string;
  /** Optional local URI to a team logo; falls back to a generated avatar. */
  logoUri?: string;
  players: Player[];
}

export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | null;

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'runout'
  | 'stumped'
  | 'other';

export interface BallEvent {
  id: string;
  strikerId?: PlayerId;
  nonStrikerId?: PlayerId;
  bowlerId?: PlayerId;
  runs: number;
  extra: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  dismissalType?: DismissalType;
  outPlayerId?: PlayerId;
  isLegalDelivery: boolean;
  timestamp: number;
  transcript?: string;
}

export interface Innings {
  battingTeamId: TeamId;
  bowlingTeamId: TeamId;
  events: BallEvent[];
}

export type MatchStatus = 'setup' | 'live' | 'complete';

export interface MatchState {
  id: string;
  createdAt: number;
  updatedAt: number;
  teams: [Team, Team];
  oversLimit: number;
  currentInningsIndex: 0 | 1;
  innings: [Innings, Innings];
  strikerId?: PlayerId;
  nonStrikerId?: PlayerId;
  bowlerId?: PlayerId;
  status: MatchStatus;
}

export interface BattingLine {
  playerId: PlayerId;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal?: string;
  strikeRate: number;
}

export interface BowlingLine {
  playerId: PlayerId;
  name: string;
  legalBalls: number;
  runsConceded: number;
  wickets: number;
  economy: number;
}

export interface InningsSummary {
  battingTeamId: TeamId;
  bowlingTeamId: TeamId;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  extras: number;
  oversText: string;
  runRate: number;
  batting: BattingLine[];
  bowling: BowlingLine[];
}
