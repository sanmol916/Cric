import type { InningsSummary, MatchState, Team } from '../types';

interface Props {
  state: MatchState;
  summary: InningsSummary;
  battingTeam: Team;
}

export function Scoreboard({ state, summary, battingTeam }: Props) {
  const crr = summary.runRate.toFixed(2);
  const isChase = state.currentInningsIndex === 1;

  let target = 0;
  let rrr = '0.00';
  let toWin = 0;
  if (isChase) {
    const firstInnings = state.innings[0];
    const firstTotal = firstInnings.events.reduce(
      (sum, e) => sum + e.runs + e.extraRuns,
      0,
    );
    target = firstTotal + 1;
    toWin = target - summary.totalRuns;
    const ballsLeft = state.oversLimit * 6 - summary.legalBalls;
    rrr = ballsLeft > 0 ? ((toWin / ballsLeft) * 6).toFixed(2) : '—';
  }

  return (
    <div className="scoreboard">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="sb-team">{battingTeam.name} batting</div>
        <span className="badge live">
          {state.status === 'complete' ? 'Match Over' : `LIVE · Innings ${state.currentInningsIndex + 1}`}
        </span>
      </div>

      <div className="sb-score">
        {summary.totalRuns}
        <small>/{summary.wickets}</small>
      </div>

      <div className="sb-meta">
        <div className="stat">
          <b>
            {summary.oversText} <span style={{ color: 'var(--text-3)' }}>/ {state.oversLimit}</span>
          </b>
          <span>Overs</span>
        </div>
        <div className="stat">
          <b>{crr}</b>
          <span>Run rate</span>
        </div>
        <div className="stat">
          <b>{summary.extras}</b>
          <span>Extras</span>
        </div>
      </div>

      {isChase && state.status !== 'complete' && (
        <div className="sb-target">
          Target <b>{target}</b> · needs <b>{Math.max(0, toWin)}</b> runs · Req. rate <b>{rrr}</b>
        </div>
      )}
    </div>
  );
}
