import type { MatchState, Team } from '../types';
import { useMatch } from '../store/matchStore';

interface Props {
  state: MatchState;
  battingTeam: Team;
  bowlingTeam: Team;
  hasPending: boolean;
}

export function ControlPanel({ state, battingTeam, bowlingTeam, hasPending }: Props) {
  const { dispatch } = useMatch();

  return (
    <div className="card card-pad">
      <h3 className="card-title">On field</h3>

      <div className="field">
        <label>Striker *</label>
        <select
          className="select"
          value={state.strikerId ?? ''}
          onChange={(e) => dispatch({ type: 'SET_STRIKER', playerId: e.target.value || undefined })}
        >
          <option value="">— select striker —</option>
          {battingTeam.players.map((p) => (
            <option key={p.id} value={p.id} disabled={p.id === state.nonStrikerId}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Non-striker</label>
        <select
          className="select"
          value={state.nonStrikerId ?? ''}
          onChange={(e) => dispatch({ type: 'SET_NON_STRIKER', playerId: e.target.value || undefined })}
        >
          <option value="">— select non-striker —</option>
          {battingTeam.players.map((p) => (
            <option key={p.id} value={p.id} disabled={p.id === state.strikerId}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Bowler</label>
        <select
          className="select"
          value={state.bowlerId ?? ''}
          onChange={(e) => dispatch({ type: 'SET_BOWLER', playerId: e.target.value || undefined })}
        >
          <option value="">— select bowler —</option>
          {bowlingTeam.players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row row-wrap mt">
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'SWAP_STRIKE' })}>
          ⇄ Swap strike
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'UNDO_LAST' })}
          disabled={hasPending}
          title="Remove the last recorded ball"
        >
          ↺ Undo ball
        </button>
      </div>

      <div className="divider" />

      <div className="row row-wrap">
        {state.status !== 'complete' && (
          <button
            className="btn btn-danger"
            onClick={() => {
              const msg =
                state.currentInningsIndex === 0
                  ? 'End the first innings and start the chase?'
                  : 'End the match?';
              if (window.confirm(msg)) dispatch({ type: 'END_INNINGS' });
            }}
          >
            {state.currentInningsIndex === 0 ? '⏭ End innings' : '🏁 End match'}
          </button>
        )}
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('Start a brand new match? Current match will be cleared.'))
              dispatch({ type: 'RESET' });
          }}
        >
          + New match
        </button>
      </div>
    </div>
  );
}
