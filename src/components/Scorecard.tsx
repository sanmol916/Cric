import type { InningsSummary, MatchState } from '../types';
import { ballsToOvers } from '../lib/scoring';

interface Props {
  summary: InningsSummary;
  state: MatchState;
}

export function Scorecard({ summary, state }: Props) {
  const batters = summary.batting.filter(
    (b) => b.balls > 0 || b.isOut || b.playerId === state.strikerId || b.playerId === state.nonStrikerId,
  );
  const bowlers = summary.bowling.filter((b) => b.legalBalls > 0 || b.runsConceded > 0);

  return (
    <div className="grid grid-2">
      <div className="card card-pad">
        <h3 className="card-title">Batting</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Batter</th>
              <th>R</th>
              <th>B</th>
              <th>4s</th>
              <th>6s</th>
              <th>SR</th>
            </tr>
          </thead>
          <tbody>
            {batters.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No batters yet
                </td>
              </tr>
            )}
            {batters.map((b) => {
              const onStrike = b.playerId === state.strikerId;
              const atCrease = onStrike || b.playerId === state.nonStrikerId;
              return (
                <tr key={b.playerId} className={onStrike ? 'active' : undefined}>
                  <td>
                    {b.name}
                    {onStrike && !b.isOut && <span className="striker-dot">*</span>}
                    {b.isOut && <div className="out">{b.dismissal}</div>}
                    {!b.isOut && atCrease && <div className="out" style={{ color: 'var(--text-2)' }}>not out</div>}
                  </td>
                  <td>{b.runs}</td>
                  <td>{b.balls}</td>
                  <td>{b.fours}</td>
                  <td>{b.sixes}</td>
                  <td>{b.strikeRate.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card card-pad">
        <h3 className="card-title">Bowling</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Bowler</th>
              <th>O</th>
              <th>R</th>
              <th>W</th>
              <th>Econ</th>
            </tr>
          </thead>
          <tbody>
            {bowlers.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No bowlers yet
                </td>
              </tr>
            )}
            {bowlers.map((b) => {
              const bowling = b.playerId === state.bowlerId;
              return (
                <tr key={b.playerId} className={bowling ? 'active' : undefined}>
                  <td>
                    {b.name}
                    {bowling && <span className="striker-dot">*</span>}
                  </td>
                  <td>{ballsToOvers(b.legalBalls)}</td>
                  <td>{b.runsConceded}</td>
                  <td>{b.wickets}</td>
                  <td>{b.economy.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CommentaryProps {
  state: MatchState;
}

export function Commentary({ state }: CommentaryProps) {
  const innings = state.innings[state.currentInningsIndex];
  const nameOf = (id?: string) => {
    if (!id) return '';
    for (const t of state.teams) {
      const p = t.players.find((pl) => pl.id === id);
      if (p) return p.name;
    }
    return '';
  };

  const rows = [...innings.events].reverse();

  return (
    <div className="card card-pad">
      <h3 className="card-title">Ball by ball</h3>
      {rows.length === 0 ? (
        <p className="muted">No deliveries recorded yet.</p>
      ) : (
        <div className="commentary">
          {rows.map((e, i) => {
            const ballNo = innings.events.length - i;
            const runs = e.runs;
            let outClass = 'comm-out';
            let label: string = String(runs + e.extraRuns);
            if (e.isWicket) {
              outClass += ' wkt';
              label = 'W';
            } else if (e.extra === 'wide') label = 'wd';
            else if (e.extra === 'noball') label = 'nb';
            else if (runs === 4) outClass += ' boundary';
            else if (runs === 6) outClass += ' six';

            const parts: string[] = [];
            if (e.bowlerId) parts.push(`${nameOf(e.bowlerId)} to ${nameOf(e.strikerId) || 'batter'}`);
            if (e.isWicket) parts.push('OUT!');
            else if (e.extra) parts.push(`${e.extra} +${e.extraRuns + e.runs}`);
            else parts.push(runs === 0 ? 'no run' : `${runs} run${runs > 1 ? 's' : ''}`);

            return (
              <div className="comm-row" key={e.id}>
                <span className="comm-ball">#{ballNo}</span>
                <span className={outClass}>{label}</span>
                <span className="comm-text">
                  {parts.join(' · ')}
                  {e.transcript && (
                    <em style={{ color: 'var(--text-3)', display: 'block', fontSize: 11 }}>
                      “{e.transcript}”
                    </em>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
