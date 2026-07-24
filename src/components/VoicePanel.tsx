import { useSpeech } from '../lib/useSpeech';

interface Props {
  onParse: (transcript: string) => void;
  disabled?: boolean;
}

export function VoicePanel({ onParse, disabled }: Props) {
  const speech = useSpeech('hi-IN');

  const toggle = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      speech.reset();
      speech.start();
    }
  };

  const submit = () => {
    const text = (speech.finalTranscript + ' ' + speech.interim).trim();
    if (!text) return;
    if (speech.listening) speech.stop();
    onParse(text);
    speech.reset();
  };

  const shownText = (speech.finalTranscript + (speech.interim ? ' ' + speech.interim : '')).trim();

  return (
    <div className="card card-pad voice">
      <h3 className="card-title" style={{ justifyContent: 'center' }}>
        Voice input
      </h3>

      {!speech.supported ? (
        <div className="note" style={{ textAlign: 'left' }}>
          <span>⚠️</span>
          <span>
            Your browser does not support speech recognition. Use Chrome or Edge on desktop, or
            type the commentary manually below.
          </span>
        </div>
      ) : (
        <>
          <button
            className={`mic-btn ${speech.listening ? 'on' : ''}`}
            onClick={toggle}
            disabled={disabled}
            title={speech.listening ? 'Stop' : 'Start recording'}
          >
            {speech.listening ? '⏹' : '🎙️'}
          </button>
          <div className="mic-hint">
            {speech.listening
              ? 'Listening… say what happened this ball'
              : 'Tap the mic and describe the ball'}
          </div>

          <div className="row" style={{ justifyContent: 'center', marginBottom: 12 }}>
            <label className="muted">Language</label>
            <select
              className="select"
              style={{ width: 'auto' }}
              value={speech.lang}
              onChange={(e) => speech.setLang(e.target.value)}
            >
              <option value="hi-IN">Hindi / Hinglish</option>
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
        </>
      )}

      <div className={`transcript ${shownText ? '' : 'empty'}`}>
        {shownText ? (
          <>
            {speech.finalTranscript}
            {speech.interim && <span className="interim"> {speech.interim}</span>}
          </>
        ) : (
          'e.g. “rahul ne dusri bowl karwai aur pritam ne single run liya”'
        )}
      </div>

      {speech.error && (
        <div className="note mt" style={{ textAlign: 'left' }}>
          <span>⚠️</span>
          <span>{speech.error}</span>
        </div>
      )}

      <div className="row mt" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={submit} disabled={disabled || !shownText}>
          ✓ Review changes
        </button>
        <button className="btn btn-ghost" onClick={speech.reset} disabled={!shownText}>
          Clear
        </button>
      </div>

      <ManualEntry onParse={onParse} disabled={disabled} />
    </div>
  );
}

function ManualEntry({ onParse, disabled }: Props) {
  return (
    <details className="mt" style={{ textAlign: 'left' }}>
      <summary className="muted" style={{ cursor: 'pointer' }}>
        Prefer typing? Enter commentary manually
      </summary>
      <form
        className="row mt"
        onSubmit={(e) => {
          e.preventDefault();
          const input = (e.currentTarget.elements.namedItem('cmd') as HTMLInputElement);
          if (input.value.trim()) {
            onParse(input.value.trim());
            input.value = '';
          }
        }}
      >
        <input
          className="input"
          name="cmd"
          placeholder="rahul ne chauka mara"
          disabled={disabled}
        />
        <button className="btn" type="submit" disabled={disabled}>
          Parse
        </button>
      </form>
    </details>
  );
}
