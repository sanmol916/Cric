import { useMemo, useState } from 'react';
import { MatchProvider, useMatch } from './store/matchStore';
import { computeInnings } from './lib/scoring';
import { parseTranscript } from './lib/parser';
import { SetupScreen } from './components/SetupScreen';
import { Scoreboard } from './components/Scoreboard';
import { Scorecard, Commentary } from './components/Scorecard';
import { VoicePanel } from './components/VoicePanel';
import { ControlPanel } from './components/ControlPanel';
import { PendingChanges, type DraftEvent } from './components/PendingChanges';
import type { Team } from './types';

function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">🏏</div>
        <div>
          <div className="brand-title">
            Voice<span>Score</span> Cricket
          </div>
          <div className="brand-sub">Speak the ball · review · approve</div>
        </div>
      </div>
      <span className="badge">Web Speech · Hindi &amp; English</span>
    </header>
  );
}

function LiveView() {
  const { state, dispatch } = useMatch();
  const [draft, setDraft] = useState<DraftEvent | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const innings = state.innings[state.currentInningsIndex];
  const battingTeam = state.teams.find((t) => t.id === innings.battingTeamId) as Team;
  const bowlingTeam = state.teams.find((t) => t.id === innings.bowlingTeamId) as Team;
  const summary = useMemo(
    () => computeInnings(innings, state.teams),
    [innings, state.teams],
  );

  const handleParse = (transcript: string) => {
    const result = parseTranscript(transcript, {
      battingPlayers: battingTeam.players,
      bowlingPlayers: bowlingTeam.players,
      currentStrikerId: state.strikerId,
      currentNonStrikerId: state.nonStrikerId,
      currentBowlerId: state.bowlerId,
    });
    setDraft(result.event);
    setNotes(result.notes);
  };

  const startBlank = () => {
    setDraft({
      strikerId: state.strikerId,
      nonStrikerId: state.nonStrikerId,
      bowlerId: state.bowlerId,
      runs: 0,
      extra: null,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });
    setNotes([]);
  };

  const approve = () => {
    if (!draft) return;
    dispatch({ type: 'COMMIT_BALL', event: draft });
    setDraft(null);
    setNotes([]);
  };

  const cancel = () => {
    setDraft(null);
    setNotes([]);
  };

  if (state.status === 'complete') {
    return (
      <>
        <Scoreboard state={state} summary={summary} battingTeam={battingTeam} />
        <div className="card card-pad center mt">
          <div className="empty-state">
            <div className="big">🏆</div>
            <h2 style={{ margin: '0 0 6px' }}>Match complete</h2>
            <p className="muted">Full scorecard below. Start a new match from the panel.</p>
          </div>
        </div>
        <div className="mt">
          <Scorecard summary={summary} state={state} />
        </div>
        <div className="mt">
          <ControlPanel
            state={state}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            hasPending={false}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Scoreboard state={state} summary={summary} battingTeam={battingTeam} />

      <div className="grid grid-main mt">
        <div className="grid">
          {draft ? (
            <PendingChanges
              draft={draft}
              notes={notes}
              state={state}
              summary={summary}
              battingTeam={battingTeam}
              bowlingTeam={bowlingTeam}
              onChange={setDraft}
              onApprove={approve}
              onCancel={cancel}
            />
          ) : (
            <>
              <VoicePanel onParse={handleParse} />
              <button className="btn btn-ghost btn-block" onClick={startBlank}>
                + Add ball manually (no voice)
              </button>
            </>
          )}
          <Commentary state={state} />
        </div>

        <ControlPanel
          state={state}
          battingTeam={battingTeam}
          bowlingTeam={bowlingTeam}
          hasPending={draft !== null}
        />
      </div>

      <div className="mt">
        <Scorecard summary={summary} state={state} />
      </div>
    </>
  );
}

function Shell() {
  const { state } = useMatch();
  return (
    <div className="app">
      <Header />
      {state.status === 'setup' ? <SetupScreen /> : <LiveView />}
    </div>
  );
}

export default function App() {
  return (
    <MatchProvider>
      <Shell />
    </MatchProvider>
  );
}
