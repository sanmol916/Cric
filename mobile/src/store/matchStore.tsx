import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BallEvent, MatchState, Player, Team } from '../types';
import { computeInnings, isOverComplete, shouldRotateStrike } from '../scoring';

const CURRENT_KEY = 'cric:current-match';
const HISTORY_KEY = 'cric:match-history';

export function uid(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function makePlayer(name: string): Player {
  return { id: uid('p_'), name: name.trim() };
}

export function makeTeam(name: string, players: string[]): Team {
  return {
    id: uid('t_'),
    name: name.trim() || 'Team',
    players: players.map((n) => n.trim()).filter(Boolean).map(makePlayer),
  };
}

export type MatchAction =
  | { type: 'HYDRATE'; state: MatchState }
  | { type: 'SETUP'; teams: [Team, Team]; oversLimit: number }
  | { type: 'SET_STRIKER'; playerId?: string }
  | { type: 'SET_NON_STRIKER'; playerId?: string }
  | { type: 'SET_BOWLER'; playerId?: string }
  | { type: 'SWAP_STRIKE' }
  | { type: 'COMMIT_BALL'; event: Omit<BallEvent, 'id' | 'timestamp'> }
  | { type: 'UNDO_LAST' }
  | { type: 'END_INNINGS' }
  | { type: 'RESET' };

export function emptyMatch(): MatchState {
  const teamA = makeTeam('Team A', []);
  const teamB = makeTeam('Team B', []);
  const now = Date.now();
  return {
    id: uid('m_'),
    createdAt: now,
    updatedAt: now,
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
    case 'HYDRATE':
      return action.state;

    case 'SETUP': {
      const [teamA, teamB] = action.teams;
      const now = Date.now();
      return {
        ...state,
        id: uid('m_'),
        createdAt: now,
        updatedAt: now,
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
      return { ...state, strikerId: action.playerId, updatedAt: Date.now() };
    case 'SET_NON_STRIKER':
      return { ...state, nonStrikerId: action.playerId, updatedAt: Date.now() };
    case 'SET_BOWLER':
      return { ...state, bowlerId: action.playerId, updatedAt: Date.now() };

    case 'SWAP_STRIKE':
      return {
        ...state,
        strikerId: state.nonStrikerId,
        nonStrikerId: state.strikerId,
        updatedAt: Date.now(),
      };

    case 'COMMIT_BALL': {
      const idx = state.currentInningsIndex;
      const innings = state.innings[idx];
      const fullEvent: BallEvent = {
        ...action.event,
        id: uid('b_'),
        timestamp: Date.now(),
      };
      const newInnings = { ...innings, events: [...innings.events, fullEvent] };
      const nextInnings = [...state.innings] as MatchState['innings'];
      nextInnings[idx] = newInnings;

      let striker = state.strikerId;
      let nonStriker = state.nonStrikerId;
      if (shouldRotateStrike(fullEvent)) {
        [striker, nonStriker] = [nonStriker, striker];
      }
      const summary = computeInnings(newInnings, state.teams);
      if (fullEvent.isLegalDelivery && isOverComplete(summary.legalBalls)) {
        [striker, nonStriker] = [nonStriker, striker];
      }
      if (fullEvent.isWicket) {
        const outId = fullEvent.outPlayerId ?? fullEvent.strikerId;
        if (outId === striker) striker = undefined;
      }

      return {
        ...state,
        innings: nextInnings,
        strikerId: striker,
        nonStrikerId: nonStriker,
        updatedAt: Date.now(),
      };
    }

    case 'UNDO_LAST': {
      const idx = state.currentInningsIndex;
      const innings = state.innings[idx];
      if (innings.events.length === 0) return state;
      const nextInnings = [...state.innings] as MatchState['innings'];
      nextInnings[idx] = { ...innings, events: innings.events.slice(0, -1) };
      return { ...state, innings: nextInnings, updatedAt: Date.now() };
    }

    case 'END_INNINGS': {
      if (state.currentInningsIndex === 0) {
        const second = state.innings[1];
        const bat = state.teams.find((t) => t.id === second.battingTeamId);
        const bowl = state.teams.find((t) => t.id === second.bowlingTeamId);
        return {
          ...state,
          currentInningsIndex: 1,
          strikerId: bat?.players[0]?.id,
          nonStrikerId: bat?.players[1]?.id,
          bowlerId: bowl?.players[0]?.id,
          updatedAt: Date.now(),
        };
      }
      return { ...state, status: 'complete', updatedAt: Date.now() };
    }

    case 'RESET':
      return emptyMatch();

    default:
      return state;
  }
}

// ---- History helpers -------------------------------------------------------

export async function loadHistory(): Promise<MatchState[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MatchState[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function archiveMatch(match: MatchState): Promise<void> {
  try {
    const history = await loadHistory();
    const without = history.filter((m) => m.id !== match.id);
    const next = [match, ...without].slice(0, 50);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

// ---- Context ---------------------------------------------------------------

interface MatchContextValue {
  state: MatchState;
  dispatch: React.Dispatch<MatchAction>;
  hydrated: boolean;
}

const MatchContext = createContext<MatchContextValue | null>(null);

export function MatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, emptyMatch);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted match once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CURRENT_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw) as MatchState;
          if (parsed && Array.isArray(parsed.teams) && parsed.innings) {
            dispatch({ type: 'HYDRATE', state: parsed });
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist current match on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CURRENT_KEY, JSON.stringify(state)).catch(() => {});
    if (state.status === 'complete') archiveMatch(state);
  }, [state, hydrated]);

  const value = useMemo(() => ({ state, dispatch, hydrated }), [state, hydrated]);
  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

export function useMatch(): MatchContextValue {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used within a MatchProvider');
  return ctx;
}
