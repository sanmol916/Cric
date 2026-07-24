import type {
  BallEvent,
  DismissalType,
  ExtraType,
  InningsSummary,
  MatchState,
  Team,
} from '../types';
import { previewChanges } from '../lib/scoring';

export type DraftEvent = Omit<BallEvent, 'id' | 'timestamp'>;

interface Props {
  draft: DraftEvent;
  notes: string[];
  state: MatchState;
  summary: InningsSummary;
  battingTeam: Team;
  bowlingTeam: Team;
  onChange: (draft: DraftEvent) => void;
  onApprove: () => void;
  onCancel: () => void;
}

const RUN_OPTIONS = [0, 1, 2, 3, 4, 6];
const EXTRA_OPTIONS: { value: ExtraType; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'wide', label: 'Wide' },
  { value: 'noball', label: 'No ball' },
  { value: 'bye', label: 'Bye' },
  { value: 'legbye', label: 'Leg bye' },
];
const DISMISSALS: { value: DismissalType; label: string }[] = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'lbw', label: 'LBW' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'runout', label: 'Run out' },
  { value: 'other', label: 'Other' },
];

export function PendingChanges({
  draft,
  notes,
  state,
  battingTeam,
  bowlingTeam,
  onChange,
  onApprove,
  onCancel,
}: Props) {
  const innings = state.innings[state.currentInningsIndex];
  const changes = previewChanges(innings, state.teams, {
    ...draft,
    id: 'preview',
    timestamp: 0,
  });

  const set = (patch: Partial<DraftEvent>) => onChange({ ...draft, ...patch });

  const setExtra = (extra: ExtraType) => {
    set({
      extra,
      extraRuns: extra === 'wide' || extra === 'noball' ? Math.max(1, draft.extraRuns || 1) : 0,
      isLegalDelivery: extra !== 'wide' && extra !== 'noball',
    });
  };

  return (
    <div className="card card-pad pending">
      <h3 className="card-title">Review this ball before approving</h3>

      {draft.transcript && (
        <div className="chip" style={{ marginBottom: 12 }}>
          Heard: <b>&nbsp;“{draft.transcript}”</b>
        </div>
      )}

      {notes.map((n, i) => (
        <div className="note" key={i}>
          <span>⚠️</span>
          <span>{n}</span>
        </div>
      ))}

      {/* Editable fields */}
      <div className="editgrid">
        <div className="field" style={{ margin: 0 }}>
          <label>Bowler</label>
          <select
            className="select"
            value={draft.bowlerId ?? ''}
            onChange={(e) => set({ bowlerId: e.target.value || undefined })}
          >
            <option value="">— select —</option>
            {bowlingTeam.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label>Batter on strike</label>
          <select
            className="select"
            value={draft.strikerId ?? ''}
            onChange={(e) => set({ strikerId: e.target.value || undefined })}
          >
            <option value="">— select —</option>
            {battingTeam.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Runs (off the bat / byes)</label>
        <div className="pill-group">
          {RUN_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              className={`pill ${draft.runs === r ? 'sel' : ''}`}
              onClick={() => set({ runs: r })}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Extra</label>
        <div className="pill-group">
          {EXTRA_OPTIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              className={`pill ${draft.extra === o.value ? 'sel' : ''}`}
              onClick={() => setExtra(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="row" style={{ gap: 8 }}>
          <input
            type="checkbox"
            checked={draft.isWicket}
            onChange={(e) =>
              set({
                isWicket: e.target.checked,
                dismissalType: e.target.checked ? draft.dismissalType ?? 'bowled' : undefined,
                outPlayerId: e.target.checked ? draft.outPlayerId ?? draft.strikerId : undefined,
              })
            }
          />
          Wicket fell
        </label>
        {draft.isWicket && (
          <div className="editgrid" style={{ marginTop: 8 }}>
            <select
              className="select"
              value={draft.dismissalType ?? 'bowled'}
              onChange={(e) => set({ dismissalType: e.target.value as DismissalType })}
            >
              {DISMISSALS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={draft.outPlayerId ?? ''}
              onChange={(e) => set({ outPlayerId: e.target.value || undefined })}
            >
              <option value="">Who is out?</option>
              {battingTeam.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* Diff preview */}
      <h3 className="card-title">Resulting changes</h3>
      <div className="diff">
        {changes.map((c, i) => (
          <div className="diff-row" key={i}>
            <span className="label">{c.label}</span>
            <span className="before">{c.before}</span>
            <span className="arrow">→</span>
            <span className="after">{c.after}</span>
          </div>
        ))}
      </div>

      <div className="row mt">
        <button className="btn btn-primary btn-lg btn-block" onClick={onApprove}>
          ✓ Approve &amp; apply
        </button>
        <button className="btn btn-ghost btn-lg" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
