import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { BallEvent, MatchState, Player, Team } from '../types';
import { computeInnings, isOverComplete, shouldRotateStrike } from '../lib/scoring';

const STORAGE_KEY = 'cricket-voice-scorer:match';

function uid(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export type MatchAction =
  | { type: 'SETUP'; teams: [Team, Team]; oversLimit: number }
  | { type: 'SET_STRIKER'; playerId?: string }
  | { type: 'SET_NON_STRIKER'; playerId?: string }
  | { type: 'SET_BOWLER'; playerId?: string }
  | { type: 'SWAP_STRIKE' }
  | { type: 'COMMIT_BALL'; event: Omit<BallEvent, 'id' | 'timestamp'> }
  | { type: 'UNDO_LAST' }
  | { type: 'END_INNINGS' }
  | { type: 'RESET' };

export function makePlayer(name: string): Player {
  return { id: uid('p_'), name: name.trim() };
}

export function makeTeam(name: string, players: string[]): Team {
  return {
    id: uid('t_'),
    name: name.trim() || 'Team',
    players: players
      .map((n) => n.trim())
      .filter(Boolean)
      .map(makePlayer),
  };
}

function emptyMatch(): MatchState {
  const teamA = makeTeam('Team A', []);
  const teamB = makeTeam('Team B', []);
  return {
    id: uid('m_'),
    createdAt: Date.now(),
    teams: [teamA, teamB],
    oversLimit: 20,
    currentInningsIndex: 0,
    innings: [
      { battingTeamId: teamA.id, bowlingTeamId: teamB.id, events: [] },
      { battingTeamId: teamB.id, bowlingTeamId: teamA.id, events: [] },
    ],
    status: 'setup',
  };
}

function reducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'SETUP': {
      const [teamA, teamB] = action.teams;
      return {
        ...state,
        id: uid('m_'),
        createdAt: Date.now(),
        teams: action.teams,
        oversLimit: action.oversLimit,
        currentInningsIndex: 0,
        innings: [
          { battingTeamId: teamA.id, bowlingTeamId: teamB.id, events: [] },
          { battingTeamId: teamB.id, bowlingTeamId: teamA.id, events: [] },
        ],
        strikerId: teamA.players[0]?.id,
        nonStrikerId: teamA.players[1]?.id,
        bowlerId: teamB.players[0]?.id,
        status: 'live',
      };
    }

    case 'SET_STRIKER':
      return { ...state, strikerId: action.playerId };
    case 'SET_NON_STRIKER':
      return { ...state, nonStrikerId: action.playerId };
    case 'SET_BOWLER':
      return { ...state, bowlerId: action.playerId };

    case 'SWAP_STRIKE':
      return { ...state, strikerId: state.nonStrikerId, nonStrikerId: state.strikerId };

    case 'COMMIT_BALL': {
      const idx = state.currentInningsIndex;
      const innings = state.innings[idx];
      const fullEvent: BallEvent = {
        ...action.event,
        id: uid('b_'),
        timestamp: Date.now(),
      };
      const newInnings = { ...innings, events: [...innings.events, fullEvent] };
      const nextInningsArr = [...state.innings] as MatchState['innings'];
      nextInningsArr[idx] = newInnings;

      // Strike rotation: odd runs swap; end of over swaps as well.
      let striker = state.strikerId;
      let nonStriker = state.nonStrikerId;
      if (shouldRotateStrike(fullEvent)) {
        [striker, nonStriker] = [nonStriker, striker];
      }
      const summary = computeInnings(newInnings, state.teams);
      if (fullEvent.isLegalDelivery && isOverComplete(summary.legalBalls)) {
        [striker, nonStriker] = [nonStriker, striker];
      }
      // If the striker is out, they must be replaced manually via the UI.
      if (fullEvent.isWicket) {
        const outId = fullEvent.outPlayerId ?? fullEvent.strikerId;
        if (outId === striker) striker = undefined;
      }

      return {
        ...state,
        innings: nextInningsArr,
        strikerId: striker,
        nonStrikerId: nonStriker,
      };
    }

    case 'UNDO_LAST': {
      const idx = state.currentInningsIndex;
      const innings = state.innings[idx];
      if (innings.events.length === 0) return state;
      const events = innings.events.slice(0, -1);
      const nextInningsArr = [...state.innings] as MatchState['innings'];
      nextInningsArr[idx] = { ...innings, events };
      return { ...state, innings: nextInningsArr };
    }

    case 'END_INNINGS': {
      if (state.currentInningsIndex === 0) {
        const second = state.innings[1];
        return {
          ...state,
          currentInningsIndex: 1,
          strikerId: state.teams.find((t) => t.id === second.battingTeamId)?.players[0]?.id,
          nonStrikerId: state.teams.find((t) => t.id === second.battingTeamId)?.players[1]?.id,
          bowlerId: state.teams.find((t) => t.id === second.bowlingTeamId)?.players[0]?.id,
        };
      }
      return { ...state, status: 'complete' };
    }

    case 'RESET':
      return emptyMatch();

    default:
      return state;
  }
}

function loadInitial(): MatchState {
  if (typeof window === 'undefined') return emptyMatch();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMatch();
    const parsed = JSON.parse(raw) as MatchState;
    if (parsed && Array.isArray(parsed.teams) && parsed.innings) return parsed;
  } catch {
    /* ignore corrupt storage */
  }
  return emptyMatch();
}

interface MatchContextValue {
  state: MatchState;
  dispatch: React.Dispatch<MatchAction>;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used within a MatchProvider');
  return ctx;
}
