import { useState } from 'react';
import { makeTeam, useMatch } from '../store/matchStore';

interface TeamDraft {
  name: string;
  players: string[];
}

const blankTeam = (name: string): TeamDraft => ({
  name,
  players: ['', '', ''],
});

export function SetupScreen() {
  const { dispatch } = useMatch();
  const [teamA, setTeamA] = useState<TeamDraft>(() => blankTeam('Royal Strikers'));
  const [teamB, setTeamB] = useState<TeamDraft>(() => blankTeam('Crimson Kings'));
  const [overs, setOvers] = useState(20);

  const canStart =
    teamA.name.trim() &&
    teamB.name.trim() &&
    teamA.players.filter((p) => p.trim()).length >= 2 &&
    teamB.players.filter((p) => p.trim()).length >= 2;

  const start = () => {
    const tA = makeTeam(teamA.name, teamA.players);
    const tB = makeTeam(teamB.name, teamB.players);
    dispatch({ type: 'SETUP', teams: [tA, tB], oversLimit: overs });
  };

  return (
    <div className="grid grid-2">
      <TeamEditor label="Team A (bats first)" team={teamA} onChange={setTeamA} />
      <TeamEditor label="Team B" team={teamB} onChange={setTeamB} />

      <div className="card card-pad" style={{ gridColumn: '1 / -1' }}>
        <h3 className="card-title">Match settings</h3>
        <div className="row row-wrap" style={{ justifyContent: 'space-between' }}>
          <div className="field" style={{ width: 200, margin: 0 }}>
            <label>Overs per innings</label>
            <input
              className="input"
              type="number"
              min={1}
              max={50}
              value={overs}
              onChange={(e) => setOvers(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <button className="btn btn-primary btn-lg" onClick={start} disabled={!canStart}>
            🏏 Start match
          </button>
        </div>
        {!canStart && (
          <p className="muted mt">Add at least 2 players to each team and name both teams to begin.</p>
        )}
      </div>
    </div>
  );
}

interface EditorProps {
  label: string;
  team: TeamDraft;
  onChange: (t: TeamDraft) => void;
}

function TeamEditor({ label, team, onChange }: EditorProps) {
  const setPlayer = (i: number, value: string) => {
    const players = [...team.players];
    players[i] = value;
    onChange({ ...team, players });
  };
  const addPlayer = () => onChange({ ...team, players: [...team.players, ''] });
  const removePlayer = (i: number) =>
    onChange({ ...team, players: team.players.filter((_, idx) => idx !== i) });

  return (
    <div className="card card-pad">
      <h3 className="card-title">{label}</h3>
      <div className="field">
        <label>Team name</label>
        <input
          className="input"
          value={team.name}
          placeholder="Team name"
          onChange={(e) => onChange({ ...team, name: e.target.value })}
        />
      </div>
      <label className="muted" style={{ display: 'block', marginBottom: 8 }}>
        Players (batting order)
      </label>
      <div className="player-rows">
        {team.players.map((p, i) => (
          <div className="player-row" key={i}>
            <span className="idx">{i + 1}</span>
            <input
              className="input"
              value={p}
              placeholder={`Player ${i + 1}`}
              onChange={(e) => setPlayer(i, e.target.value)}
            />
            <button
              className="icon-btn"
              onClick={() => removePlayer(i)}
              title="Remove"
              disabled={team.players.length <= 1}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="btn btn-ghost mt" onClick={addPlayer}>
        + Add player
      </button>
    </div>
  );
}
