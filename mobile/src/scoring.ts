import type {
  BallEvent,
  BattingLine,
  BowlingLine,
  Innings,
  InningsSummary,
  Team,
} from './types';

/** Format legal-ball count as cricket overs, e.g. 13 balls -> "2.1". */
export function ballsToOvers(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Does this delivery credit the striker with a ball faced? */
function isBallFaced(e: BallEvent): boolean {
  // Wides are not faced by the striker. Byes/leg-byes off a legal ball are faced.
  if (e.extra === 'wide') return false;
  return e.isLegalDelivery;
}

/** Runs charged to the bowler for this delivery. */
function runsChargedToBowler(e: BallEvent): number {
  // Byes and leg-byes are not charged to the bowler.
  const batAndPenalty =
    e.extra === 'bye' || e.extra === 'legbye' ? 0 : e.runs;
  return batAndPenalty + e.extraRuns;
}

/** Runs that count toward the batting team total (everything). */
function runsToTeamTotal(e: BallEvent): number {
  return e.runs + e.extraRuns;
}

/** Runs credited to the striker personally (off the bat only). */
function runsToBatsman(e: BallEvent): number {
  if (e.extra === 'bye' || e.extra === 'legbye' || e.extra === 'wide')
    return 0;
  return e.runs;
}

const nameLookup = (teams: [Team, Team]) => {
  const map = new Map<string, string>();
  for (const t of teams) for (const p of t.players) map.set(p.id, p.name);
  return (id: string) => map.get(id) ?? 'Unknown';
};

/**
 * Compute the full derived summary for an innings from its committed events.
 */
export function computeInnings(
  innings: Innings,
  teams: [Team, Team],
): InningsSummary {
  const nameOf = nameLookup(teams);
  const battingTeam = teams.find((t) => t.id === innings.battingTeamId);
  const bowlingTeam = teams.find((t) => t.id === innings.bowlingTeamId);

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;
  let extras = 0;

  const batMap = new Map<string, BattingLine>();
  const bowlMap = new Map<string, BowlingLine>();

  const ensureBat = (id: string): BattingLine => {
    let line = batMap.get(id);
    if (!line) {
      line = {
        playerId: id,
        name: nameOf(id),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        strikeRate: 0,
      };
      batMap.set(id, line);
    }
    return line;
  };
  const ensureBowl = (id: string): BowlingLine => {
    let line = bowlMap.get(id);
    if (!line) {
      line = {
        playerId: id,
        name: nameOf(id),
        legalBalls: 0,
        runsConceded: 0,
        wickets: 0,
        economy: 0,
      };
      bowlMap.set(id, line);
    }
    return line;
  };

  // Seed opening batters so the scorecard shows them at 0 even before a run.
  for (const p of battingTeam?.players.slice(0, 2) ?? []) ensureBat(p.id);

  for (const e of innings.events) {
    totalRuns += runsToTeamTotal(e);
    if (e.extra) extras += e.extraRuns + (e.extra === 'bye' || e.extra === 'legbye' ? e.runs : 0);
    if (e.isLegalDelivery) legalBalls += 1;
    if (e.isWicket) wickets += 1;

    if (e.strikerId) {
      const line = ensureBat(e.strikerId);
      line.runs += runsToBatsman(e);
      if (isBallFaced(e)) line.balls += 1;
      if (runsToBatsman(e) === 4) line.fours += 1;
      if (runsToBatsman(e) === 6) line.sixes += 1;
    }

    if (e.isWicket) {
      const outId = e.outPlayerId ?? e.strikerId;
      if (outId) {
        const line = ensureBat(outId);
        line.isOut = true;
        line.dismissal = describeDismissal(e, nameOf);
      }
    }

    if (e.bowlerId) {
      const line = ensureBowl(e.bowlerId);
      if (e.isLegalDelivery) line.legalBalls += 1;
      line.runsConceded += runsChargedToBowler(e);
      if (e.isWicket && e.dismissalType !== 'runout') line.wickets += 1;
    }
  }

  const batting = [...batMap.values()].map((l) => ({
    ...l,
    strikeRate: l.balls > 0 ? round((l.runs / l.balls) * 100, 1) : 0,
  }));
  const bowling = [...bowlMap.values()].map((l) => ({
    ...l,
    economy:
      l.legalBalls > 0
        ? round(l.runsConceded / (l.legalBalls / 6), 2)
        : 0,
  }));

  const runRate = legalBalls > 0 ? round(totalRuns / (legalBalls / 6), 2) : 0;

  void bowlingTeam; // reserved for future UI
  return {
    battingTeamId: innings.battingTeamId,
    bowlingTeamId: innings.bowlingTeamId,
    totalRuns,
    wickets,
    legalBalls,
    extras,
    oversText: ballsToOvers(legalBalls),
    runRate,
    batting,
    bowling,
  };
}

function describeDismissal(
  e: BallEvent,
  nameOf: (id: string) => string,
): string {
  switch (e.dismissalType) {
    case 'bowled':
      return `b ${e.bowlerId ? nameOf(e.bowlerId) : ''}`.trim();
    case 'lbw':
      return `lbw b ${e.bowlerId ? nameOf(e.bowlerId) : ''}`.trim();
    case 'caught':
      return `c & b ${e.bowlerId ? nameOf(e.bowlerId) : ''}`.trim();
    case 'stumped':
      return `st b ${e.bowlerId ? nameOf(e.bowlerId) : ''}`.trim();
    case 'runout':
      return 'run out';
    default:
      return 'out';
  }
}

/** True once the last legal ball of the over has been bowled. */
export function isOverComplete(legalBalls: number): boolean {
  return legalBalls > 0 && legalBalls % 6 === 0;
}

/** Odd runs off the bat rotate the strike. */
export function shouldRotateStrike(e: BallEvent): boolean {
  return runsToBatsman(e) % 2 === 1;
}

// ---- Diff preview for the approve flow ------------------------------------

export interface StatChange {
  label: string;
  before: string | number;
  after: string | number;
}

/**
 * Produce a human readable list of the changes a candidate ball would make,
 * by comparing the innings summary before and after applying the event.
 */
export function previewChanges(
  innings: Innings,
  teams: [Team, Team],
  candidate: BallEvent,
): StatChange[] {
  const before = computeInnings(innings, teams);
  const after = computeInnings(
    { ...innings, events: [...innings.events, candidate] },
    teams,
  );
  const nameOf = nameLookup(teams);
  const changes: StatChange[] = [];

  const battingTeam = teams.find((t) => t.id === innings.battingTeamId);
  const teamName = battingTeam?.name ?? 'Team';

  changes.push({
    label: `${teamName} score`,
    before: `${before.totalRuns}/${before.wickets}`,
    after: `${after.totalRuns}/${after.wickets}`,
  });
  changes.push({
    label: 'Overs',
    before: before.oversText,
    after: after.oversText,
  });

  const findBat = (s: InningsSummary, id?: string) =>
    id ? s.batting.find((b) => b.playerId === id) : undefined;
  const findBowl = (s: InningsSummary, id?: string) =>
    id ? s.bowling.find((b) => b.playerId === id) : undefined;

  if (candidate.strikerId) {
    const b0 = findBat(before, candidate.strikerId);
    const b1 = findBat(after, candidate.strikerId);
    changes.push({
      label: `${nameOf(candidate.strikerId)} (batting)`,
      before: `${b0?.runs ?? 0} (${b0?.balls ?? 0})`,
      after: `${b1?.runs ?? 0} (${b1?.balls ?? 0})`,
    });
  }

  if (candidate.bowlerId) {
    const w0 = findBowl(before, candidate.bowlerId);
    const w1 = findBowl(after, candidate.bowlerId);
    changes.push({
      label: `${nameOf(candidate.bowlerId)} (bowling)`,
      before: `${ballsToOvers(w0?.legalBalls ?? 0)} ov, ${
        w0?.runsConceded ?? 0
      } r, ${w0?.wickets ?? 0} w`,
      after: `${ballsToOvers(w1?.legalBalls ?? 0)} ov, ${
        w1?.runsConceded ?? 0
      } r, ${w1?.wickets ?? 0} w`,
    });
  }

  if (candidate.isWicket) {
    const outId = candidate.outPlayerId ?? candidate.strikerId;
    changes.push({
      label: 'Wicket',
      before: '—',
      after: outId ? `${nameOf(outId)} out` : 'out',
    });
  }

  if (candidate.extra) {
    changes.push({
      label: 'Extra',
      before: '—',
      after: `${candidate.extra} +${candidate.extraRuns + candidate.runs}`,
    });
  }

  return changes;
}
